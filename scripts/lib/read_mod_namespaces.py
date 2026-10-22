"""Read declared NeoForge mod IDs, including nested Jar-in-Jar providers."""
import io
import json
from pathlib import Path
import tomllib
import zipfile

providers = []


def inspect(archive, label, depth=0):
    if depth >= 8:
        raise ValueError(f"Excessive bundled JAR depth: {label}")
    entries = set(archive.namelist())
    for metadata in ("META-INF/neoforge.mods.toml", "META-INF/mods.toml"):
        if metadata in entries:
            document = tomllib.loads(archive.read(metadata).decode("utf-8-sig"))
            for mod in document.get("mods", []):
                ranges = [entry["versionRange"] for entry in document.get("dependencies", {}).get(mod["modId"], [])
                          if entry.get("modId") == "neoforge" and "versionRange" in entry
                          and entry.get("type", "required") != "incompatible"]
                providers.append({"modId": mod["modId"], "artifact": label, "neoforgeVersionRanges": ranges})
            break
    if "META-INF/jarjar/metadata.json" in entries:
        metadata = json.loads(archive.read("META-INF/jarjar/metadata.json"))
        for child in metadata.get("jars", []):
            with zipfile.ZipFile(io.BytesIO(archive.read(child["path"]))) as nested:
                inspect(nested, f"{label}!{child['path']}", depth + 1)


for file in sorted(Path("mods").glob("*.jar")):
    with zipfile.ZipFile(file) as archive:
        inspect(archive, file.name)
print(json.dumps(providers))
