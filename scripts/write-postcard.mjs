import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, link, unlink, rmdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parsePostcard, PostcardError } from './postcard.mjs';
import { receipt, mark, stateRoot, digest } from './delivery.mjs';

const folder = fileURLToPath(new URL('../postcards/', import.meta.url));
let temp;
let token;
let claimed = false;
let deliveryState;
let sessionClaim;
let saved = false;
let validating = false;
try {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--receipt')) throw new PostcardError('Use optional --receipt TOKEN and Markdown on standard input.');
  if (process.stdin.isTTY) throw new PostcardError('Pass Markdown through standard input.');
  token = args[1];
  if (token) {
    let state;
    try { state = await receipt(token); }
    catch { throw new PostcardError('Invalid or unavailable delivery receipt. Pass exactly one UUID after --receipt, with no duplicated token or stray quotes.'); }
    deliveryState = state;
    if (state.status === 'sent') { console.log('This delivery receipt was already sent; no duplicate created.'); process.exit(0); }
    if (state.status !== 'pending') throw new PostcardError('This delivery receipt is already closed.');
    try { await mkdir(join(stateRoot, token + '.claim'), { mode: 0o700 }); claimed = true; }
    catch (error) {
      if (error.code === 'EEXIST') throw new PostcardError('This delivery receipt has already been attempted; no duplicate created.');
      throw new PostcardError('Cannot claim delivery receipt; check local delivery-state folder access.');
    }
    // Re-read under the claim: another process may have updated the receipt.
    deliveryState = await receipt(token);
    if (deliveryState.status !== 'pending') throw new PostcardError('This delivery receipt is already closed.');
  }
  let source = '';
  validating = true;
  for await (const chunk of process.stdin) {
    source += chunk.toString();
    if (source.length > 12000) throw new PostcardError('Postcard is too large.');
  }
  const card = parsePostcard(source);
  if (!card.reference) throw new PostcardError('Add a short public-safe reference describing the completed work.');
  validating = false;
  if (deliveryState?.sessionKey) {
    if (!/^[a-f0-9]{64}$/.test(deliveryState.sessionKey)) throw new PostcardError('Invalid delivery session.');
    const claim = join(stateRoot, deliveryState.sessionKey + '.delivery');
    try { await mkdir(claim, { mode: 0o700 }); sessionClaim = claim; }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (!deliveryState.explicit) {
        await mark(token, 'skipped');
        console.log('This session already has a postcard; no duplicate created.');
        process.exit(0);
      }
    }
  }
  const created = new Date().toISOString();
  source = source.replace(/\r\n/g, '\n').replace(/^created: .*\n/m, '').replace(/^---\n/, `---\ncreated: ${created}\n`);
  const name = `${card.date}-${randomUUID()}.md`;
  await mkdir(folder, { recursive: true });
  temp = join(folder, `.${randomUUID()}.tmp`);
  await writeFile(temp, source.trim() + '\n', { flag: 'wx', mode: 0o600 });
  await link(temp, join(folder, name));
  saved = true;
  await unlink(temp); temp = undefined;
  if (token) await mark(token, 'sent', { file: name, digest: digest(source.trim() + '\n') });
  process.stdout.write(`Saved postcards/${name}. Review locally before committing or pushing.\n`);
} catch (error) {
  if (sessionClaim && !saved) await rmdir(sessionClaim).catch(() => {});
  let retryAllowed = false;
  if (token && claimed) {
    if (validating && error instanceof PostcardError && !deliveryState.validationFailures) {
      try {
        await mark(token, 'pending', { validationFailures: 1 });
        await rmdir(join(stateRoot, token + '.claim'));
        retryAllowed = true;
      } catch { await mark(token, 'failed').catch(() => {}); }
    } else await mark(token, 'failed').catch(() => {});
  }
  if (temp) await unlink(temp).catch(() => {});
  process.stderr.write(`${error instanceof PostcardError ? error.message : 'Unable to save postcard; check local folder access.'}\n`);
  if (retryAllowed) process.stderr.write('Correct the validation error and retry once with this same receipt. Do not create a new receipt or omit it.\n');
  process.exitCode = 1;
}
