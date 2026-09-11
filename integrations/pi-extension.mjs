import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('../scripts/completion-hook.mjs', import.meta.url));
function runHook(event) {
  const output = execFileSync(process.execPath, [script, 'pi'], {
    input: JSON.stringify(event), encoding: 'utf8', timeout: 5000,
    maxBuffer: 32000, stdio: ['pipe', 'pipe', 'pipe'],
  });
  return output.trim() ? JSON.parse(output) : {};
}

export function registerPi(pi, run = runHook) {
  let continuation = false;
  let interrupted = false;
  let activeSession;
  const warn = (ctx, text) => { if (ctx.hasUI) ctx.ui.notify(text, 'warning'); };
  const payload = (ctx, hook_event_name) => ({
    hook_event_name, session_id: ctx.sessionManager.getSessionId(), cwd: ctx.cwd,
    permission_mode: pi.getActiveTools().includes('bash') ? 'default' : 'plan',
  });
  pi.on('session_start', () => { continuation = false; interrupted = false; activeSession = undefined; });
  pi.on('input', event => { if (event.source !== 'extension') continuation = false; });
  pi.on('before_agent_start', (event, ctx) => {
    if (continuation) return;
    interrupted = false;
    activeSession = ctx.sessionManager.getSessionId();
    try {
      const result = run({ ...payload(ctx, 'UserPromptSubmit'), prompt: /\b(?:send|write|give) me (?:another |a )postcard\b/i.test(event.prompt || '') ? 'send me a postcard' : '' });
      if (result.systemMessage) warn(ctx, result.systemMessage);
      const content = result.hookSpecificOutput?.additionalContext;
      if (content) return { message: { customType: 'postcards-checkpoint', content: content + ' Use sender: Pi. Respect any active plan/read-only instructions even if bash is available.', display: false } };
    } catch { warn(ctx, 'Postcard delivery check unavailable; continuing the main task.'); }
  });
  pi.on('agent_end', (event) => {
    const last = [...event.messages].reverse().find(message => message.role === 'assistant');
    interrupted = ['aborted', 'error'].includes(last?.stopReason);
  });
  pi.on('agent_settled', (_event, ctx) => {
    if (!ctx.isIdle() || ctx.hasPendingMessages() || activeSession !== ctx.sessionManager.getSessionId()) return;
    try {
      const result = run({ ...payload(ctx, 'Stop'), stop_hook_active: continuation || interrupted });
      if (result.systemMessage) warn(ctx, result.systemMessage);
      if (result.decision === 'block' && !continuation && !interrupted) {
        continuation = true;
        pi.sendMessage({ customType: 'postcards-reminder', content: result.reason + ' Use sender: Pi.', display: true }, { triggerTurn: true, deliverAs: 'followUp' });
      }
    } catch { warn(ctx, 'Postcard delivery check unavailable; no retry started.'); }
  });
}
export default function (pi) { registerPi(pi); }
