import importlib.util
import copy
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VERIFY_PATH = ROOT / "scripts" / "verify-portfolio.py"


def load_verifier():
    spec = importlib.util.spec_from_file_location("verify_portfolio", VERIFY_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class PortfolioVerifierBootstrapTests(unittest.TestCase):
    def test_verifier_module_exists(self):
        self.assertTrue(VERIFY_PATH.is_file(), "portfolio verifier module is missing")

    def test_verifier_exposes_source_contract(self):
        verify = load_verifier()
        self.assertTrue(hasattr(verify, "load_yaml"))
        self.assertTrue(hasattr(verify, "validate_source"))
        self.assertTrue(hasattr(verify, "REQUIRED_DECISION_IDS"))

    def test_load_yaml_uses_the_repository_ruby_runtime(self):
        verify = load_verifier()
        with tempfile.NamedTemporaryFile("w", suffix=".yml", encoding="utf-8") as handle:
            handle.write("profile:\n  theme: ice-blue\n")
            handle.flush()
            self.assertEqual(
                verify.load_yaml(Path(handle.name)),
                {"profile": {"theme": "ice-blue"}},
            )


class PortfolioSourceContractTests(unittest.TestCase):
    def setUp(self):
        self.verify = load_verifier()
        decision_ids = {
            "integration",
            "frontend-slices",
            "typed-boundaries",
            "incremental-migration",
            "worker-contract",
            "distributed-cron",
            "private-llm",
            "llm-evaluation",
            "adapter-boundary",
            "affected-deploy",
        }
        self.content = {
            "metrics": [
                {"id": "legacy-integration", "source": "경력기술서"},
                {"id": "work-screens", "source": "아키텍처"},
            ],
            "flagship": {
                "decisions": [
                    {
                        "id": decision_id,
                        "title": decision_id,
                        "problem": "문제",
                        "alternative": "검토",
                        "choice": "선택",
                        "result": "결과",
                    }
                    for decision_id in sorted(decision_ids)
                ]
            },
            "automation": {"title": "외부 업무 시스템 입력 자동화"},
        }
        self.profiles = {
            "default": {
                "metrics": ["legacy-integration"],
                "featured_decisions": ["incremental-migration"],
            },
            "kakao": {
                "metrics": ["work-screens"],
                "featured_decisions": ["frontend-slices"],
            },
        }

    def test_valid_contract_has_no_errors(self):
        self.assertEqual(self.verify.validate_source(self.content, self.profiles), [])

    def test_all_ten_decisions_are_required(self):
        self.assertEqual(
            {item["id"] for item in self.content["flagship"]["decisions"]},
            self.verify.REQUIRED_DECISION_IDS,
        )

    def test_unknown_profile_reference_fails(self):
        profiles = copy.deepcopy(self.profiles)
        profiles["default"]["featured_decisions"].append("missing-decision")
        errors = self.verify.validate_source(self.content, profiles)
        self.assertTrue(any("missing-decision" in error for error in errors))

    def test_missing_metric_source_fails(self):
        content = copy.deepcopy(self.content)
        content["metrics"][0]["source"] = ""
        errors = self.verify.validate_source(content, self.profiles)
        self.assertTrue(any("source" in error for error in errors))

    def test_proprietary_client_name_fails(self):
        content = copy.deepcopy(self.content)
        content["automation"]["title"] = "삼성 NERP 자동화"
        errors = self.verify.validate_source(content, self.profiles)
        self.assertTrue(any("익명화" in error for error in errors))

    def test_incomplete_decision_fails(self):
        content = copy.deepcopy(self.content)
        del content["flagship"]["decisions"][0]["alternative"]
        errors = self.verify.validate_source(content, self.profiles)
        self.assertTrue(any("alternative" in error for error in errors))

    def test_repository_canonical_source_is_valid(self):
        content_path = ROOT / "_data" / "portfolio.yml"
        profiles_path = ROOT / "_data" / "portfolio_profiles.yml"
        self.assertTrue(content_path.is_file(), "canonical portfolio data is missing")
        self.assertTrue(profiles_path.is_file(), "portfolio profile data is missing")
        content = self.verify.load_yaml(content_path)
        profiles = self.verify.load_yaml(profiles_path)
        self.assertEqual(self.verify.validate_source(content, profiles), [])

    def test_source_only_cli_reports_success(self):
        completed = subprocess.run(
            ["python3", str(VERIFY_PATH), "--source-only"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
        self.assertIn("PASS: portfolio source contract", completed.stdout)


class PortfolioRenderedContractTests(unittest.TestCase):
    def setUp(self):
        self.verify = load_verifier()

    def test_rendered_contract_api_exists(self):
        self.assertTrue(hasattr(self.verify, "RENDERED_PROFILES"))
        self.assertTrue(hasattr(self.verify, "validate_rendered"))

    def test_rendered_profiles_have_shell_and_correct_theme(self):
        self.assertTrue(hasattr(self.verify, "validate_rendered"))
        errors = self.verify.validate_rendered(ROOT / "_site")
        self.assertEqual(errors, [])

    def test_site_cli_reports_source_and_rendered_success(self):
        completed = subprocess.run(
            ["python3", str(VERIFY_PATH), "--site-dir", "_site"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertIn("PASS: portfolio source contract", completed.stdout)
        self.assertIn("PASS: portfolio rendered contract", completed.stdout)

    def test_rendered_profiles_include_four_journey_steps(self):
        journey_ids = (
            "iljin-foundation",
            "iljin-lead",
            "kwe-automation",
            "kwe-platform",
        )
        for relative_path, _theme in self.verify.RENDERED_PROFILES.values():
            text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
            self.assertIn('id="career-journey"', text)
            self.assertEqual(text.count("data-journey-item"), 4)
            for journey_id in journey_ids:
                self.assertIn(f'id="journey-{journey_id}"', text)

    def test_journey_script_has_accessible_fallbacks(self):
        script_path = ROOT / "assets" / "js" / "portfolio.js"
        self.assertTrue(script_path.is_file(), "portfolio enhancement script is missing")
        script = script_path.read_text(encoding="utf-8")
        for phrase in ("IntersectionObserver", "prefers-reduced-motion", "is-current"):
            self.assertIn(phrase, script)

    def test_rendered_validator_rejects_missing_journey(self):
        with tempfile.TemporaryDirectory() as directory:
            site_dir = Path(directory)
            shutil.copytree(ROOT / "_site", site_dir, dirs_exist_ok=True)
            default_html = site_dir / "index.html"
            text = default_html.read_text(encoding="utf-8")
            default_html.write_text(
                text.replace('id="career-journey"', 'id="journey-removed"', 1),
                encoding="utf-8",
            )
            errors = self.verify.validate_rendered(site_dir)
            self.assertTrue(any("career-journey" in error for error in errors))

    def test_rendered_flagship_preserves_all_decisions(self):
        profile_featured = {
            "default": (
                "incremental-migration",
                "typed-boundaries",
                "worker-contract",
            ),
            "kakao": (
                "frontend-slices",
                "typed-boundaries",
                "incremental-migration",
            ),
        }
        for profile_name, (relative_path, _theme) in self.verify.RENDERED_PROFILES.items():
            text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
            self.assertIn('id="flagship"', text)
            self.assertIn('id="architecture-before-after"', text)
            self.assertEqual(text.count("data-decision-id="), 10)
            self.assertEqual(text.count("decision-card is-featured"), 3)
            for decision_id in self.verify.REQUIRED_DECISION_IDS:
                self.assertIn(f'data-decision-id="{decision_id}"', text)
            featured_positions = [
                text.index(f'data-decision-id="{decision_id}"')
                for decision_id in profile_featured[profile_name]
            ]
            self.assertEqual(featured_positions, sorted(featured_positions))
            for label in ("문제", "검토", "선택", "결과"):
                self.assertIn(f"<dt>{label}</dt>", text)

    def test_decision_script_restores_content_for_print(self):
        script = (ROOT / "assets" / "js" / "portfolio.js").read_text(encoding="utf-8")
        for phrase in (
            "data-decision-id",
            "aria-expanded",
            "beforeprint",
            "afterprint",
            "detail.hidden",
        ):
            self.assertIn(phrase, script)

    def test_rendered_validator_rejects_missing_decision(self):
        with tempfile.TemporaryDirectory() as directory:
            site_dir = Path(directory)
            shutil.copytree(ROOT / "_site", site_dir, dirs_exist_ok=True)
            default_html = site_dir / "index.html"
            text = default_html.read_text(encoding="utf-8")
            default_html.write_text(
                text.replace('data-decision-id="integration"', 'data-removed="integration"', 1),
                encoding="utf-8",
            )
            errors = self.verify.validate_rendered(site_dir)
            self.assertTrue(any("decision" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
