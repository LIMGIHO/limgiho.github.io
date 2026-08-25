from pathlib import Path
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "applications/2026-08-22/kakaopay-server-senior-minor"
LEGACY = ROOT / "applications/2026-08-03/kakaopay-fde"


class TestPdfArchitectureAndKakaoPay(unittest.TestCase):
    def test_print_keeps_original_detail_and_screen_interaction(self):
        markup = (ROOT / "_includes/portfolio/architecture.html").read_text(encoding="utf-8")
        styles = (ROOT / "_sass/portfolio/_architecture.scss").read_text(encoding="utf-8")
        document_flow_styles = (ROOT / "_sass/portfolio/_document-flow.scss").read_text(encoding="utf-8")
        delivery_flow_styles = (ROOT / "_sass/portfolio/_delivery-flow.scss").read_text(encoding="utf-8")

        for token in (
            'class="architecture-detail"',
            'data-architecture-detail="label"',
            'data-architecture-detail="implementation"',
            'data-architecture-detail="structure"',
        ):
            self.assertIn(token, markup)
        self.assertIn("@media print", styles)
        self.assertIn(".architecture-detail {", styles)
        self.assertIn(".document-flow-map", document_flow_styles)
        self.assertIn(".delivery-flow-map", delivery_flow_styles)
        self.assertNotIn("max-width: 100%", document_flow_styles)
        self.assertNotIn("max-width: 100%", delivery_flow_styles)

    def test_new_profile_and_render_route_exist(self):
        profiles = (ROOT / "_data/portfolio_profiles.yml").read_text(encoding="utf-8")
        config = (ROOT / "_config.yml").read_text(encoding="utf-8")
        route = APP / "portfolio/index.md"

        self.assertIn("kakaopay_server_senior_minor:", profiles)
        self.assertIn("복잡한 업무 흐름을 안정적인 서버 경계로 바꿉니다", profiles)
        self.assertNotIn("- applications/\n", config)
        self.assertIn("applications/**/README.md", config)
        self.assertIn("applications/**/portfolio.pdf", config)
        self.assertTrue(route.is_file())
        route_text = route.read_text(encoding="utf-8")
        self.assertIn("portfolio_profile: kakaopay_server_senior_minor", route_text)
        self.assertIn("application_title: 카카오페이 서버 개발자 - 시니어/미성년 사용자 전용 서비스", route_text)
        self.assertIn("permalink: /applications/2026-08-22/kakaopay-server-senior-minor/portfolio/", route_text)

    def test_application_package_contains_required_files_and_evidence_guardrails(self):
        required = (
            "README.md",
            "job-posting.md",
            "fit-analysis.md",
            "cover-letter.md",
            "portfolio/index.md",
            "portfolio.pdf",
            "resume.pdf",
            "build.sh",
            "verify.py",
        )
        for relative in required:
            self.assertTrue((APP / relative).is_file(), relative)

        fit = (APP / "fit-analysis.md").read_text(encoding="utf-8")
        letter = (APP / "cover-letter.md").read_text(encoding="utf-8")
        self.assertIn("직접 근거 부족", fit)
        self.assertIn("전환 가능한 경험", fit)
        self.assertIn("Kotlin", fit)
        self.assertIn("Spring", fit)
        self.assertIn("Kubernetes", fit)
        self.assertIn("MongoDB", fit)
        self.assertIn("근거를 확인하지 못했", letter)

    def test_legacy_application_folder_has_no_worktree_changes(self):
        changed = subprocess.run(
            ["git", "diff", "--name-only", "--", str(LEGACY.relative_to(ROOT))],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
        self.assertEqual(changed, "")


if __name__ == "__main__":
    unittest.main()
