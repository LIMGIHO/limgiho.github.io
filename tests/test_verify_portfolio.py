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
        self.assertTrue(hasattr(verify, "REQUIRED_ARCHITECTURE_NODE_IDS"))
        self.assertTrue(hasattr(verify, "REQUIRED_ARCHITECTURE_FLOWS"))

    def test_verifier_exposes_pdf_contract(self):
        verify = load_verifier()
        self.assertTrue(hasattr(verify, "PDF_PROFILES"))
        self.assertTrue(hasattr(verify, "validate_pdf"))

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
        node_ids = {
            "web",
            "api",
            "queue",
            "worker",
            "batch",
            "external",
            "local-llm",
            "data",
            "cicd",
        }
        node_fields = {
            "label": "구성요소",
            "tech": "기술",
            "kind": "app",
            "boundary": "application",
            "summary": "요약",
            "implementation": "구현",
            "structure": "구조",
            "operation": "운영",
            "inputs": "입력",
            "outputs": "출력",
            "contract": "계약",
            "deployment": "배포",
            "x": 10,
            "y": 10,
            "width": 100,
            "height": 70,
        }
        self.content = {
            "metrics": [
                {"id": "legacy-integration", "source": "경력기술서"},
                {"id": "work-screens", "source": "아키텍처"},
            ],
            "flagship": {
                "scope_summary": ["15종 시스템 분석", "90+ 화면 구현"],
                "nodes": [
                    {"id": node_id, **node_fields}
                    for node_id in sorted(node_ids)
                ],
                "edges": [
                    {
                        "id": "web-api",
                        "from": "web",
                        "to": "api",
                        "flow": "sync",
                        "label": "REST",
                        "path": "M10 10 H20",
                        "label_x": 15,
                        "label_y": 8,
                    },
                    {
                        "id": "api-queue",
                        "from": "api",
                        "to": "queue",
                        "flow": "async",
                        "label": "enqueue",
                        "path": "M10 10 H20",
                        "label_x": 15,
                        "label_y": 8,
                    },
                    {
                        "id": "cicd-runtime",
                        "from": "cicd",
                        "to": "web",
                        "flow": "delivery",
                        "label": "SHA image deploy",
                        "path": "M10 10 H20",
                        "label_x": 15,
                        "label_y": 8,
                    },
                ],
                "pipeline": {
                    "steps": ["변경 앱 감지", "Test", "Kaniko Build", "Swarm Deploy"]
                },
            },
            "automation": {"title": "외부 업무 시스템 입력 자동화"},
        }
        self.profiles = {
            "default": {
                "metrics": ["legacy-integration"],
            },
            "kakao": {
                "metrics": ["work-screens"],
            },
        }

    def test_valid_contract_has_no_errors(self):
        self.assertEqual(self.verify.validate_source(self.content, self.profiles), [])

    def test_all_ten_architecture_nodes_are_required(self):
        self.assertEqual(
            {item["id"] for item in self.content["flagship"]["nodes"]},
            self.verify.REQUIRED_ARCHITECTURE_NODE_IDS,
        )

    def test_all_four_architecture_flows_are_required(self):
        self.assertEqual(
            {item["flow"] for item in self.content["flagship"]["edges"]},
            self.verify.REQUIRED_ARCHITECTURE_FLOWS,
        )

    def test_unknown_edge_endpoint_fails(self):
        content = copy.deepcopy(self.content)
        content["flagship"]["edges"][0]["to"] = "missing-node"
        errors = self.verify.validate_source(content, self.profiles)
        self.assertTrue(any("missing-node" in error for error in errors))

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

    def test_incomplete_architecture_node_fails(self):
        content = copy.deepcopy(self.content)
        del content["flagship"]["nodes"][0]["deployment"]
        errors = self.verify.validate_source(content, self.profiles)
        self.assertTrue(any("deployment" in error for error in errors))

    def test_incomplete_architecture_edge_fails(self):
        content = copy.deepcopy(self.content)
        del content["flagship"]["edges"][0]["label"]
        errors = self.verify.validate_source(content, self.profiles)
        self.assertTrue(any("label" in error for error in errors))

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

    def test_rendered_profiles_start_with_factual_career_journey(self):
        for relative_path, _theme in self.verify.RENDERED_PROFILES.values():
            text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
            self.assertNotIn('class="portfolio-hero"', text)
            self.assertIn('<h2 id="journey-title">주요 경력</h2>', text)
            self.assertIn(
                "제조·물류 시스템을 개발하고 운영해 온 경험을 시간순으로 정리했습니다.",
                text,
            )
            self.assertNotIn("개발에서 플랫폼 책임까지", text)
            self.assertLess(
                text.index('id="career-journey"'),
                text.index('id="flagship"'),
            )

    def test_journey_script_has_accessible_fallbacks(self):
        script_path = ROOT / "assets" / "js" / "portfolio.js"
        self.assertTrue(script_path.is_file(), "portfolio enhancement script is missing")
        script = script_path.read_text(encoding="utf-8")
        for phrase in ("IntersectionObserver", "prefers-reduced-motion", "is-current"):
            self.assertIn(phrase, script)

    def test_architecture_script_supports_mouse_and_keyboard_selection(self):
        script = (ROOT / "assets" / "js" / "portfolio.js").read_text(encoding="utf-8")
        for phrase in (
            "initArchitecture",
            "data-architecture-node",
            "data-architecture-mobile-node",
            "architecture-data",
            "aria-pressed",
            "event.key === 'Enter'",
            "event.key === ' '",
            "data-architecture-detail",
            "is-related",
        ):
            self.assertIn(phrase, script)
        for retired in ("initDecisionCards", "data-decision-id", "beforeprint"):
            self.assertNotIn(retired, script)

    def test_architecture_styles_cover_kinds_flows_and_mobile_layout(self):
        styles = (ROOT / "assets" / "css" / "portfolio.scss").read_text(encoding="utf-8")
        for selector in (
            ".architecture-node-app",
            ".architecture-node-infra",
            ".architecture-node-boundary",
            ".architecture-node-pipeline",
            ".architecture-edge-sync",
            ".architecture-edge-async",
            ".architecture-edge-delivery",
            ".architecture-detail-grid",
            ".architecture-mobile-node",
        ):
            self.assertIn(selector, styles)

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

    def test_rendered_flagship_is_an_implementation_architecture(self):
        for relative_path, _theme in self.verify.RENDERED_PROFILES.values():
            text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
            self.assertIn('id="flagship"', text)
            self.assertIn('id="implementation-architecture"', text)
            self.assertIn('<p class="section-number">02 · 통합 업무 플랫폼 개발</p>', text)
            self.assertEqual(text.count("data-architecture-node="), 9)
            self.assertEqual(text.count("data-architecture-mobile-node="), 9)
            self.assertEqual(text.count("data-architecture-edge="), 9)
            self.assertEqual(text.count("data-edge-from="), 9)
            self.assertEqual(text.count("data-edge-to="), 9)
            self.assertEqual(text.count("data-architecture-boundary="), 4)
            for node_id in self.verify.REQUIRED_ARCHITECTURE_NODE_IDS:
                self.assertIn(f'data-architecture-node="{node_id}"', text)
                self.assertIn(f'data-architecture-mobile-node="{node_id}"', text)
            for phrase in (
                "PRESENTATION",
                "ASYNC EXECUTION",
                "INTEGRATION & DATA",
                "DELIVERY",
                "REST",
                "enqueue contract",
                "consume contract",
                "repository",
                "port / adapter",
                "internal HTTP",
                "job execution",
                "SHA image deploy",
            ):
                self.assertIn(phrase, text)
            for phrase in (
                "FLAGSHIP CASE",
                "OUTCOMES",
                "SUPPORTING EVIDENCE",
                "ENGINEERING DECISIONS",
                "data-decision-id",
            ):
                self.assertNotIn(phrase, text)

    def test_architecture_has_readable_mobile_fallback(self):
        for relative_path, _theme in self.verify.RENDERED_PROFILES.values():
            text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
            self.assertIn('id="architecture-mobile"', text)
            self.assertEqual(text.count("data-architecture-mobile-node="), 9)
            self.assertIn('id="architecture-detail"', text)
            for phrase in ("Web", "API", "Queue", "Worker", "External Adapters"):
                self.assertIn(phrase, text)

    def test_rendered_validator_rejects_missing_architecture_node(self):
        with tempfile.TemporaryDirectory() as directory:
            site_dir = Path(directory)
            shutil.copytree(ROOT / "_site", site_dir, dirs_exist_ok=True)
            default_html = site_dir / "index.html"
            text = default_html.read_text(encoding="utf-8")
            default_html.write_text(
                text.replace('data-architecture-node="web"', 'data-removed="web"', 1),
                encoding="utf-8",
            )
            errors = self.verify.validate_rendered(site_dir)
            self.assertTrue(any("architecture node" in error for error in errors))

    def test_rendered_profiles_include_lower_evidence_sections(self):
        for relative_path, _theme in self.verify.RENDERED_PROFILES.values():
            text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
            for phrase in (
                'id="automation"',
                'id="experience"',
                'id="additional-work"',
                "외부 업무 시스템 입력 자동화",
                "1,200시간",
                "ILJIN Global",
                "KWE Korea",
                "Product &amp; Frontend",
            ):
                self.assertIn(phrase, text)
            for forbidden in (
                "skill-bar",
                "progress-bar",
                "aria-valuenow",
                "문의하기",
                "상담 신청",
            ):
                self.assertNotIn(forbidden, text)

    def test_rendered_validator_rejects_missing_automation(self):
        with tempfile.TemporaryDirectory() as directory:
            site_dir = Path(directory)
            shutil.copytree(ROOT / "_site", site_dir, dirs_exist_ok=True)
            default_html = site_dir / "index.html"
            text = default_html.read_text(encoding="utf-8")
            default_html.write_text(
                text.replace('id="automation"', 'id="automation-removed"', 1),
                encoding="utf-8",
            )
            errors = self.verify.validate_rendered(site_dir)
            self.assertTrue(any("automation" in error for error in errors))

    def test_compiled_css_has_themes_motion_and_print_contracts(self):
        css_path = ROOT / "_site" / "assets" / "css" / "portfolio.css"
        self.assertTrue(css_path.is_file())
        css = css_path.read_text(encoding="utf-8")
        for phrase in (
            "--accent",
            "--accent-soft",
            "--ink",
            "--muted",
            "--rule",
            ".theme-ice-blue",
            ".theme-graphite-yellow",
            "prefers-reduced-motion: reduce",
            "@media print",
            "@page",
        ):
            self.assertIn(phrase, css)
        for forbidden in ("transition: all", "@import url", "url(http"):
            self.assertNotIn(forbidden, css)

    def test_rendered_validator_rejects_missing_theme_css(self):
        with tempfile.TemporaryDirectory() as directory:
            site_dir = Path(directory)
            shutil.copytree(ROOT / "_site", site_dir, dirs_exist_ok=True)
            css_path = site_dir / "assets" / "css" / "portfolio.css"
            css = css_path.read_text(encoding="utf-8")
            css_path.write_text(
                css.replace(".theme-ice-blue", ".theme-removed", 1),
                encoding="utf-8",
            )
            errors = self.verify.validate_rendered(site_dir)
            self.assertTrue(any("theme-ice-blue" in error for error in errors))


class PortfolioPdfContractTests(unittest.TestCase):
    def setUp(self):
        self.verify = load_verifier()

    def test_pdf_builder_uses_local_http_and_atomic_outputs(self):
        build_path = ROOT / "scripts" / "build-portfolio-pdf.sh"
        self.assertTrue(build_path.is_file(), "portfolio PDF builder is missing")
        script = build_path.read_text(encoding="utf-8")
        for phrase in (
            "bundle exec jekyll build",
            "python3 -m http.server",
            "--print-to-pdf-no-header",
            "mktemp -d",
            "mv",
        ):
            self.assertIn(phrase, script)
        self.assertNotIn("rm -rf", script)

    def test_portfolio_pdf_outputs_are_not_committed_during_screen_iteration(self):
        for relative_path in self.verify.PDF_PROFILES.values():
            self.assertFalse((ROOT / relative_path).exists())


if __name__ == "__main__":
    unittest.main()
