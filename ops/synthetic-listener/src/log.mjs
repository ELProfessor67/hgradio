import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.mjs';

// Every line is JSON with a UTC timestamp: greppable, and it lines up with
// pm2 --time, nginx and LiveKit logs when an incident is reconstructed.
fs.mkdirSync(config.logDir, { recursive: true });
const file = () => path.join(config.logDir, `listener-${new Date().toISOString().slice(0, 10)}.jsonl`);

export function log(kind, data = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), kind, ...data });
  console.log(line);
  try { fs.appendFileSync(file(), line + '\n'); } catch { /* disk full or read-only: console still has it */ }
}

export const nowIso = () => new Date().toISOString();
