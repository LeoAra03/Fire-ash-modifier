from __future__ import annotations

import contextlib
import io
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parents[1] / "tools"
sys.path.insert(0, str(TOOLS_DIR))
import repo_helper  # noqa: E402


class RepoHelperTests(unittest.TestCase):
    def test_detects_multipart_rar_once(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            for name in ("manual.part01.rar", "manual.part02.rar", "otro.rar", "otro.r00", "ignorar.part02.rar"):
                (root / name).write_bytes(b"")
            items = repo_helper.discover_archive_sets(root, recursive=False)
            summary = [(item.kind, item.base_name, item.volume_count, item.first_volume.name) for item in items]
            self.assertEqual(
                summary,
                [("RAR", "manual", 2, "manual.part01.rar"), ("RAR", "otro", 2, "otro.rar")],
            )

    def test_detects_split_7z_and_zip(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            for name in ("data.7z.001", "data.7z.002", "photos.z01", "photos.zip"):
                (root / name).write_bytes(b"")
            items = repo_helper.discover_archive_sets(root, recursive=False)
            summary = [(item.kind, item.base_name, item.volume_count) for item in items]
            self.assertEqual(summary, [("7z", "data", 2), ("ZIP", "photos", 2)])

    def test_safe_zip_extracts_to_explicit_directory(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / "assets.zip"
            with zipfile.ZipFile(archive, "w") as zipped:
                zipped.writestr("images/logo.txt", "logo resource")
            output = root / "out"
            item = repo_helper._single_archive_item(archive)
            result = repo_helper.extract_archive_set(item, output)
            self.assertIn("extraído", result)
            self.assertEqual((output / "images" / "logo.txt").read_text(), "logo resource")

    def test_zip_path_traversal_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / "unsafe.zip"
            with zipfile.ZipFile(archive, "w") as zipped:
                zipped.writestr("../outside.txt", "must not escape")
            output = root / "out"
            output.mkdir()
            with self.assertRaises(ValueError):
                repo_helper._safe_extract_zip(archive, output)
            self.assertFalse((root / "outside.txt").exists())

    def test_inventory_prints_without_writing_reports(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "README.md").write_text("readme")
            (root / "src").mkdir()
            (root / "src" / "main.py").write_text("print('hi')")
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                result = repo_helper.inventory(root, max_depth=2)
            self.assertEqual(result, 0)
            self.assertIn("README.md", output.getvalue())
            self.assertIn("main.py", output.getvalue())
            self.assertEqual(sorted(item.name for item in root.iterdir()), ["README.md", "src"])


if __name__ == "__main__":
    unittest.main()
