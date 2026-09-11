import { readdir, readFile } from 'node:fs/promises';
import { parsePostcard } from './postcard.mjs';

const folder = new URL('../postcards/', import.meta.url);
const files = (await readdir(folder)).filter(file => file.endsWith('.md')).sort();
let failed = 0;
for (const [index, file] of files.entries()) {
  try {
    if (!/^\d{4}-\d{2}-\d{2}-[0-9a-f-]{36}\.md$/.test(file)) throw new Error('Expected a date-and-UUID filename.');
    const card = parsePostcard(await readFile(new URL(file, folder), 'utf8'));
    if (!file.startsWith(card.date)) throw new Error('Filename date must match metadata.');
  } catch (error) {
    failed++;
    console.error(`Postcard ${index + 1}: ${error.message}`);
  }
}
console.log(`${files.length - failed} valid postcard(s); ${failed} invalid.`);
process.exitCode = failed ? 1 : 0;
