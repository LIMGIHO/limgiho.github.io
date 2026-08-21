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

    def test_case_story_is_problem_decision_result_not_card_grid(self):
        layout = (ROOT / "_layouts/portfolio-test2.html").read_text(encoding="utf-8")
        for include in ("case-study", "operations", "career", "products", "footer"):
            self.assertIn(f"portfolio-test2/{include}.html", layout)

        case = (ROOT / "_includes/portfolio-test2/case-study.html").read_text(encoding="utf-8")
        for label in ("문제", "제약", "결정", "결과"):
            self.assertIn(label, case)
        self.assertIn("<details", case)

    def test_product_images_are_real_portfolio_assets(self):
        products = (ROOT / "_includes/portfolio-test2/products.html").read_text(encoding="utf-8")

        self.assertIn("assets/portfolio/screenshots", products)
        self.assertIn("loading=\"lazy\"", products)

    def test_mobile_contract_has_large_targets_without_horizontal_diagram_scroll(self):
        source = (ROOT / "_sass/portfolio-test2/_responsive.scss").read_text(encoding="utf-8")

        self.assertIn("@media (max-width: 760px)", source)
        self.assertIn("min-height: 44px", source)
        self.assertNotIn("overflow-x: auto", source)

    def test_build_contains_route_and_direction_seed(self):
        built = ROOT / "_site/test2/index.html"

        self.assertTrue(built.exists())
        self.assertIn("9d7999ee", built.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
