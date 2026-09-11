import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
export const stateRoot = process.env.POSTCARDS_STATE_DIR || join(homedir(), '.local/state/postcards');
export const validToken = value => /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value || '');
export const digest = value => createHash('sha256').update(value).digest('hex');
export async function readState(name) {
  try { return JSON.parse(await readFile(join(stateRoot, name + '.json'), 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
export async function saveState(name, value) {
  await mkdir(stateRoot, { recursive: true, mode: 0o700 });
  const temp = join(stateRoot, randomUUID() + '.tmp');
  try {
    await writeFile(temp, JSON.stringify(value), { flag: 'wx', mode: 0o600 });
    await rename(temp, join(stateRoot, name + '.json'));
  } finally { await unlink(temp).catch(() => {}); }
}
export async function receipt(token) {
  if (!validToken(token)) throw new Error('Invalid delivery receipt.');
  const value = await readState(token);
  if (!value) throw new Error('Delivery receipt is unavailable.');
  return value;
}
export async function mark(token, status, extra = {}) {
  const previous = await receipt(token);
  if (previous.status === 'sent' && status !== 'sent') return;
  await saveState(token, { ...previous, ...extra, status, updated: new Date().toISOString() });
}
