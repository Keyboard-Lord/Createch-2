"""Inspect binary dependencies and overlapping resources; do not merge mod JARs."""
import hashlib
import json
from pathlib import Path
import re
import struct
import tomllib
import zipfile

development = Path(__file__).resolve().parents[2]
live = Path(json.loads((development / "live-instance.json").read_text())["instance"])
state = development / "createch-dev/runtime-state/086a"
names = {"original": "tfmg-1.2.0.jar", "ce": "tfmg-1.21.1-1.3.2a-community.jar",
         "chemica": "chemica-1.21.1-0.7.0.jar"}
archives = {key: zipfile.ZipFile(live / "mods" / name) for key, name in names.items()}

def class_info(data):
    pos = 0
    def take(n):
        nonlocal pos
        value = data[pos:pos+n]
        pos += n
        return value
    def u2(): return struct.unpack(">H", take(2))[0]
    assert take(4) == b"\xca\xfe\xba\xbe"
    take(4)
    count = u2()
    cp = [None] * count
    i = 1
    while i < count:
        tag = take(1)[0]
        if tag == 1: value = take(u2()).decode("utf-8", errors="replace")
        elif tag in (7, 8, 16, 19, 20): value = u2()
        elif tag in (9, 10, 11, 12, 17, 18): value = (u2(), u2())
        elif tag == 15: value = (take(1)[0], u2())
        elif tag in (3, 4): value = take(4)
        elif tag in (5, 6): value = take(8)
        else: raise ValueError(f"Unknown constant-pool tag {tag}")
        cp[i] = (tag, value)
        i += 2 if tag in (5, 6) else 1
    text = lambda i: cp[i][1]
    owner = lambda i: text(cp[i][1])
    take(2)
    name, parent = owner(u2()), u2()
    parent = owner(parent) if parent else None
    interfaces = [owner(u2()) for _ in range(u2())]
    declarations = set()
    for _ in range(2):
        for _ in range(u2()):
            take(2)
            declarations.add((text(u2()), text(u2())))
            for _ in range(u2()):
                take(2)
                take(struct.unpack(">I", take(4))[0])
    refs = set()
    for entry in cp:
        if entry and entry[0] in (9, 10, 11):
            target, nt = entry[1]
            member, descriptor = cp[nt][1]
            refs.add((owner(target), text(member), text(descriptor)))
    return {"name": name, "parent": parent, "interfaces": interfaces,
            "declared": declarations, "refs": refs}

classes = {key: {name[:-6]: class_info(archive.read(name))
                 for name in archive.namelist() if name.endswith(".class")}
           for key, archive in archives.items()}

def declared(provider, target, member, descriptor, seen=None):
    seen = set() if seen is None else seen
    if target in seen or target not in classes[provider]: return False
    seen.add(target)
    info = classes[provider][target]
    return (member, descriptor) in info["declared"] or any(
        declared(provider, parent, member, descriptor, seen)
        for parent in [info["parent"], *info["interfaces"]] if parent)

references = sorted({reference for info in classes["chemica"].values()
                     for reference in info["refs"]
                     if reference[0].startswith("com/drmangotea/tfmg/")})
ce_specific = [r for r in references if declared("ce", *r) and not declared("original", *r)]
unresolved_ce = [r for r in references if not declared("ce", *r)]
# Inherited Create/Minecraft members cannot be resolved from these three JARs.
# Report them explicitly instead of pretending this is full JVM linkage proof.
sets = {key: set(archive.namelist()) for key, archive in archives.items()}
resource = lambda prefix, values: sorted(n for n in values if n.startswith(prefix) and not n.endswith("/"))
overlap = sets["original"] & sets["ce"]
summary = {}
for kind, prefix in [("recipes", "data/tfmg/recipe/"), ("tags", "data/tfmg/tags/"),
                     ("assets", "assets/tfmg/"), ("allData", "data/tfmg/")]:
    shared = resource(prefix, overlap)
    summary[kind] = {"original": len(resource(prefix, sets["original"])),
                     "ce": len(resource(prefix, sets["ce"])), "sharedPaths": len(shared),
                     "differentSharedBytes": sum(archives["original"].read(n) != archives["ce"].read(n) for n in shared),
                     "originalOnly": resource(prefix, sets["original"] - sets["ce"]),
                     "ceOnly": resource(prefix, sets["ce"] - sets["original"])}
providers = {}
for key, archive in archives.items():
    metadata = tomllib.loads(archive.read("META-INF/neoforge.mods.toml").decode())
    providers[key] = {"artifact": names[key], "sha256": hashlib.sha256((live / "mods" / names[key]).read_bytes()).hexdigest(),
                      "modId": metadata["mods"][0]["modId"], "version": metadata["mods"][0]["version"],
                      "dependencies": metadata.get("dependencies", {}), "classes": len(classes[key])}
assert providers["original"]["modId"] == providers["ce"]["modId"] == "tfmg"
assert ce_specific, "Reassess the claimed binary CE dependency"
log = (state / "baseline-startup/latest.log").read_text(errors="replace")
selection = [line for line in log.splitlines() if "TRANSFORMER/tfmg@" in line][:4]
assert selection and all("tfmg@1.3.2a-community" in line for line in selection)
authored_refs = {}
for folder in ["kubejs/server_scripts", "kubejs/data", "kubejs/config", "config/ftbquests"]:
    for file in (live / folder).rglob("*"):
        if file.is_file() and file.suffix in (".json", ".js", ".snbt"):
            ids = sorted(set(re.findall(r"\btfmg:[a-z0-9_./-]+", file.read_text(errors="replace"))))
            if ids: authored_refs[file.relative_to(live).as_posix()] = ids
report = {"truth": "VERIFIED_STATIC_BINARY_DEPENDENCY_AND_OBSERVED_LOADER_SELECTION",
          "providers": providers, "selectedRuntimeImplementation": "ce", "selectionEvidence": selection,
          "sharedBinaryClasses": len(classes["original"].keys() & classes["ce"].keys()),
          "chemicaTFMGReferences": references, "chemicaCESpecificDeclaredReferences": ce_specific,
          "chemicaReferencesInheritedOutsideInspectedJars": unresolved_ce,
          "resourceOverlap": summary, "authoredTFMGReferences": authored_refs,
          "decision": "Keep both physical artifacts. CE is the observed selected implementation of the shared tfmg namespace; do not invent alias mappings or run the original and CE registrars together.",
          "limits": ["No separate original/CE fluid registry exists in this observed runtime.",
                     "Resource path overlap is not two simultaneously registered resource sets.",
                     "Chemica and machine/process functionality still require live recipe and operation checks.",
                     "Do not count resources found only in the inactive original JAR as loaded recipe proof."]}
(state / "petrochemistry-audit.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps({"sameModId": True, "selected": "ce", "sharedClasses": report["sharedBinaryClasses"],
                  "chemicaTFMGReferences": len(references), "ceSpecificReferences": len(ce_specific),
                  "examples": ce_specific[:8], "authoredFilesUsingTFMG": len(authored_refs),
                  "recipeOverlap": {k: v for k, v in summary["recipes"].items() if not isinstance(v, list)}}))
