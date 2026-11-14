"""Create or restore a consistent local snapshot. Stop API uploads before running."""

import argparse
import shutil
import sqlite3
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("action", choices=["create", "restore"])
parser.add_argument("source", type=Path)
parser.add_argument("destination", type=Path)
args = parser.parse_args()
if args.destination.exists():
    parser.error(
        "Destination already exists; choose a new directory to preserve existing data."
    )
database = args.source / "xogame.db"
media = args.source / "media"
if not database.is_file():
    parser.error("Source must contain xogame.db")
args.destination.mkdir(parents=True)
with (
    sqlite3.connect(database) as source,
    sqlite3.connect(args.destination / "xogame.db") as target,
):
    source.backup(target)
    assert target.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
if media.is_dir():
    shutil.copytree(media, args.destination / "media")
# Stored paths are absolute; rewrite them after restoring into another directory.
if args.action == "restore":
    with sqlite3.connect(args.destination / "xogame.db") as restored:
        for table in ["videos", "documents"]:
            for ident, path in restored.execute(
                f"SELECT id,path FROM {table}"
            ).fetchall():
                restored.execute(
                    f"UPDATE {table} SET path=? WHERE id=?",
                    (
                        str((args.destination / "media" / Path(path).name).resolve()),
                        ident,
                    ),
                )
print(f"{args.action.title()} complete: {args.destination}")
