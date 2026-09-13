import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { inspiration } from '../scripts/inspiration.mjs';

test('inspiration includes only the twelve newest titles and permits any subject', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'postcard-inspiration-'));
  const folder = pathToFileURL(directory + '/');
  try {
    for (const [i, subject] of ['bird', 'door', 'lantern', 'pier', 'key', 'cat', 'moon', 'book', 'kite', 'fish', 'clock', 'tree', 'lighthouse'].entries()) {
      await writeFile(join(directory, `${i}.md`), `---\ncreated: 2026-09-11T${String(i).padStart(2, '0')}:00:00.000Z\ntitle: The ${subject}\ndate: 2026-09-11\nsender: Pi\nreference: Refined a small interaction\n---\nAn unexpected visitor arrived this morning with a basket of pastries and a cheerful song. Everyone paused for a moment to enjoy the pleasant surprise.\n`);
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

test('recognizes repeated weather premises and never includes work references', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'postcard-variety-'));
  try {
    await writeFile(join(directory, 'one.md'), `---\ntitle: The Apricot Weather Station\ndate: 2026-09-13\nsender: Codex\nreference: Confidential business context\n---\nAn apricot forecast a drizzle over the orchard. Everyone carried an umbrella to the picnic, where a small visitor arrived with a basket of pastries and a cheerful song.\n`);
    const result = await inspiration('test', pathToFileURL(directory + '/'));
    assert.match(result, /fruit, orchards and food forecasts/);
    assert.match(result, /umbrella/);
    assert.match(result, /exclusions, not examples to imitate/);
    assert.doesNotMatch(result, /Confidential business context/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
