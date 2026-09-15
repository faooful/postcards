import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {themes,selectArtwork,validArtwork} from '../scripts/artwork.mjs';
import {parsePostcard} from '../scripts/postcard.mjs';
class Element {
  children=[]; attributes={}; style={}; parent=null;
  setAttribute(k,v){ this.attributes[k]=v; }
  getAttribute(k){ return this.attributes[k]; }
  append(...nodes){ for(const n of nodes){ if(n.parent) n.parent.children.splice(n.parent.children.indexOf(n),1); n.parent=this; this.children.push(n); } }
  before(n){ const p=this.parent; n.parent=p; p.children.splice(p.children.indexOf(this),0,n); }
  after(n){ const p=this.parent; n.parent=p; p.children.splice(p.children.indexOf(this)+1,0,n); }
  cloneNode(){ const n=new Element();n.attributes={...this.attributes};return n; }
}

const card=(id,title='A cat',artwork='')=>({id,title,body:'',date:'2026-09-15',created:'',artwork});
test('recent compositions are avoided, then least recent wins',()=>{
 const history=[card('a','Cat','v1/cat/0'),card('b','Cat','v1/cat/1')];
 assert.equal(selectArtwork(card('c'),history),'v1/cat/2');
 history.push(card('c','Cat','v1/cat/2'));
 assert.equal(selectArtwork(card('d'),history),'v1/cat/0');
 assert.equal(history[0].artwork,'v1/cat/0');
 assert.equal(selectArtwork({...card('d'),reference:'lighthouse lighthouse'} ,history),selectArtwork(card('d'),history));
});
test('unmatched subjects prefer unused subjects, title matching wins',()=>{
 const history=[card('a','Cat','v1/cat/0')];
 assert.notEqual(selectArtwork(card('z','An unexpected arrival'),history).split('/')[1],'cat');
 assert.match(selectArtwork({...card('z','Telescope'),body:'a cat a cat'},history),/^v1\/telescope\//);
});
test('artwork metadata accepts only known versioned compositions',()=>{
 for(const id of ['v2/cat/0','v1/cat/3','v1/unknown/0','<svg>']) assert.equal(validArtwork(id),false);
 const source='---\ntitle: A cat\ndate: 2026-09-15\nsender: Codex\nartwork: v1/cat/2\n---\n'+ 'A gentle visitor brought a basket of flowers and sat beside the old fireplace while everyone prepared a pleasant evening meal.';
 assert.equal(parsePostcard(source).artwork,'v1/cat/2');
 assert.throws(()=>parsePostcard(source.replace('v1/cat/2','v9/cat/2')));
 assert.equal(parsePostcard(source.replace('artwork: v1/cat/2\n','')).artwork,'');
});
test('all 96 compositions render valid deterministic paths with static and moving details',async()=>{
 const compiled=await build({entryPoints:['src/artwork.ts'],bundle:true,write:false,format:'esm',platform:'node'});
 const {renderArtwork}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const previous=globalThis.document;globalThis.document={createElementNS:()=>new Element()};
 const flatten=n=>[n,...n.children.flatMap(flatten)];
 try {
  assert.equal(themes.length,32);
  for(const theme of themes) {
   const drawings=[];
   for(let slot=0;slot<3;slot++) {
    const c=card('fixture',theme,`v1/${theme}/${slot}`);
    const nodes=flatten(renderArtwork(c));
    const paths=nodes.filter(n=>n.attributes.d).map(n=>n.attributes.d);
    assert.ok(paths.length>=2,`${theme}/${slot}`);
    assert.ok(paths.every(d=>! /NaN|undefined|Infinity/.test(d)));
    assert.ok(nodes.some(n=>n.attributes.class?.includes('scene-motion')));
    assert.deepEqual(paths,flatten(renderArtwork(c)).filter(n=>n.attributes.d).map(n=>n.attributes.d));
    drawings.push(JSON.stringify(paths));
   }
   assert.equal(new Set(drawings).size,3,theme);
  }
 } finally {globalThis.document=previous;}
});
