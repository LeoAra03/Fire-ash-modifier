#!/usr/bin/env python3
"""Lightweight repository inventory and safe archive helper for agent workflows.

Python 3.10+. ZIP uses the standard library; RAR/7z needs an installed extractor.
The tool writes no reports, ignore files, or temporary files by default.
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import stat
import subprocess
import sys
import zipfile
from collections import Counter
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Iterable

SKIP_DIRS = {
    ".git",
    ".hg",
    ".svn",
    ".venv",
    "venv",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".tox",
    ".cache",
    ".next",
    ".nuxt",
    ".output",
    ".turbo",
    "build",
    "dist",
    "coverage",
    "target",
    "out",
}
MAX_INVENTORY_FILES = 50_000
MAX_TREE_ENTRIES = 180

RAR_PART_RE = re.compile(r"(?P<base>.+)\.part(?P<number>\d+)\.rar$", re.IGNORECASE)
SEVEN_PART_RE = re.compile(r"(?P<base>.+)\.7z\.(?P<number>\d{3})$", re.IGNORECASE)


@dataclass(frozen=True)
class ArchiveSet:
    first_volume: Path
    kind: str
    base_name: str
    relative_parent: Path
    volume_count: int

    @property
    def relative_label(self) -> str:
        parent = "" if str(self.relative_parent) == "." else f"{self.relative_parent}/"
        return f"{parent}{self.base_name}"


def path_is_inside(path: Path, parent: Path) -> bool:
    try:
        path.resolve().relative_to(parent.resolve())
        return True
    except ValueError:
        return False


def walk_files(
    root: Path,
    recursive: bool = True,
    exclude: Path | None = None,
) -> list[Path]:
    """Return files under root, pruning common VCS/cache/build directories."""
    root = root.expanduser().resolve()
    if not root.is_dir():
        raise ValueError(f"No es una carpeta válida: {root}")
    if exclude is not None and exclude.expanduser().resolve() == root:
        exclude = None
    exclude_resolved = exclude.expanduser().resolve() if exclude is not None else None

    files: list[Path] = []
    if not recursive:
        candidates = sorted(root.iterdir(), key=lambda path: path.name.casefold())
        for candidate in candidates:
            try:
                if candidate.is_file() and not candidate.is_symlink():
                    files.append(candidate)
            except OSError:
                continue
        return files

    for current_text, directory_names, file_names in os.walk(root, followlinks=False):
        current = Path(current_text)
        retained: list[str] = []
        for directory_name in directory_names:
            child = current / directory_name
            if directory_name.casefold() in {name.casefold() for name in SKIP_DIRS}:
                continue
            if child.is_symlink():
                continue
            if exclude_resolved is not None and path_is_inside(child, exclude_resolved):
                continue
            retained.append(directory_name)
        directory_names[:] = sorted(retained, key=str.casefold)

        for file_name in sorted(file_names, key=str.casefold):
            candidate = current / file_name
            try:
                if candidate.is_file() and not candidate.is_symlink():
                    files.append(candidate)
            except OSError:
                continue
    return files


def discover_archive_sets(
    root: Path,
    recursive: bool = True,
    exclude: Path | None = None,
    files: Iterable[Path] | None = None,
) -> list[ArchiveSet]:
    """Find one entry per archive set, always pointing at the first volume."""
    root = root.expanduser().resolve()
    candidates = list(files) if files is not None else walk_files(root, recursive, exclude)
    by_parent: dict[Path, list[Path]] = {}
    for candidate in candidates:
        by_parent.setdefault(candidate.parent, []).append(candidate)

    detected: list[ArchiveSet] = []
    seen: set[tuple[str, str, str]] = set()

    for archive in sorted(candidates, key=lambda path: str(path).casefold()):
        name = archive.name
        kind = ""
        base = ""
        count = 1
        siblings = by_parent.get(archive.parent, [])

        part_match = RAR_PART_RE.fullmatch(name)
        seven_match = SEVEN_PART_RE.fullmatch(name)
        if part_match:
            if int(part_match.group("number")) != 1:
                continue
            kind = "RAR"
            base = part_match.group("base")
            numbers = {
                int(match.group("number"))
                for sibling in siblings
                if (match := RAR_PART_RE.fullmatch(sibling.name))
                and match.group("base").casefold() == base.casefold()
            }
            count = max(1, len(numbers))
        elif seven_match:
            if int(seven_match.group("number")) != 1:
                continue
            kind = "7z"
            base = seven_match.group("base")
            numbers = {
                int(match.group("number"))
                for sibling in siblings
                if (match := SEVEN_PART_RE.fullmatch(sibling.name))
                and match.group("base").casefold() == base.casefold()
            }
            count = max(1, len(numbers))
        elif name.casefold().endswith(".rar"):
            kind = "RAR"
            base = name[:-4]
            old_volume_pattern = re.compile(re.escape(base) + r"\.r(?P<number>\d{2,3})$", re.IGNORECASE)
            numbers = {
                int(match.group("number"))
                for sibling in siblings
                if (match := old_volume_pattern.fullmatch(sibling.name))
            }
            count = 1 + len(numbers)
        elif name.casefold().endswith(".zip"):
            kind = "ZIP"
            base = name[:-4]
            split_pattern = re.compile(re.escape(base) + r"\.z(?P<number>\d{2,3})$", re.IGNORECASE)
            numbers = {
                int(match.group("number"))
                for sibling in siblings
                if (match := split_pattern.fullmatch(sibling.name))
            }
            count = 1 + len(numbers)
        elif name.casefold().endswith(".7z"):
            kind = "7z"
            base = name[:-3]
        else:
            continue

        key = (kind.casefold(), str(archive.parent).casefold(), base.casefold())
        if key in seen:
            continue
        seen.add(key)
        try:
            relative_parent = archive.parent.relative_to(root)
        except ValueError:
            relative_parent = Path()
        detected.append(ArchiveSet(archive, kind, base, relative_parent, count))

    return sorted(detected, key=lambda item: (str(item.relative_parent).casefold(), item.base_name.casefold(), item.kind))


def _existing_extractor(kind: str) -> tuple[str, str] | None:
    if kind == "RAR":
        names = ("unrar", "7zz", "7z", "rar")
    else:
        names = ("7zz", "7z")
    for name in names:
        executable = shutil.which(name)
        if executable:
            return name, executable
    return None


def _safe_extract_zip(archive: Path, destination: Path) -> int:
    """Extract a single-volume ZIP without path traversal, symlink, or overwrite."""
    destination_root = destination.resolve()
    extracted_files = 0
    with zipfile.ZipFile(archive) as zipped:
        for info in zipped.infolist():
            raw_name = info.filename.replace("\\", "/")
            member = PurePosixPath(raw_name)
            if not raw_name or member.is_absolute() or re.match(r"^[A-Za-z]:", raw_name):
                raise ValueError(f"Ruta ZIP no permitida: {info.filename!r}")
            if any(part in {"..", ""} for part in member.parts):
                raise ValueError(f"Ruta ZIP no permitida: {info.filename!r}")

            target = destination.joinpath(*member.parts)
            resolved = target.resolve()
            try:
                resolved.relative_to(destination_root)
            except ValueError as exc:
                raise ValueError(f"El ZIP intenta escribir fuera del destino: {info.filename!r}") from exc

            mode = info.external_attr >> 16
            if stat.S_ISLNK(mode):
                raise ValueError(f"No se extraen enlaces simbólicos desde ZIP: {info.filename!r}")

            is_directory = info.is_dir() or raw_name.endswith("/")
            if is_directory:
                if target.exists() and not target.is_dir():
                    raise FileExistsError(f"Conflicto entre archivo y carpeta: {target}")
                target.mkdir(parents=True, exist_ok=True)
                continue

            if target.exists():
                raise FileExistsError(f"No se sobrescribe un archivo existente: {target}")
            target.parent.mkdir(parents=True, exist_ok=True)
            with zipped.open(info, "r") as source, target.open("xb") as output:
                shutil.copyfileobj(source, output)
            extracted_files += 1
    return extracted_files


def _extract_with_external_tool(item: ArchiveSet, destination: Path) -> None:
    tool = _existing_extractor(item.kind)
    if tool is None:
        if item.kind == "RAR":
            needed = "unrar, rar, 7zz o 7z"
        else:
            needed = "7zz o 7z"
        raise RuntimeError(f"No se encontró un extractor compatible. Instala uno de estos comandos: {needed}.")

    tool_name, executable = tool
    if tool_name in {"unrar", "rar"}:
        command = [executable, "x", "-o-", "-y", str(item.first_volume), str(destination) + os.sep]
    else:
        command = [executable, "x", "-y", "-aos", f"-o{destination}", str(item.first_volume)]
    result = subprocess.run(command, capture_output=True, text=True, errors="replace", check=False)
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "sin detalles del extractor").strip()
        raise RuntimeError(f"{tool_name} terminó con código {result.returncode}: {detail[-1200:]}")


def extract_archive_set(item: ArchiveSet, destination: Path) -> str:
    """Extract a set into a fresh destination directory. Returns a short result."""
    if destination.exists():
        return "omitido: el destino ya existe"
    needs_external_tool = item.kind != "ZIP" or item.volume_count > 1
    if needs_external_tool and _existing_extractor(item.kind) is None:
        if item.kind == "RAR":
            needed = "unrar, rar, 7zz o 7z"
        else:
            needed = "7zz o 7z"
        raise RuntimeError(f"No se encontró un extractor compatible. Instala uno de estos comandos: {needed}.")

    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.mkdir()

    if item.kind == "ZIP" and item.volume_count == 1:
        count = _safe_extract_zip(item.first_volume, destination)
        return f"extraído ({count} archivo(s))"
    _extract_with_external_tool(item, destination)
    return "extraído"


def _format_size(size: int) -> str:
    units = ("B", "KB", "MB", "GB", "TB")
    value = float(size)
    for unit in units:
        if value < 1024 or unit == units[-1]:
            return f"{value:.1f} {unit}" if unit != "B" else f"{int(value)} B"
        value /= 1024
    return f"{size} B"


def _is_ignore_file(path: Path) -> bool:
    name = path.name.casefold()
    known = {".gitignore", ".dockerignore", ".ignore", ".npmignore", ".eslintignore", ".prettierignore", ".hgignore"}
    return name in known or (name.startswith(".") and name.endswith("ignore"))


def inventory(root: Path, max_depth: int = 4, max_files: int = MAX_INVENTORY_FILES) -> int:
    """Print a compact one-pass map. This function creates no files."""
    root = root.expanduser().resolve()
    if not root.is_dir():
        raise ValueError(f"No es una carpeta válida: {root}")
    if max_depth < 0:
        raise ValueError("--max-depth debe ser cero o un entero positivo.")
    if max_files < 1:
        raise ValueError("--max-files debe ser mayor que cero.")

    files: list[Path] = []
    tree_entries: list[tuple[int, str]] = []
    skipped_dirs: set[str] = set()
    truncated = False
    skip_lower = {name.casefold() for name in SKIP_DIRS}

    for current_text, directory_names, file_names in os.walk(root, followlinks=False):
        current = Path(current_text)
        relative_dir = current.relative_to(root)
        depth = 0 if str(relative_dir) == "." else len(relative_dir.parts)

        original_dirs = list(directory_names)
        retained: list[str] = []
        if depth < max_depth:
            for directory_name in original_dirs:
                child = current / directory_name
                if directory_name.casefold() in skip_lower:
                    skipped_dirs.add(str(child.relative_to(root)))
                    continue
                if child.is_symlink():
                    continue
                retained.append(directory_name)
                if len(tree_entries) < MAX_TREE_ENTRIES:
                    tree_entries.append((depth, f"{child.relative_to(root)}/"))
        else:
            for directory_name in original_dirs:
                if directory_name.casefold() in skip_lower:
                    skipped_dirs.add(str((current / directory_name).relative_to(root)))
        directory_names[:] = sorted(retained, key=str.casefold)

        for file_name in sorted(file_names, key=str.casefold):
            file_path = current / file_name
            try:
                if file_path.is_symlink() or not file_path.is_file():
                    continue
            except OSError:
                continue
            if len(files) >= max_files:
                truncated = True
                directory_names[:] = []
                break
            files.append(file_path)
            if len(tree_entries) < MAX_TREE_ENTRIES:
                tree_entries.append((depth, str(file_path.relative_to(root))))
        if truncated:
            break

    extension_counts: Counter[str] = Counter()
    largest: list[tuple[int, Path]] = []
    important_names = {
        "agents.md",
        "readme",
        "readme.md",
        "readme.rst",
        "pyproject.toml",
        "package.json",
        "cargo.toml",
        "go.mod",
        "requirements.txt",
        "environment.yml",
        "dockerfile",
        "makefile",
        "cmakelists.txt",
        "pom.xml",
        "composer.json",
        "gemfile",
        "pubspec.yaml",
    }
    important: list[Path] = []
    ignore_files: list[Path] = []
    for file_path in files:
        lower_name = file_path.name.casefold()
        if lower_name.endswith(".tar.gz"):
            extension = ".tar.gz"
        else:
            extension = file_path.suffix.casefold() or "[sin extensión]"
        extension_counts[extension] += 1
        if lower_name in important_names or lower_name.startswith("readme."):
            important.append(file_path)
        if _is_ignore_file(file_path):
            ignore_files.append(file_path)
        try:
            size = file_path.stat().st_size
            if size >= 10 * 1024 * 1024:
                largest.append((size, file_path))
        except OSError:
            continue

    archives = discover_archive_sets(root, files=files)
    top_level: list[str] = []
    for child in sorted(root.iterdir(), key=lambda path: path.name.casefold()):
        if child.is_dir() and child.name.casefold() in skip_lower:
            continue
        top_level.append(child.name + ("/" if child.is_dir() else ""))

    print(f"REPO: {root}")
    print(f"Archivos inspeccionados: {len(files)}" + (" (límite alcanzado; inventario parcial)" if truncated else ""))
    print(f"Profundidad máxima: {max_depth}")
    print("\nESTRUCTURA DE PRIMER NIVEL:")
    for name in top_level[:60]:
        print(f"  {name}")
    if len(top_level) > 60:
        print(f"  … {len(top_level) - 60} más")

    print("\nARCHIVOS CLAVE:")
    if important:
        for file_path in sorted(important, key=lambda path: str(path.relative_to(root)).casefold())[:50]:
            print(f"  {file_path.relative_to(root)}")
        if len(important) > 50:
            print(f"  … {len(important) - 50} más")
    else:
        print("  (no se detectaron nombres habituales de documentación/manifiestos)")

    print("\nEXTENSIONES MÁS FRECUENTES:")
    for extension, count in extension_counts.most_common(15):
        print(f"  {extension}: {count}")

    print("\nÁRBOL (recortado):")
    if tree_entries:
        for depth, entry in sorted(tree_entries, key=lambda row: (row[1].casefold(), row[0])):
            # Keep a readable hierarchy while limiting output size.
            print(f"  {'  ' * depth}{entry}")
    else:
        print("  (sin archivos visibles)")
    if len(tree_entries) >= MAX_TREE_ENTRIES:
        print(f"  … salida limitada a {MAX_TREE_ENTRIES} entradas")

    print("\nARCHIVOS COMPRIMIDOS:")
    if archives:
        for item in archives[:100]:
            print(f"  {item.kind} · {item.volume_count} volumen(es) · {item.relative_label} · primer volumen: {item.first_volume.relative_to(root)}")
        if len(archives) > 100:
            print(f"  … {len(archives) - 100} conjuntos más")
    else:
        print("  (no se detectaron ZIP, RAR o 7z)")

    if skipped_dirs:
        print("\nCARPETAS OMITIDAS DEL INVENTARIO (cachés, dependencias o compilados):")
        for name in sorted(skipped_dirs, key=str.casefold)[:40]:
            print(f"  {name}/")
        if len(skipped_dirs) > 40:
            print(f"  … {len(skipped_dirs) - 40} más")
    if ignore_files:
        print("\nARCHIVOS DE EXCLUSIÓN YA EXISTENTES (se conservan):")
        for file_path in sorted(ignore_files, key=lambda path: str(path.relative_to(root)).casefold()):
            print(f"  {file_path.relative_to(root)}")
    if largest:
        print("\nARCHIVOS GRANDES (10 MB o más):")
        for size, file_path in sorted(largest, reverse=True)[:12]:
            print(f"  {_format_size(size)} · {file_path.relative_to(root)}")
    print("\nEl inventario solo leyó nombres y tamaños; no modificó el repositorio.")
    return 0


def command_archives(root: Path, recursive: bool) -> int:
    root = root.expanduser().resolve()
    items = discover_archive_sets(root, recursive=recursive)
    if not items:
        print(f"No se encontraron ZIP, RAR o 7z en {root}.")
        return 0
    for item in items:
        first = item.first_volume.relative_to(root)
        print(f"{item.kind:3} · {item.volume_count:>3} volumen(es) · {item.relative_label} · empieza en {first}")
    print(f"\nConjuntos detectados: {len(items)}. No se extrajo ni modificó nada.")
    return 0


def _single_archive_item(path: Path) -> ArchiveSet:
    path = path.expanduser().resolve()
    if not path.is_file():
        raise ValueError(f"No es un archivo: {path}")
    items = discover_archive_sets(path.parent, recursive=False)
    for item in items:
        if item.first_volume.resolve() == path:
            return item
    rar_match = RAR_PART_RE.fullmatch(path.name)
    if rar_match and int(rar_match.group("number")) != 1:
        raise ValueError("Selecciona el primer volumen RAR (.part1.rar o .part01.rar), no un volumen posterior.")
    seven_match = SEVEN_PART_RE.fullmatch(path.name)
    if seven_match and int(seven_match.group("number")) != 1:
        raise ValueError("Selecciona el primer volumen 7z (.7z.001), no un volumen posterior.")
    raise ValueError("Formato no reconocido. Se admite ZIP, RAR y 7z; para multipartes, indica el primer volumen.")


def command_extract(source: Path, destination: Path, recursive: bool) -> int:
    source = source.expanduser().resolve()
    destination = destination.expanduser().resolve()
    if source.is_dir():
        exclude = destination if path_is_inside(destination, source) and destination != source else None
        items = discover_archive_sets(source, recursive=recursive, exclude=exclude)
    else:
        items = [_single_archive_item(source)]
    if not items:
        print("No se encontraron conjuntos ZIP, RAR o 7z compatibles.", file=sys.stderr)
        return 2

    succeeded = skipped = failed = 0
    for item in items:
        output = destination / item.relative_parent / item.base_name
        try:
            result = extract_archive_set(item, output)
            if result.startswith("omitido"):
                skipped += 1
                print(f"OMITIDO · {item.relative_label}: {result}")
            else:
                succeeded += 1
                print(f"OK · {item.relative_label} → {output} ({result})")
        except Exception as exc:
            failed += 1
            print(f"ERROR · {item.relative_label}: {exc}", file=sys.stderr)
            print("  Si se creó una carpeta parcial, revísala antes de volver a intentarlo.", file=sys.stderr)
    print(f"\nResultado: {succeeded} correcto(s), {skipped} omitido(s), {failed} error(es).")
    return 1 if failed else 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Inventaría un repositorio y localiza/extrae archivos ZIP, RAR y 7z sin crear archivos auxiliares."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    inventory_parser = subparsers.add_parser("inventory", help="Imprime un mapa resumido del repositorio; no escribe archivos.")
    inventory_parser.add_argument("path", nargs="?", type=Path, default=Path("."), help="Carpeta del proyecto (por defecto: .)")
    inventory_parser.add_argument("--max-depth", type=int, default=4, help="Profundidad máxima del árbol (por defecto: 4)")
    inventory_parser.add_argument("--max-files", type=int, default=MAX_INVENTORY_FILES, help="Tope de archivos inspeccionados")

    archives_parser = subparsers.add_parser("archives", help="Lista archivos comprimidos y agrupa sus volúmenes.")
    archives_parser.add_argument("path", nargs="?", type=Path, default=Path("."), help="Carpeta de búsqueda (por defecto: .)")
    archives_parser.add_argument("--no-recursive", action="store_true", help="Busca solo en la carpeta indicada")

    extract_parser = subparsers.add_parser("extract", help="Extrae un archivo o todos los conjuntos de una carpeta.")
    extract_parser.add_argument("path", type=Path, help="Archivo comprimido o carpeta que los contiene")
    extract_parser.add_argument("--dest", required=True, type=Path, help="Carpeta destino; cada conjunto obtiene una subcarpeta")
    extract_parser.add_argument("--recursive", action="store_true", help="Si path es una carpeta, busca también en subcarpetas")

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        if args.command == "inventory":
            return inventory(args.path, args.max_depth, args.max_files)
        if args.command == "archives":
            return command_archives(args.path, recursive=not args.no_recursive)
        if args.command == "extract":
            return command_extract(args.path, args.dest, args.recursive)
        parser.error("Comando no reconocido")
    except (OSError, ValueError, zipfile.BadZipFile, RuntimeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
