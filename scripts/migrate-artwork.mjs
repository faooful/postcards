import { readdir, readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { parsePostcard } from './postcard.mjs';
import { chronological, selectArtwork } from './artwork.mjs';
const compiled=await build({entryPoints:['src/doodle-theme.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {chooseDoodleTheme}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const folder=new URL('../postcards/',import.meta.url);
const cards=[];
for(const name of await readdir(folder)) {
 if(!name.endsWith('.md')) continue;
 const url=new URL(name,folder),source=await readFile(url,'utf8');
 cards.push({...parsePostcard(source),id:name.slice(0,-3),url,source});
}
cards.sort(chronological);
const seen=new Set(),history=[];
for(const card of cards) {
 const theme=chooseDoodleTheme(card);
 if(!card.artwork) {
   // Preserve the first existing subject exactly, then vary later occurrences.
   card.artwork=seen.has(theme)?selectArtwork(card,history):`v1/${theme}/0`;
   if(seen.has(theme) && card.artwork === `v1/${theme}/0`) {
     const lastUse = slot => history.map(c=>c.artwork).lastIndexOf(`v1/${theme}/${slot}`);
     card.artwork = `v1/${theme}/${lastUse(1)<=lastUse(2)?1:2}`;
   }
   await writeFile(card.url,card.source.replace(/^---\n/,`---\nartwork: ${card.artwork}\n`));
 }
 seen.add(theme);history.push(card);
}
console.log(`Pinned artwork for ${cards.length} postcards.`);
