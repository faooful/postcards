import { inspiration } from './inspiration.mjs';
import { randomUUID } from 'node:crypto';
import { readFile, realpath, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { digest, readState, saveState, receipt, mark, stateRoot } from './delivery.mjs';
import { parsePostcard } from './postcard.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const prefix = 'Postcards completion check (one reminder only).';
const emit = value => console.log(JSON.stringify(value));
const commands = token => `Read ${JSON.stringify(root + 'integrations/POSTCARD-INSTRUCTIONS.md')}. For a qualifying milestone, use this exact shell command, replacing only POSTCARD_MARKDOWN with the complete note. Do not append any receipt text to this command:

node ${JSON.stringify(root + 'scripts/write-postcard.mjs')} --receipt ${token} <<'POSTCARD'
POSTCARD_MARKDOWN
POSTCARD

Otherwise run: node ${JSON.stringify(root + 'scripts/delivery-status.mjs')} ${token} skipped
Use failed instead of skipped if delivery failed. Never write in plan/read-only mode. Do not expand permissions. No transcript reads, new agents, or network calls. Never send twice for a milestone already covered in this conversation.`;
try {
  let input = '';
  for await (const chunk of process.stdin) { input += chunk.toString(); if (input.length > 2000000) throw new Error(); }
  const event = JSON.parse(input);
  const agent = process.argv[2];
  if (!['codex','claude','pi'].includes(agent)) throw new Error();
  if (!['UserPromptSubmit','Stop'].includes(event.hook_event_name) || !event.session_id || event.agent_id) process.exit(0);
  // No prompt, response, transcript path, cwd, or raw session ID is persisted.
  const key = digest(agent + ':' + event.session_id);
  const projectPath = await realpath(root);
  const workingPath = event.cwd ? await realpath(event.cwd).catch(() => resolve(event.cwd)) : '';
  const excluded = workingPath === projectPath || workingPath.startsWith(projectPath + '/');
  if (event.hook_event_name === 'UserPromptSubmit') {
    // Codex Stop continuations can produce another UserPromptSubmit. Preserve its budget.
    if (typeof event.prompt === 'string' && event.prompt.startsWith(prefix)) process.exit(0);
    const explicit = typeof event.prompt === 'string' && /\b(?:send|write|give) me (?:another |a )postcard\b/i.test(event.prompt);
    const covered = await stat(join(stateRoot, key + '.delivery')).then(() => true, error => { if (error.code === 'ENOENT') return false; throw error; });
    const token = randomUUID();
    const status = excluded ? 'skipped' : event.permission_mode === 'plan' ? 'deferred' : covered && !explicit ? 'skipped' : 'pending';
    await saveState(token, { agent, sessionKey: key, explicit, status, reminded: false, updated: new Date().toISOString() });
    await saveState(key, { token });
    const fresh = status === 'pending' ? await inspiration(token).catch(() => '') : '';
    if (covered && !explicit && !excluded) emit({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: 'An automatic postcard has already been delivered for this session. Do not send another for implementation, tests, review, or follow-up changes. No postcard decision or writer call is needed. Only an explicit user request for another postcard permits an additional delivery.' } });
    if (status === 'pending') emit({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: `At most one automatic postcard is allowed for this entire session. Wait until implementation and relevant checks are complete; plans, tests, review, and follow-up fixes are not separate milestones. Before your final response, record this turn's postcard decision. Receipt: ${token}. ${commands(token)} ${fresh}` } });
  } else {
    const current = await readState(key);
    if (!current || excluded) process.exit(0);
    const record = await receipt(current.token);
    if (record.status === 'sent') {
      try {
        if (!/^\d{4}-\d{2}-\d{2}-[a-f0-9-]{36}\.md$/.test(record.file)) throw new Error();
        const text = await readFile(new URL('../postcards/' + record.file, import.meta.url), 'utf8');
        parsePostcard(text);
        if (digest(text) !== record.digest) throw new Error();
      } catch {
        await saveState(current.token, { ...record, status: 'failed', updated: new Date().toISOString() });
        emit({ systemMessage: 'Postcard delivery could not be verified. No retry was started; inspect the local delivery status.' });
      }
      process.exit(0);
    }
    if (['skipped','deferred'].includes(record.status)) process.exit(0);
    if (record.status === 'failed') { emit({ systemMessage: 'Postcard delivery failed. The main task is complete; no automatic retry will run.' }); process.exit(0); }
    if (event.permission_mode === 'plan') { await mark(current.token, 'deferred'); process.exit(0); }
    if (event.stop_hook_active || record.reminded) {
      await mark(current.token, 'failed');
      emit({ systemMessage: 'Postcard completion check was not recorded. The one-reminder limit has been reached; no further retry will run.' });
      process.exit(0);
    }
    try { await mkdir(join(stateRoot, current.token + '.reminder'), { mode: 0o700 }); }
    catch (error) { if (error.code === 'EEXIST') process.exit(0); throw error; }
    await saveState(current.token, { ...record, reminded: true });
    emit({ decision: 'block', reason: `${prefix} Finish only the missing postcard decision, then stop. ${commands(current.token)}` });
  }
} catch { emit({ systemMessage: 'Local postcard delivery check is unavailable. Continue the main task; no automatic retry was started.' }); }
