import test from 'node:test';
import assert from 'node:assert/strict';
import { registerPi } from '../integrations/pi-extension.mjs';
import { parsePostcard } from '../scripts/postcard.mjs';
function setup() {
  const handlers = {}, calls = [], messages = [], warnings = [];
  const pi = { on: (name,fn) => handlers[name]=fn, getActiveTools: () => ['read','bash'], sendMessage: (...args) => messages.push(args) };
  const ctx = { hasUI:true, ui:{notify:text=>warnings.push(text)}, cwd:'/work', sessionManager:{getSessionId:()=> 'session'}, isIdle:()=>true, hasPendingMessages:()=>false };
  registerPi(pi,event=>{ calls.push(event); return event.hook_event_name === 'UserPromptSubmit' ? {hookSpecificOutput:{additionalContext:'Receipt rules'}} : {decision:'block',reason:'One reminder'}; });
  return {handlers,calls,messages,warnings,ctx,pi};
}
test('Pi adapter injects rules and sends only one extension continuation',()=>{
  const {handlers:h,calls,messages,ctx}=setup();
  assert.match(h.before_agent_start({prompt:'PRIVATE'},ctx).message.content,/sender: Pi/);
  h.agent_settled({},ctx); assert.equal(messages.length,1);
  assert.equal(h.before_agent_start({},ctx),undefined);
  h.agent_settled({},ctx); assert.equal(messages.length,1);
  assert.equal(calls.at(-1).stop_hook_active,true);
  assert.ok(!JSON.stringify(calls).includes('PRIVATE'));
  h.input({source:'interactive'});
  assert.ok(h.before_agent_start({},ctx).message);
});
test('Pi does not restart aborted, queued, or switched sessions',()=>{
  const {handlers:h,messages,ctx}=setup();
  h.before_agent_start({},ctx);
  h.agent_end({messages:[{role:'assistant',stopReason:'aborted'}]});
  h.agent_settled({},ctx); assert.equal(messages.length,0);
  h.input({source:'interactive'}); h.before_agent_start({},ctx);
  ctx.hasPendingMessages=()=>true; h.agent_settled({},ctx); assert.equal(messages.length,0);
  ctx.hasPendingMessages=()=>false; ctx.sessionManager.getSessionId=()=> 'other';
  h.agent_settled({},ctx); assert.equal(messages.length,0);
});
test('Pi without bash marks its checkpoint as read-only and parses Pi sender',()=>{
  const {handlers:h,calls,ctx,pi}=setup(); pi.getActiveTools=()=>['read'];
  h.before_agent_start({},ctx); assert.equal(calls[0].permission_mode,'plan');
  const text='---\ntitle: A quiet day\ndate: 2026-09-10\nsender: pi\nreference: Refined a sidebar layout\n---\nThe little bird left a note beside the window and flew away before breakfast. Nobody knew where it had gone, but the morning felt brighter.';
  assert.equal(parsePostcard(text).sender,'Pi');
});
