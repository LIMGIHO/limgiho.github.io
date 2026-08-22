from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class TestPortfolioPaletteVariants(unittest.TestCase):
    def test_comparison_routes_use_shared_layout_and_palette(self):
        expected = {
            "test1": ("precision", "/test1/"),
            "test2": ("product", "/test2/"),
            "test3": ("industrial", "/test3/"),
            "portfolio": ("precision", "/portfolio/"),
        }
        for route, (palette, permalink) in expected.items():
            source = (ROOT / route / "index.md").read_text(encoding="utf-8")
            self.assertIn("layout: portfolio", source)
            self.assertIn(f"portfolio_palette: {palette}", source)
            self.assertIn(f"permalink: {permalink}", source)

    def test_shared_layout_adds_palette_without_changing_root_contract(self):
        source = (ROOT / "_layouts/portfolio.html").read_text(encoding="utf-8")
        self.assertIn("page.portfolio_palette", source)
        self.assertIn("palette-{{ page.portfolio_palette }}", source)
        self.assertIn('class="portfolio theme-{{ profile.theme }}', source)

    def test_palette_tokens_define_light_and_dark_modes(self):
        source = (ROOT / "_sass/portfolio/_tokens.scss").read_text(encoding="utf-8")
        for palette in ("precision", "product", "industrial"):
            self.assertIn(f".palette-{palette}.theme-editorial", source)
            self.assertIn(f".palette-{palette}.theme-blueprint", source)

    def test_industrial_light_has_an_accessible_text_accent(self):
        source = (ROOT / "_sass/portfolio/_tokens.scss").read_text(encoding="utf-8")
        self.assertIn("--accent-text: #b94717;", source)

    def test_old_test2_implementation_is_retired(self):
        self.assertFalse((ROOT / "_layouts/portfolio-test2.html").exists())
        self.assertFalse((ROOT / "_includes/portfolio-test2").exists())
        self.assertFalse((ROOT / "_sass/portfolio-test2").exists())
        self.assertFalse((ROOT / "assets/css/portfolio-test2.scss").exists())


if __name__ == "__main__":
    unittest.main()
