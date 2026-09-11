import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
// Small SVG DOM fixture to exercise the real renderer without a browser dependency.
class Element {
  children=[]; attributes={}; style={}; parent=null;
  setAttribute(k,v){ this.attributes[k]=v; }
  getAttribute(k){ return this.attributes[k]; }
  append(...nodes){ for(const n of nodes){ if(n.parent) n.parent.children.splice(n.parent.children.indexOf(n),1); n.parent=this; this.children.push(n); } }
  before(n){ const p=this.parent; n.parent=p; p.children.splice(p.children.indexOf(this),0,n); }
  after(n){ const p=this.parent; n.parent=p; p.children.splice(p.children.indexOf(this)+1,0,n); }
  cloneNode(){ const n=new Element();n.attributes={...this.attributes};return n; }
}
test('all twenty themes render deterministic moving details alongside static artwork',async()=>{
  const compiled=await build({entryPoints:['src/doodle.ts'],bundle:true,write:false,format:'esm',platform:'node'});
  const {postcardDoodle}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const previous=globalThis.document;globalThis.document={createElementNS:()=>new Element()};
  const flatten=node=>[node,...node.children.flatMap(flatten)];
  try {
    for(const theme of ['lighthouse','door','lantern','pier','bird','flower','kite','teacup','tree','mushroom','mountain','moon','umbrella','balloon','book','key','clock','bicycle','cat','fish']) {
      for(const seed of ['one','two','2026-09-11-2e8f9e6d-c805-4d12-aca9-9530e9d5a51c']) {
        const svg=postcardDoodle(seed,theme);const nodes=flatten(svg);
        assert.ok(nodes.some(n=>n.attributes.class?.startsWith('scene-motion')),theme);
        // The balloon floats as one connected object; its paper stays stationary.
        if (theme !== 'balloon') assert.ok(svg.children[1].children.some(n=>n.attributes.d),`${theme} keeps static strokes`);
        if (['bird','flower','kite','balloon'].includes(theme)) {
          const groups = nodes.filter(n=>n.attributes.class?.startsWith('scene-motion'));
          assert.equal(groups.length, 1, `${theme} uses one shared pivot`);
          assert.ok(groups[0].children.length > 1, `${theme} keeps connected strokes together`);
        }
        const paths=nodes.filter(n=>n.attributes.d).map(n=>n.attributes.d);
        assert.ok(paths.every(d=>! /NaN|undefined|Infinity/.test(d)),theme);
        assert.deepEqual(paths,flatten(postcardDoodle(seed,theme)).filter(n=>n.attributes.d).map(n=>n.attributes.d));
      }
    }
  } finally {globalThis.document=previous;}
});
