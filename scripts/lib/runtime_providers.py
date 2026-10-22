"""Exclude known inactive duplicate mod artifacts from static resource evidence."""
import hashlib
import json
from pathlib import Path
import tomllib
import zipfile

DEVELOPMENT = Path(__file__).resolve().parents[3]
POLICY = DEVELOPMENT / "createch-dev/scripts/sources/runtime_provider_selection.json"


def mod_declarations(archive):
    for name in ("META-INF/neoforge.mods.toml", "META-INF/mods.toml"):
        if name in archive.namelist():
            return {mod["modId"]: mod.get("version")
                    for mod in tomllib.loads(archive.read(name).decode())["mods"]}
    return {}


def select_providers(files, declarations, policy):
    """Fail on new/changed duplicate groups rather than guess the newest version."""
    groups = {}
    for file, mods in declarations.items():
        for mod_id in mods:
            groups.setdefault(mod_id, []).append(file)
    duplicates = {mod_id: set(names) for mod_id, names in groups.items() if len(names) > 1}
    if duplicates.keys() != policy["duplicates"].keys():
        raise ValueError(f"Duplicate provider groups need review: {duplicates}")
    excluded = set()
    for mod_id, names in duplicates.items():
        rule = policy["duplicates"][mod_id]
        if names != rule["artifacts"].keys() or rule["selected"] not in names:
            raise ValueError(f"Changed duplicate providers: {mod_id}")
        for name in names:
            pin = rule["artifacts"][name]
            if declarations[name][mod_id] != pin["version"]:
                raise ValueError(f"Changed duplicate version: {name}")
            if hashlib.sha256(files[name].read_bytes()).hexdigest() != pin["sha256"]:
                raise ValueError(f"Changed duplicate bytes: {name}")
        excluded.update(names - {rule["selected"]})
    # Excluding a whole multi-mod JAR could discard another selected mod.
    for name in excluded:
        for mod_id in declarations[name]:
            if policy["duplicates"].get(mod_id, {}).get("selected") in (None, name):
                raise ValueError(f"Cannot exclude a partially selected multi-mod JAR: {name}")
    return [files[name] for name in sorted(files) if name not in excluded], sorted(excluded)


def runtime_providers(mods=Path("mods")):
    policy = json.loads(POLICY.read_text())
    evidence = DEVELOPMENT / policy["evidence"]["file"]
    if hashlib.sha256(evidence.read_bytes()).hexdigest() != policy["evidence"]["sha256"]:
        raise ValueError("Frozen provider-selection evidence changed")
    log = evidence.read_text(errors="replace").splitlines()
    for rule in policy["duplicates"].values():
        if not any(line.strip() == rule["observedLine"] for line in log):
            raise ValueError(f"Missing observed provider selection: {rule['selected']}")
    files = {file.name: file for file in mods.glob("*.jar")}
    declarations = {}
    for name, file in files.items():
        with zipfile.ZipFile(file) as archive:
            declarations[name] = mod_declarations(archive)
    selected, excluded = select_providers(files, declarations, policy)
    return selected, {"knownInactiveArtifacts": excluded,
                      "observedDuplicateSelections": {key: rule["selected"]
                                                     for key, rule in policy["duplicates"].items()},
                      "limits": policy["limits"]}
