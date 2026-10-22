# Createch 2

Current pack configuration, KubeJS content, and development script sources for Createch 2.
This repository snapshot was taken from the author's live CurseForge profile on October 22, 2026.

## Contents

- `config/`: mod configuration, quests, menus, and related resources.
- `defaultconfigs/`: default world and server configuration.
- `kubejs/`: runtime startup, server, and client scripts, data, assets, and guides. These paths are required by KubeJS.
- `tacz/`: the current gun pack resources, including the customized animations used by this profile.
- `scripts/`: development generators, validators, supporting libraries, and canonical source registries.
- `mod-inventory.json`: installed JAR names, sizes, SHA-256 hashes, and available CurseForge project/file references.

## Use

Install the pack through CurseForge. This is a source repository, not an installable modpack export.
Installed mod JARs, launcher metadata, worlds, credentials, logs, caches, and private development evidence are excluded.
Use CurseForge's native Share Profile workflow for distributable modpack exports.

The runtime files and development sources are preserved as authored. Development tools still expect the
author's external `createch-dev/scripts` layout, local `live-instance.json` binding, installed mods,
and supporting execution evidence. Moving their published source into `scripts/` does not make the
entire validation suite standalone; see [scripts/README.md](scripts/README.md).

Publication verifies the selected file bytes and repository structure. It does not establish
new gameplay, performance, export/import, or release qualification.

The existing repository license is retained. Third-party content retains its original authorship and license terms.
