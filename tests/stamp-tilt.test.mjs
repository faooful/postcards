import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

test('tilt batches pointer events, uses latest coordinates, and cancels on exit or disposal', async () => {
  const compiled = await build({entryPoints:['src/stamp-tilt.ts'],bundle:true,write:false,format:'esm',platform:'node'});
  const {attachStampTilt} = await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const callbacks = new Map(); let id=0, reads=0;
  const previous = [globalThis.requestAnimationFrame, globalThis.cancelAnimationFrame];
  globalThis.requestAnimationFrame = fn => {callbacks.set(++id,fn);return id;};
  globalThis.cancelAnimationFrame = id => callbacks.delete(id);
  const events = new Map(), properties = new Map(), classes = new Set();
  const stamp = {
    isConnected:true,
    getBoundingClientRect:()=>{reads++;return {left:0,top:0,width:100,height:100};},
    addEventListener:(k,v)=>events.set(k,v),removeEventListener:k=>events.delete(k),
    classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)},
    style:{setProperty:(k,v)=>properties.set(k,v),removeProperty:k=>properties.delete(k)},
  };
  let preferenceChange;
  const reduced={matches:false,addEventListener:(_,fn)=>{preferenceChange=fn;},removeEventListener:()=>{preferenceChange=undefined;}};
  const move=(x,y,type='mouse')=>events.get('pointermove')({clientX:x,clientY:y,pointerType:type});
  const flush=()=>{const batch=[...callbacks.values()];callbacks.clear();batch.forEach(fn=>fn());};
  try {
    const dispose=attachStampTilt(stamp,reduced);
    events.get('pointerenter')();
    for(let i=0;i<100;i++) move(i,i);
    assert.equal(callbacks.size,1);assert.equal(reads,1);assert.equal(properties.size,0);
    move(100,0);flush();
    assert.equal(properties.get('--tilt-x'),'10deg');assert.equal(properties.get('--tilt-y'),'10deg');
    move(0,100);events.get('pointerleave')();flush();assert.equal(properties.size,0);
    move(0,0);reduced.matches=true;preferenceChange();flush();assert.equal(properties.size,0);
    move(100,100);assert.equal(callbacks.size,0);
    reduced.matches=false;move(100,100,'touch');assert.equal(callbacks.size,0);
    move(100,100);dispose();flush();assert.equal(properties.size,0);assert.equal(callbacks.size,0);
    assert.equal(events.size,0);assert.equal(preferenceChange,undefined);
  } finally {
    [globalThis.requestAnimationFrame,globalThis.cancelAnimationFrame]=previous;
  }
});
