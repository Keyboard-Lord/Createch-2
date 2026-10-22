"""Capture the authoritative profile before Mission 04 runtime qualification.

Read-only against the profile. Recovery archives and private metadata stay in
the development root's ignored work directory, outside the release payload.
"""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import platform
import shutil
import subprocess
import tarfile
import tomllib
import zipfile

development = Path(__file__).resolve().parents[2]
binding = json.loads((development / "live-instance.json").read_text())
live = Path(binding["instance"]).resolve()
profile = json.loads((live / "minecraftinstance.json").read_text())
assert profile["guid"] == binding["guid"]
assert Path(profile["installPath"]).resolve() == live
assert profile["gameVersion"] == binding["gameVersion"]
stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
state = development / "createch-dev/runtime-state/mission04"
private = development / "createch-dev/runtime-state/work/mission04" / stamp
private.mkdir(parents=True, exist_ok=False)
state.mkdir(parents=True, exist_ok=True)

def digest(file):
    with file.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()

def write(file, value):
    file.write_text(json.dumps(value, indent=2) + "\n")

git = "/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git"
repositories = {
    "source": (development, []),
    "runtime": (development, [f"--git-dir={development / binding['runtimeGit']}", f"--work-tree={live}"]),
    "core": (Path("/Users/mcrae/Documents/createch2core"), []),
}
checkpoints = {}
for name, (cwd, options) in repositories.items():
    def git_read(*args):
        return subprocess.check_output([git, *options, *args], cwd=cwd)
    checkpoints[name] = git_read("rev-parse", "HEAD").decode().strip()
    (private / f"{name}-status.txt").write_bytes(git_read("status", "--porcelain=v1"))
    (private / f"{name}-unstaged.patch").write_bytes(git_read("diff", "--binary"))
    (private / f"{name}-staged.patch").write_bytes(git_read("diff", "--cached", "--binary"))

files = {}
for file in sorted(live.rglob("*")):
    if file.is_file():
        assert not file.is_symlink(), f"Inspect symbolic link before backup: {file}"
        files[file.relative_to(live).as_posix()] = {"sha256": digest(file), "bytes": file.stat().st_size}
write(private / "runtime-files.json", files)

archive = private / "profile-config-before-runtime.tar.gz"
with tarfile.open(archive, "w:gz") as backup:
    for relative in ["config", "defaultconfigs", "kubejs", "minecraftinstance.json", "user-prefs.json", "options.txt", "saves"]:
        source = live / relative
        if source.exists():
            backup.add(source, arcname=relative, recursive=True)
# Verify archived bytes directly without extracting or modifying the profile.
verified = 0
with tarfile.open(archive, "r:gz") as backup:
    for member in backup.getmembers():
        if member.isfile():
            with backup.extractfile(member) as source:
                assert hashlib.file_digest(source, "sha256").hexdigest() == files[member.name]["sha256"]
            verified += 1

mods = []
for jar in sorted((live / "mods").glob("*.jar")):
    entry = {"file": jar.name, **files[f"mods/{jar.name}"]}
    with zipfile.ZipFile(jar) as package:
        for metadata in ["META-INF/neoforge.mods.toml", "META-INF/mods.toml"]:
            if metadata in package.namelist():
                data = tomllib.loads(package.read(metadata).decode())
                entry["mods"] = [{k: mod.get(k) for k in ["modId", "version", "displayName"]} for mod in data.get("mods", [])]
                break
        if "fabric.mod.json" in package.namelist():
            data = json.loads(package.read("fabric.mod.json"))
            entry["fabric"] = {k: data.get(k) for k in ["id", "version", "name"]}
        if "META-INF/MANIFEST.MF" in package.namelist():
            manifest = package.read("META-INF/MANIFEST.MF").decode(errors="replace")
            entry["implementationVersion"] = next((line.split(": ", 1)[1] for line in manifest.splitlines() if line.startswith("Implementation-Version: ")), None)
    mods.append(entry)
write(state / "baseline-mods.json", mods)
shutil.copyfile("/Users/mcrae/.codex/attachments/7df285b9-e235-40e4-8b8f-32f73fe2e1e2/Pasted text.txt", state / "MISSION.md")
summary = {
    "capturedUtc": stamp, "instance": str(live), "guid": profile["guid"],
    "gameVersion": profile["gameVersion"], "installedLoader": profile["baseModLoader"]["name"],
    "importedManifestVersion": profile.get("manifest", {}).get("version"),
    "importedManifestLoaders": profile.get("manifest", {}).get("minecraft", {}).get("modLoaders"),
    "recommendedRamMiB": profile.get("manifest", {}).get("minecraft", {}).get("recommendedRam"),
    "memoryOverride": {k: profile.get(k) for k in ["isMemoryOverride", "allocatedMemory", "javaArgsOverride"]},
    "modJars": len(mods), "runtimeFiles": len(files),
    "originalSaves": sorted(child.name for child in (live / "saves").iterdir()),
    "checkpoints": checkpoints, "os": platform.platform(), "machine": platform.machine(),
    "recoveryDirectory": str(private), "backupSha256": digest(archive), "verifiedBackupFiles": verified,
    "runtimeEvidence": "UNEXECUTED; no launch or world evidence established by this baseline",
}
write(state / "baseline.json", summary)
print(json.dumps(summary, indent=2))
