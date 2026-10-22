# Development scripts

This folder contains the current development scripts, `lib/` helpers, and `sources/` registries.
The source bytes are unchanged from the author's external development repository.
Runtime KubeJS scripts remain in `kubejs/`, where Minecraft loads them.

These tools were written for an external source root containing `createch-dev/scripts/`,
`live-instance.json`, and private `createch-dev/runtime-state/` evidence, bound to the live
CurseForge profile. Many scripts also use author-machine tool paths or historical artifact pins.
They are published here for source review and maintenance; this directory alone is not a
portable validation or pack-generation environment. The local binding, private evidence,
historical JARs, and execution logs are deliberately not published.

No generators or gameplay checks are run as part of this repository upload.
