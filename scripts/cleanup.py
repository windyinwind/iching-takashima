#!/usr/bin/env python3
"""Delete obsolete data: caches, .DS_Store, scratch dirs (tmp-*), wrangler state.

Run from anywhere; operates on the repo root (the script's parent directory).
node_modules and .git are never touched.

Usage:
  python3 scripts/cleanup.py            # delete, print each removal
  python3 scripts/cleanup.py --dry-run  # only list what would be deleted
"""

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

DIRS = ["__pycache__", ".pytest_cache", ".mypy_cache", ".wrangler"]
FILES = [".DS_Store", "*.pyc"]
SCRATCH_GLOB = "tmp-*"


def matches(path: Path) -> bool:
    if any(part in {"node_modules", ".git"} for part in path.parts):
        return False
    return (
        path.name in DIRS
        or path.name in (".DS_Store",)
        or path.suffix == ".pyc"
        or (path.is_dir() and path.name.startswith("tmp-"))
    )


def main() -> int:
    dry = "--dry-run" in sys.argv[1:]
    all_matches = sorted(p for p in ROOT.rglob("*") if matches(p))
    # keep top-level targets only: drop anything inside an already-removed dir
    targets: list[Path] = []
    for p in all_matches:
        if not any(p.is_relative_to(t) for t in targets):
            targets.append(p)
    if not targets:
        print("Nothing to clean.")
        return 0
    for p in targets:
        print(("would delete " if dry else "deleting ") + str(p.relative_to(ROOT)))
        if not dry:
            if p.is_dir():
                shutil.rmtree(p)
            else:
                p.unlink()
    print(f"{len(targets)} item(s) {'found' if dry else 'removed'}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
