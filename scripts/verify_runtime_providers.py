"""Check observed duplicate selection and reject unreviewed provider changes."""
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from lib.runtime_providers import DEVELOPMENT, POLICY, runtime_providers, select_providers

live = Path(json.loads((DEVELOPMENT / "live-instance.json").read_text())["instance"])
selected, evidence = runtime_providers(live / "mods")
inventory = json.loads(subprocess.check_output(
    [sys.executable, str(DEVELOPMENT / "createch-dev/scripts/lib/read_static_inventory.py")], cwd=live))
assert "tfmg:aluminum_spool" not in inventory["recipes"], "Inactive original recipe accepted"
assert inventory["recipes"]["tfmg:crafting/aluminum_spool"] == ["tfmg-1.21.1-1.3.2a-community.jar"]
for providers in inventory["recipes"].values():
    assert not any(label.split("!")[0] in evidence["knownInactiveArtifacts"] for label in providers)

def rejects(files, declarations, policy):
    try:
        select_providers(files, declarations, policy)
    except ValueError:
        return
    raise AssertionError("Unreviewed duplicate provider was accepted")

with tempfile.TemporaryDirectory(prefix="createch-provider-check-") as directory:
    files, declarations = {}, {}
    policy = copy.deepcopy(json.loads(POLICY.read_text()))
    for mod_id, rule in policy["duplicates"].items():
        for name, pin in rule["artifacts"].items():
            file = Path(directory) / name
            file.write_bytes(name.encode())
            pin["sha256"] = hashlib.sha256(file.read_bytes()).hexdigest()
            files[name], declarations[name] = file, {mod_id: pin["version"]}
    kept, excluded = select_providers(files, declarations, policy)
    assert {file.name for file in kept} == {rule["selected"] for rule in policy["duplicates"].values()}
    assert all(file.exists() for file in files.values()), "Selection removed physical artifacts"
    changed = copy.deepcopy(policy)
    changed["duplicates"]["tfmg"]["selected"] = "not-installed.jar"
    rejects(files, declarations, changed)
    changed = copy.deepcopy(policy)
    changed["duplicates"]["tfmg"]["artifacts"]["tfmg-1.2.0.jar"]["sha256"] = "0" * 64
    rejects(files, declarations, changed)
    changed = copy.deepcopy(declarations)
    changed["new-provider.jar"] = {"tfmg": "9.9"}
    rejects(files, changed, policy)
    changed = copy.deepcopy(declarations)
    changed["tfmg-1.2.0.jar"]["unique_mod"] = "1"
    rejects(files, changed, policy)
    changed = copy.deepcopy(declarations)
    changed["tfmg-1.2.0.jar"]["tfmg"] = "9.9"
    rejects(files, changed, policy)
report = {"truth": "VERIFIED_STATIC_PROVIDER_SELECTION", **evidence,
          "selectedTopLevelArtifacts": len(selected), "nativeStaticRecipeIds": len(inventory["recipes"]),
          "checks": ["inactive original recipes excluded", "CE recipe provider retained",
                     "physical duplicate artifacts preserved", "missing selection rejected",
                     "changed bytes rejected", "new duplicate rejected", "partial multi-mod exclusion rejected",
                     "changed version rejected"]}
(DEVELOPMENT / "createch-dev/runtime-state/086a/provider-selection-validation.json").write_text(
    json.dumps(report, indent=2) + "\n")
print(json.dumps(report))
