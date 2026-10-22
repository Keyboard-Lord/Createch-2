// One cumulative chronological matrix, assembled from current live providers.
// The mixed-frontier report is retained separately as bounded historical evidence.
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {developmentRoot} from './lib/live_paths.mjs';
execFileSync(process.execPath,[path.join(developmentRoot,'createch-dev/scripts/verify_research_acquisition.mjs'),'--campaign-closure'],{stdio:'inherit'});
