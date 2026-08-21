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


if __name__ == "__main__":
    unittest.main()
