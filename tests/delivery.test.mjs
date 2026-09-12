import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, mkdir, readdir, readFile, rm, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(),'postcards-hooks-'));
  try {
    await cp(new URL('../scripts', import.meta.url), join(root,'scripts'), {recursive:true});
    await mkdir(join(root,'postcards'));
    const env={...process.env,POSTCARDS_STATE_DIR:join(root,'state')};
    const exec=(script,args=[],input='') => spawnSync(process.execPath,[join(root,'scripts',script),...args],{env,input,encoding:'utf8'});
    const hook=(agent,event) => {
      const r=exec('completion-hook.mjs',[agent],JSON.stringify({session_id:'private-session',cwd:'/fictional-work',permission_mode:'default',...event}));
      assert.equal(r.status,0,r.stderr); return r.stdout.trim()?JSON.parse(r.stdout):{};
    };
    const begin=(agent='claude',extra={}) => {
      const result=hook(agent,{hook_event_name:'UserPromptSubmit',prompt:'PRIVATE PROMPT',...extra});
      return result.hookSpecificOutput?.additionalContext.match(/Receipt: ([a-f0-9-]+)/)?.[1];
    };
    await run({root,exec,hook,begin});
  } finally { await rm(root,{recursive:true,force:true}); }
}
const prose='---\ntitle: The quiet coast\ndate: 2026-09-10\nsender: Claude Code\nreference: Finished a layout refinement\n---\nGreetings from the quiet coast. A small crab has opened a bakery beside the sea. Every loaf looks like a pebble, but the gulls say the crust is wonderful.\n';

test('all agents get one reminder, including Codex continuation; no private text persisted',async()=>fixture(async({root,hook,begin})=>{
  for(const agent of ['claude','codex','pi']) {
    const token=begin(agent);
    assert.ok(token);
    const first=hook(agent,{hook_event_name:'Stop',last_assistant_message:'PRIVATE RESPONSE'});
    assert.equal(first.decision,'block');
    if(agent==='codex') hook(agent,{hook_event_name:'UserPromptSubmit',prompt:first.reason});
    assert.equal(hook(agent,{hook_event_name:'Stop',stop_hook_active:true}).decision,undefined);
    assert.equal(hook(agent,{hook_event_name:'Stop'}).decision,undefined);
    const record=JSON.parse(await readFile(join(root,'state',token+'.json'),'utf8'));
    assert.equal(record.status,'failed');
  }
  for(const file of (await readdir(join(root,'state'))).filter(file=>file.endsWith('.json'))) {
    const text=await readFile(join(root,'state',file),'utf8');
    assert.doesNotMatch(text,/PRIVATE|private-session|fictional-work/);
  }
}));

test('verified delivery closes check and repeated writer invocation creates no duplicate',async()=>fixture(async({root,exec,hook,begin})=>{
  const token=begin();
  assert.equal(exec('write-postcard.mjs',['--receipt',token],prose).status,0);
  assert.equal(exec('write-postcard.mjs',['--receipt',token],prose).status,0);
  const files=await readdir(join(root,'postcards')); assert.equal(files.length,1);
  assert.deepEqual(hook('claude',{hook_event_name:'Stop'}),{});
  await unlink(join(root,'postcards',files[0]));
  assert.match(hook('claude',{hook_event_name:'Stop'}).systemMessage,/could not be verified/);
}));

test('skip, validation failure, read-only mode and maintenance never cause reminder loops',async()=>fixture(async({root,exec,hook,begin})=>{
  let token=begin();
  assert.equal(exec('delivery-status.mjs',[token,'skipped']).status,0);
  assert.deepEqual(hook('claude',{hook_event_name:'Stop'}),{});
  token=begin();
  assert.equal(exec('write-postcard.mjs',['--receipt',token],'private invalid text').status,1);
  assert.equal(exec('write-postcard.mjs',['--receipt',token],'still invalid').status,1);
  assert.match(hook('claude',{hook_event_name:'Stop'}).systemMessage,/failed/);
  assert.equal(exec('write-postcard.mjs',['--receipt',token],prose).status,1);
  assert.equal(begin('claude',{permission_mode:'plan'}),undefined);
  assert.deepEqual(hook('claude',{hook_event_name:'Stop',permission_mode:'plan'}),{});
  assert.equal(begin('claude',{cwd:root}),undefined);
  assert.deepEqual(hook('claude',{hook_event_name:'Stop',cwd:root}),{});
  assert.deepEqual(hook('claude',{hook_event_name:'UserPromptSubmit',agent_id:'child'}),{});
}));

test('parallel sessions have distinct receipts and independent budgets',async()=>fixture(async({exec,hook,begin})=>{
  const a=begin('claude',{session_id:'a'}),b=begin('claude',{session_id:'b'});
  assert.notEqual(a,b);
  exec('delivery-status.mjs',[a,'skipped']);
  assert.deepEqual(hook('claude',{session_id:'a',hook_event_name:'Stop'}),{});
  assert.equal(hook('claude',{session_id:'b',hook_event_name:'Stop'}).decision,'block');
}));


test('malformed receipt reports argument error, not folder access, and saves nothing',async()=>fixture(async({root,exec,begin})=>{
  const token=begin();
  const result=exec('write-postcard.mjs',['--receipt',token+' '+token],prose);
  assert.equal(result.status,1);
  assert.match(result.stderr,/Invalid or unavailable delivery receipt/);
  assert.doesNotMatch(result.stderr,/folder access/);
  assert.equal((await readdir(join(root,'postcards'))).length,0);
  assert.equal(JSON.parse(await readFile(join(root,'state',token+'.json'),'utf8')).status,'pending');
}));

test('one automatic postcard per session across receipts; explicit requests and new sessions still work', async()=>fixture(async({root,exec,hook,begin})=>{
  for (const agent of ['claude','codex','pi']) {
    const first=begin(agent);
    // Even a second receipt minted before the first write shares the same allowance.
    const overlapping=begin(agent);
    assert.equal(exec('write-postcard.mjs',['--receipt',first],prose).status,0);
    const duplicate=exec('write-postcard.mjs',['--receipt',overlapping],prose);
    assert.equal(duplicate.status,0);
    assert.match(duplicate.stdout,/session already has a postcard/);
    assert.equal(begin(agent),undefined);
    assert.deepEqual(hook(agent,{hook_event_name:'Stop'}),{});
    const explicit=begin(agent,{prompt:'Please send me another postcard'});
    assert.ok(explicit);
    assert.equal(exec('write-postcard.mjs',['--receipt',explicit],prose).status,0);
    assert.equal(begin(agent),undefined);
    const next=begin(agent,{session_id:'another-session'});
    assert.ok(next);
    assert.equal(exec('write-postcard.mjs',['--receipt',next],prose).status,0);
  }
  assert.equal((await readdir(join(root,'postcards'))).length,9);
}));

test('validation failure does not consume the session delivery allowance',async()=>fixture(async({exec,begin})=>{
  assert.equal(exec('write-postcard.mjs',['--receipt',begin()],'invalid').status,1);
  const next=begin();
  assert.ok(next);
  assert.equal(exec('write-postcard.mjs',['--receipt',next],prose).status,0);
}));


test('one same-receipt correction succeeds for every agent without duplicate delivery',async()=>fixture(async({root,exec,begin})=>{
  for (const agent of ['claude','codex','pi']) {
    const token=begin(agent);
    const rejected=exec('write-postcard.mjs',['--receipt',token],'PRIVATE invalid draft');
    assert.equal(rejected.status,1);
    assert.match(rejected.stderr,/retry once with this same receipt/);
    assert.doesNotMatch(rejected.stderr,/PRIVATE/);
    const record=JSON.parse(await readFile(join(root,'state',token+'.json'),'utf8'));
    assert.equal(record.status,'pending');
    assert.equal(record.validationFailures,1);
    assert.equal(exec('write-postcard.mjs',['--receipt',token],prose).status,0);
    assert.equal(exec('write-postcard.mjs',['--receipt',token],prose).status,0);
    assert.equal(begin(agent),undefined);
  }
  assert.equal((await readdir(join(root,'postcards'))).length,3);
}));

test('saving failures close the receipt without offering a validation retry',async()=>fixture(async({root,exec,begin})=>{
  const token=begin();
  await rm(join(root,'postcards'),{recursive:true});
  const {writeFile}=await import('node:fs/promises');
  await writeFile(join(root,'postcards'),'not a directory');
  const result=exec('write-postcard.mjs',['--receipt',token],prose);
  assert.equal(result.status,1);
  assert.doesNotMatch(result.stderr,/retry once/);
  assert.equal(JSON.parse(await readFile(join(root,'state',token+'.json'),'utf8')).status,'failed');
  assert.equal(exec('write-postcard.mjs',['--receipt',token],prose).status,1);
}));
