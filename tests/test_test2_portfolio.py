from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class TestTest2Portfolio(unittest.TestCase):
    def test_test2_route_uses_dedicated_layout(self):
        source = (ROOT / "test2/index.md").read_text(encoding="utf-8")

        self.assertIn("layout: portfolio-test2", source)
        self.assertIn("permalink: /test2/", source)

    def test_layout_keeps_direction_contract_and_data_source(self):
        source = (ROOT / "_layouts/portfolio-test2.html").read_text(encoding="utf-8")

        self.assertIn("9d7999ee", source)
        self.assertIn("site.data.portfolio", source)
        self.assertIn("portfolio-test2.css", source)
        self.assertNotIn("/assets/css/portfolio.css", source)
        self.assertNotIn("portfolio/head.html", source)
        self.assertNotIn("theme-toggle", source)

    def test_existing_layout_does_not_reference_test2(self):
        source = (ROOT / "_layouts/portfolio.html").read_text(encoding="utf-8")

        self.assertNotIn("portfolio-test2", source)

    def test_first_viewport_leads_with_the_transformation(self):
        hero = (ROOT / "_includes/portfolio-test2/hero.html").read_text(encoding="utf-8")

        self.assertIn("15개의 운영 시스템", hero)
        self.assertIn("test2-transform", hero)
        self.assertIn("1,000만+", hero)
        self.assertNotIn("hero-metrics", hero)

    def test_visual_system_rejects_rounded_card_tropes(self):
        tokens = (ROOT / "_sass/portfolio-test2/_tokens.scss").read_text(encoding="utf-8")
        sources = "\n".join(
            path.read_text(encoding="utf-8")
            for path in (ROOT / "_sass/portfolio-test2").glob("*.scss")
        )

        self.assertIn("--test2-cobalt", tokens)
        self.assertNotIn("border-radius", sources)
        self.assertNotIn("box-shadow", sources)
        self.assertIn("word-break: keep-all", sources)


if __name__ == "__main__":
    unittest.main()
