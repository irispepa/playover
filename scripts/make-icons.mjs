// Rebuild the approved branding and iOS icon sizes from their supplied raster sources.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('./prepare-playover-branding.py', import.meta.url));
const source = process.argv[2] || fileURLToPath(new URL('../docs/playover-home/source', import.meta.url));
const result = spawnSync('python3', [script, source], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
