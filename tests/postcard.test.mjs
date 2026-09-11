import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parsePostcard, inlineTokens } from '../scripts/postcard.mjs';

const body = 'Greetings from the quiet coast. A small crab has opened a bakery beside the sea. Every loaf looks like a pebble, but the gulls say the crust is wonderful.';
const source = (text = body, metadata = '') => `---\ntitle: The quiet coast\ndate: 2026-09-10\nsender: Codex\nreference: Finished a layout refinement\n${metadata}---\n${text}\n`;

test('parses prose and emphasis without creating HTML', () => {
  assert.equal(parsePostcard(source()).sender, 'Codex');
  assert.deepEqual(inlineTokens('A *small* and **fine** day.'), [
    { type: 'text', text: 'A ' }, { type: 'em', text: 'small' },
    { type: 'text', text: ' and ' }, { type: 'strong', text: 'fine' }, { type: 'text', text: ' day.' }
  ]);
});

test('rejects forbidden Markdown and private patterns without echoing input', () => {
  for (const bad of ['<script>unsafe</script>', '[visit](https://example.com)', '![photo](x)', '`secret code`', '\n    code', '\n# heading', '*unbalanced', 'private@example.com', '/Users/private/project', 'C:\\private\\file', 'sk-abcdefgh123456789', 'token: hiddenvalue', '192.168.1.2', 'company.internal', 'report.csv', '12345678-abcd-abcd-abcd-123456789012']) {
    assert.throws(() => parsePostcard(source(`${body}\n\n${bad}`)), error => !error.message.includes(bad));
  }
});

test('rejects invalid and unknown metadata and excessive content', () => {
  for (const bad of [source(body, 'project: private\n'), source(body, 'title: Duplicate\n'), source().replace('2026-09-10', '2026-02-30'), source().replace('sender: Codex', 'sender: Someone'), source('short'), source('word '.repeat(151))]) assert.throws(() => parsePostcard(bad));
});

test('writer validates before saving, creates distinct complete files, and needs no external command', async () => {
  const root = await mkdtemp(join(tmpdir(), 'postcards-test-'));
  try {
    await mkdir(join(root, 'scripts'));
    for (const name of ['postcard.mjs', 'write-postcard.mjs', 'delivery.mjs']) await cp(new URL(`../scripts/${name}`, import.meta.url), join(root, 'scripts', name));
    const run = input => spawnSync(process.execPath, [join(root, 'scripts/write-postcard.mjs')], { input, encoding: 'utf8', env: { PATH: '' } });
    const rejected = run(source(`${body} private@example.com`));
    assert.equal(rejected.status, 1);
    assert.ok(!rejected.stderr.includes('private@example.com'));
    assert.deepEqual(await readdir(root), ['scripts']);
    assert.equal(run(source()).status, 0);
    assert.equal(run(source()).status, 0);
    const files = await readdir(join(root, 'postcards'));
    assert.equal(files.length, 2);
    assert.notEqual(files[0], files[1]);
    for (const name of files) {
      assert.match(name, /^2026-09-10-[0-9a-f-]{36}\.md$/);
      const saved = await readFile(join(root, 'postcards', name), 'utf8');
      assert.ok(parsePostcard(saved).created);
      assert.equal(saved.replace(/^created: .*\n/m, ''), source());
    }
    const writer = await readFile(join(root, 'scripts/write-postcard.mjs'), 'utf8');
    assert.doesNotMatch(writer, /fetch\(|node:(?:https?|net|child_process)|exec\(|spawn\(/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
