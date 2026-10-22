"""Index shipped static resources, including bundled JARs, without Minecraft."""
import io
import json
from pathlib import Path
import re
import sys
import zipfile
from runtime_providers import runtime_providers

index = {"recipes": {}, "worldgen": {}, "materialRecipes": {}}
details = set(sys.argv[1:])
if details:
    index.update(recipeData={}, fluidTags={})
registry = json.loads((Path(__file__).resolve().parents[1] / "sources/material_authority.json").read_text())
required = {entry["recipe"] for material in registry["materials"].values()
            for entry in material.get("recycling", {}).get("forms", {}).values()}


def inspect(archive, label, depth=0):
    if depth >= 8:
        raise ValueError(f"Excessive bundled JAR depth: {label}")
    entries = set(archive.namelist())
    # Membership is set-based; report insertion order must be reproducible.
    for name in sorted(entries):
        match = re.fullmatch(r"data/([^/]+)/recipe/(.+)\.json", name)
        if match:
            identifier = f"{match[1]}:{match[2]}"
            index["recipes"].setdefault(identifier, []).append(label)
            if match[1] in details:
                index["recipeData"].setdefault(identifier, []).append(
                    {"provider": label, "data": json.loads(archive.read(name))})
            if identifier in required:
                index["materialRecipes"][identifier] = json.loads(archive.read(name))
        match = re.fullmatch(r"data/([^/]+)/worldgen/([^/]+)/(.+)\.json", name)
        if match:
            index["worldgen"].setdefault(match[2], {})[f"{match[1]}:{match[3]}"] = label
        if details:
            match = re.fullmatch(r"data/([^/]+)/tags/fluid/(.+)\.json", name)
            if match:
                index["fluidTags"].setdefault(f"{match[1]}:{match[2]}", []).append(
                    {"provider": label, "data": json.loads(archive.read(name))})
    if "META-INF/jarjar/metadata.json" in entries:
        for child in json.loads(archive.read("META-INF/jarjar/metadata.json"))["jars"]:
            with zipfile.ZipFile(io.BytesIO(archive.read(child["path"]))) as nested:
                inspect(nested, f"{label}!{child['path']}", depth + 1)


providers, index["providers"] = runtime_providers()
for file in providers:
    with zipfile.ZipFile(file) as archive:
        inspect(archive, file.name)
vanilla = Path("/Users/mcrae/Documents/curseforge/minecraft/Install/versions/1.21.1/1.21.1.jar")
with zipfile.ZipFile(vanilla) as archive:
    inspect(archive, "minecraft-1.21.1.jar")
print(json.dumps(index))
