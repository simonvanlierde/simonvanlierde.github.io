# /// script
# requires-python = ">=3.13"
# dependencies = [
#   "citesync @ https://github.com/simonvanlierde/citesync/archive/a043e5c57f5dcbf36112fff1f9de4946683e5860.tar.gz",
#   "sourceledger @ https://github.com/simonvanlierde/sourceledger/archive/2cb7cd31e61f39f490de64046395fd3cd171e49c.tar.gz",
# ]
# ///

"""Generate citation exports and canonical download records before the fetchers publish them."""

import base64
import json
import re
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

from sourceledger import Source, record

FORMATS = {
    "apa": ("apa", "citation.apa.txt"),
    "bibtex": ("bibtex", "citation.bib"),
    "cslJson": ("csl-json", "citation.csl.json"),
    "jsonld": ("jsonld", "citation.jsonld"),
}


def export(folder: Path, source: str, fmt: str) -> str:
    result = subprocess.run(
        [
            str(Path(sys.executable).with_name("citesync")),
            "export",
            "--root",
            str(folder),
            "--source",
            source,
            "--format",
            fmt,
        ],
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )
    if result.returncode:
        raise ValueError(f"citesync {fmt} failed: {result.stderr.strip()}")
    if result.stderr:
        print(result.stderr.rstrip(), file=sys.stderr)
    if not result.stdout.strip():
        raise ValueError(f"citesync produced no {fmt} export")
    return result.stdout


def generate(request: dict) -> dict:
    root = Path(request["root"])
    files = {}
    provenance = {}
    raw_files = {}
    result = {"files": files, "raw": raw_files, "provenance": provenance}
    with TemporaryDirectory(prefix="site-metadata-") as temp:
        stage = Path(temp)
        if request["kind"] == "site":
            (stage / "codemeta.json").write_text(json.dumps(request["metadata"]), encoding="utf-8")
            files["CITATION.cff"] = export(stage, "codemeta.json", "cff")
            return result
        for item in request["sources"]:
            sid = item["id"]
            if not re.fullmatch(r"[a-z][a-z0-9-]{0,99}", sid):
                raise ValueError("invalid source id")
            folder = stage / sid
            folder.mkdir()
            body = base64.b64decode(item["body"], validate=True)
            downloaded = folder / "codemeta.json"
            downloaded.write_bytes(body)
            if request["kind"] == "project":
                card_id = request["cardId"]
                if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,99}", card_id):
                    raise ValueError("invalid card id")
                downloads = {}
                for key, (fmt, name) in FORMATS.items():
                    relative = f"public/citations/{card_id}/{name}"
                    files[relative] = export(folder, "codemeta.json", fmt)
                    downloads[key] = relative.removeprefix("public")
                result["citation"] = {
                    "apa": files[f"public/citations/{card_id}/citation.apa.txt"].strip(),
                    "downloads": downloads,
                }
            relative_log = f"public/provenance/{sid}.jsonl"
            old_log = root / relative_log
            log = folder / "fetches.jsonl"
            previous = []
            if old_log.exists():
                previous = [json.loads(line) for line in old_log.read_text(encoding="utf-8").splitlines()]
                log.write_bytes(old_log.read_bytes())
            source: Source = {"id": sid, "status": "implemented", "url": item["url"], "format": "file"}
            record(source, downloaded, retrieved_at=item["retrievedAt"], raw=folder / "raw", log=log)
            # The library log, rather than a second set of timestamps or checksums, owns provenance.
            logged = log.read_text(encoding="utf-8")
            current = json.loads(logged.splitlines()[-1])
            provenance[sid] = {
                **current,
                "changed": bool(previous and previous[-1]["sha256"] != current["sha256"]),
                "record": relative_log.removeprefix("public"),
            }
            files[relative_log] = logged
            raw_files[f".cache/sources/{sid}/{current['sha256']}"] = item["body"]
    return result


def main() -> int:
    try:
        request = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
        print(json.dumps(generate(request)))
    except (OSError, ValueError, KeyError, subprocess.SubprocessError) as error:
        print(f"error: metadata generation failed: {str(error)!r}", file=sys.stderr)
        return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
