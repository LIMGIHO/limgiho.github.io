from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class TestPortfolioStyles(unittest.TestCase):
    def test_intro_image_uses_compact_circle(self):
        source = (ROOT / "assets/css/custom.css").read_text(encoding="utf-8")
        block = source.split(".profile-figure .profile-image-button {", 1)[1].split("}", 1)[0]

        self.assertIn("width: 190px;", block)
        self.assertIn("border-radius: 50%;", block)

    def test_intro_opening_has_desktop_and_mobile_emphasis(self):
        source = (ROOT / "assets/css/custom.css").read_text(encoding="utf-8")
        blocks = source.split(".intro-container .hero-kicker {")[1:]

        self.assertIn("font-size: 2.1rem;", blocks[0].split("}", 1)[0])
        self.assertIn("font-size: 1.9rem;", blocks[1].split("}", 1)[0])

    def test_architecture_scope_labels_wrap_unbroken_flow_text(self):
        source = (ROOT / "_sass/portfolio/_architecture.scss").read_text(encoding="utf-8")
        block = source.rsplit(".architecture-scope-list span {", 1)[1].split("}", 1)[0]

        self.assertIn("overflow-wrap: anywhere;", block)


if __name__ == "__main__":
    unittest.main()
