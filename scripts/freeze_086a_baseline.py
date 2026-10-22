"""Freeze current live inputs before 0.8.6a changes; never construct a runtime copy."""
from datetime import datetime, timezone
import argparse
import hashlib
import json
from pathlib import Path
import zipfile
import re

development = Path(__file__).resolve().parents[2]
binding = json.loads((development / "live-instance.json").read_text())
live = Path(binding["instance"]).resolve()
profile = json.loads((live / "minecraftinstance.json").read_text())
assert profile["guid"] == binding["guid"]
state = development / "createch-dev/runtime-state/086a"
state.mkdir(parents=True, exist_ok=True)
parser = argparse.ArgumentParser()
parser.add_argument("--name", default="baseline")
name = parser.parse_args().name
assert re.fullmatch(r"[a-z0-9-]+", name), "Unsafe capture name"
record = state / f"{name}.json"
archive = state / f"{name}-inputs.zip"
assert not record.exists() and not archive.exists(), "Never overwrite the frozen baseline"
paths = sorted(p for name in ("mods", "config", "defaultconfigs", "kubejs")
               for p in (live / name).rglob("*") if p.is_file())
paths += [live / "minecraftinstance.json", live / ".curseclient"]
inventory = []
with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_STORED) as output:
    for file in paths:
        data = file.read_bytes()
        relative = file.relative_to(live).as_posix()
        inventory.append({"path": relative, "bytes": len(data),
                          "sha256": hashlib.sha256(data).hexdigest()})
        output.writestr(relative, data)
with zipfile.ZipFile(archive) as saved:
    assert saved.testzip() is None
    for entry in inventory:
        assert hashlib.sha256(saved.read(entry["path"])).hexdigest() == entry["sha256"]
report = {
    "schema": 1, "capturedUtc": datetime.now(timezone.utc).isoformat(),
    "truth": "VERIFIED_FROZEN_INPUTS_ONLY", "instance": str(live),
    "guid": profile["guid"], "target": "0.8.6a",
    "displayedBaselineVersion": profile.get("manifest", {}).get("version"),
    "minecraft": profile["gameVersion"], "loader": profile["baseModLoader"]["name"],
    "memoryOverride": {key: profile.get(key) for key in
                       ("isMemoryOverride", "allocatedMemory", "javaArgsOverride")},
    "archive": str(archive), "inventory": inventory,
    "runtimeMeasurements": None,
    "limits": ["Current CurseForge metadata identifies 0.8.5, not 0.8.6; do not invent a historical 0.8.6 measurement.",
               "No runtime/performance conclusion follows from hashes or prior launches.",
               "Archive is rollback evidence only; testing remains in the same live profile."]
}
record.write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps({"record": str(record), "archive": str(archive),
                  "files": len(inventory), "jars": sum(x["path"].startswith("mods/") for x in inventory),
                  "bytes": sum(x["bytes"] for x in inventory),
                  "displayedBaselineVersion": report["displayedBaselineVersion"]}))
