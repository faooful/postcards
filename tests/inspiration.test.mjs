import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { inspiration } from '../scripts/inspiration.mjs';

test('inspiration includes only the four newest titles and permits any subject', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'postcard-inspiration-'));
  const folder = pathToFileURL(directory + '/');
  try {
    for (const [i, subject] of ['bird', 'door', 'lantern', 'pier', 'lighthouse'].entries()) {
      await writeFile(join(directory, `${i}.md`), `---\ncreated: 2026-09-11T0${i}:00:00.000Z\ntitle: The ${subject}\ndate: 2026-09-11\nsender: Pi\nreference: Refined a small interaction\n---\nAn unexpected visitor arrived this morning with a basket of pastries and a cheerful song. Everyone paused for a moment to enjoy the pleasant surprise.\n`);
    }
    await writeFile(join(directory, 'invalid.md'), 'Private invalid fixture');
    for (let i = 0; i < 24; i++) {
      const result = await inspiration(String(i), folder);
      assert.match(result, /there is no subject menu/);
      assert.ok(result.includes('The lighthouse'));
      assert.ok(!result.includes('The bird'));
      assert.doesNotMatch(result, /Private invalid fixture/);
      assert.equal(result, await inspiration(String(i), folder));
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('empty collections still get open-ended inspiration', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'postcard-inspiration-'));
  try { assert.match(await inspiration('empty', pathToFileURL(directory + '/')), /Recognized recent subjects to avoid: none\./); }
  finally { await rm(directory, { recursive: true, force: true }); }
});
