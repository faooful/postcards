import { readdir } from 'node:fs/promises';
import { mark, readState, stateRoot, validToken } from './delivery.mjs';
try {
  const [token, status] = process.argv.slice(2);
  if (!token) {
    const files = await readdir(stateRoot).catch(e => { if (e.code === 'ENOENT') return []; throw e; });
    const records = [];
    for (const file of files) if (validToken(file.replace(/\.json$/, ''))) {
      const record = await readState(file.replace(/\.json$/, ''));
      if (record) records.push(record);
    }
    records.sort((a,b) => b.updated.localeCompare(a.updated));
    console.log(records.slice(0,20).map(r => `${r.updated}  ${r.agent}  ${r.status}${r.reminded ? ' (reminded once)' : ''}`).join('\n') || 'No delivery checks recorded yet.');
  } else {
    if (process.argv.length !== 4 || !['skipped', 'failed', 'deferred'].includes(status)) throw new Error();
    await mark(token, status);
    console.log(`Postcard delivery: ${status}.`);
  }
} catch { console.error('Unable to record or read local postcard delivery status.'); process.exitCode = 1; }
