from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class TestPortfolioStyles(unittest.TestCase):
    def test_architecture_scope_labels_wrap_unbroken_flow_text(self):
        source = (ROOT / "_sass/portfolio/_architecture.scss").read_text(encoding="utf-8")
        block = source.rsplit(".architecture-scope-list span {", 1)[1].split("}", 1)[0]

        self.assertIn("overflow-wrap: anywhere;", block)


if __name__ == "__main__":
    unittest.main()
