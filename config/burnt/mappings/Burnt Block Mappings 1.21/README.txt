Burnt Block Mappings  —  your personal block-burning config (1.21.x)
=====================================================================
A drop-in config for the Burnt Basic mod. It lets YOU decide how any block
behaves in fire — with no code, no mod rebuild, and live reloading. Add a
block to one of the files below and it will burn (or refuse to) the way you
chose, the moment you run /reload.

Works alongside Burnt's built-in support for vanilla + popular mods — your
entries stack on top; you never overwrite anything.

REQUIRES: Burnt Basic for Minecraft 1.21.x.  (Every entry is "required": false,
so listing a block from a mod you don't have is harmless — it's just skipped.)

>>> Each file already contains two "yourmod:" EXAMPLE entries that show the
    format. Replace them with your own blocks, or delete them — "yourmod"
    isn't a real mod, so the examples do nothing until you change them. <<<

INSTALL
-------
Global (ALL worlds, recommended):
            copy this folder into   config/burnt/mappings/   (Burnt creates that
            folder on first run). It is always enabled in every world - no per-save
            copying. Run /reload after editing.
Per-world:  copy this folder into  <world>/datapacks/  then run  /reload
            (or /datapack enable "file/Burnt Block Mappings 1.21.x").
Server:     config/burnt/mappings/  (global) or  <world>/datapacks/ , then /reload.

OVERRIDING A MAPPING YOU DISAGREE WITH  (data/burnt/burn_mappings/overrides.json)
---------------------------------------------------------------------------
IMPORTANT: adding a block to a different burns_to_ file does NOT re-map it.
Minecraft MERGES tags, so the block ends up in both files and whichever one Burnt
checks first still wins - your change may appear to do nothing.

To genuinely override, use burn_mappings/overrides.json instead. It is checked
BEFORE every burns_to_ tag, so it always wins:

      {
        "mappings": [
          { "from": "somemod:cedar_planks", "to": "burnt:smoldering_log" }
        ]
      }

  "from"  any block id (yours, a mod's, or vanilla)
  "to"    the Burnt block it should turn into, e.g. burnt:smoldering_log,
          burnt:smoldering_planks, burnt:burnt_dirt

Save and run /reload. Unknown ids are skipped and noted in the log.

HOW TO ADD A MAPPING
--------------------
1. Decide what the block should DO, and open that file in
      data/burnt/tags/block/
2. Duplicate one of the example lines in "values" and change the id to yours:

      {
        "replace": false,
        "values": [
          { "id": "somemod:cedar_log",  "required": false },
          { "id": "somemod:cedar_wood", "required": false }
        ]
      }

3. Save and run /reload in game.  Done.

Always keep "replace": false — it means "add to the list", not "wipe it".

THE MENU  (file name in data/burnt/tags/block/  ->  what happens)
-------------------------------------------------------------------
LOGS & WOOD
  burns_to_smoldering_log ............ burns like a normal log
  burns_to_smoldering_log_slow ....... like a log, but slower (dense woods)
  burns_to_hollow_log ................ burns like a log, ends as a hollow burnt log
  burns_to_small_log ................. thin logs / posts / branches (not a full block)
  burns_to_smoldering_wood ........... bark-on-all-sides "wood" blocks
  burns_to_smoldering_stripped_log ... stripped logs
  burns_to_smoldering_stripped_wood .. stripped wood
  burns_to_smoldering_branch ......... branch blocks
  burns_to_smoldering_root ........... root blocks (mangrove-style)
LEAVES  (pick by how delicate it looks)
  burns_to_large_leaves / burns_to_medium_leaves / burns_to_fine_leaves
BUILT WOOD
  burns_to_smoldering_planks / _stairs / _slabs / _fences / _fence_gates
  bamboo_blocks ...................... bamboo blocks, planks and mosaic (burns as bamboo)
  burns_to_vertical_slab ............. vertical slabs (Quark-style, any orientation)
  burns_to_wall ...................... wood-variant walls (modded)
  burns_to_smoldering_door / _trapdoor / _button / _pressure_plate
GROUND & PLANTS
  burns_to_smoldering_grass .......... grassy ground -> burnt grass
  burns_to_burnt_dirt ................ dirt-like -> burnt dirt
  burns_to_burnt_farmland ............ farmland
  burns_to_smoldering_crops .......... crops
  burns_to_smoldering_fern ........... ferns
  burns_to_smoldering_tall_grass ..... tall grass / 2-block plants
  burns_to_smoldering_moss ........... moss
  burns_to_smoldering_moss_carpet .... moss carpet
CLOTH / MISC
  burns_to_smoldering_wool ........... wool-like blocks
  burns_to_smoldering_carpet ......... carpets
  burns_to_smoldering_envelope ....... airship envelopes (Create Aeronautics)
  burns_to_smoldering_sail / _sail_frame / _symmetric_sail ... sails
  destroy_in_burn .................... block just breaks (no drops) when fire reaches it
OVERRIDES  (beats every tag below)
  burn_mappings/overrides.json ....... force one block to become a specific Burnt block
BEHAVIOUR / OPT-OUT
  will_not_burn ...................... fire never spreads to or converts this block
  fire_resistant ..................... treated as fireproof (same idea)
  vanilla_fire_burns_on .............. keep plain vanilla fire on top of this block
                                       (for mods that listen to vanilla fire events;
                                       the block itself still doesn't burn)
