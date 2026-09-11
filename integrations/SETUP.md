# Connect Codex and Claude Code

The writer resolves `postcards/` relative to its own location, so it works from other projects. It needs Node.js, but does not need npm dependencies, an API key, or network access.

Choose a local checkout path and set it in the terminal environment used by your agent:

```sh
export POSTCARDS_HOME='/absolute/path/to/Postcards'
```

Desktop apps may not inherit terminal environment variables. In that case, put the actual absolute path in the instruction snippet below instead of `$POSTCARDS_HOME`. Do not add your machine's absolute path to this public repository. The destination must be writable under the agent's existing permissions.

## Codex

Opt in by adding the following to the `AGENTS.md` used by the projects you want postcards from. For all projects, you can choose your personal `~/.codex/AGENTS.md`. This project does not install or modify it.

```text
Postcards are enabled. The local Postcards checkout is $POSTCARDS_HOME
(resolve from the environment; do not guess a path).
Immediately before the main final response, check for a completed implementation,
artifact, investigation, or decision-complete plan. When one qualifies, or when
I say “send me a postcard,” read
$POSTCARDS_HOME/integrations/POSTCARD-INSTRUCTIONS.md and follow it.
Send at most one automatic fictional postcard per session through its
local writer before responding. Confirm success or briefly report failure.
Avoid repeats using conversation context. Only the main agent sends; defer
when plan/read-only mode prohibits writing. Skip routine replies, small follow-up
edits, and postcard-related work. No extra
model calls, transcript searches, Git operations, or publication.
```

Codex discovers applicable [AGENTS.md instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md). This approach encourages postcard writing during the existing turn; it does not install a lifecycle hook or guarantee a postcard on application exit.

## Claude Code

Add the same snippet to the relevant `CLAUDE.md`, or your personal `~/.claude/CLAUDE.md` if you want it across projects. The shared instructions tell Claude Code to use `sender: Claude`.

This uses Claude Code's [project memory instructions](https://code.claude.com/docs/en/memory). The optional completion hooks below add one bounded reminder when the instruction-based decision is missed.

## Cost and review

Writing uses the current agent and a short local tool call. There is no separate model service, API bill, or background worker in this app. When completion hooks are enabled, a missing decision can trigger one additional continuation in the current agent session, consuming its normal tokens. The extra tokens still count toward your agent's billing or usage limits; the app cannot enforce a per-postcard price.

Read new postcards locally before committing. For a public GitHub repository, committing and pushing publishes the Markdown source too, even before the website is deployed. Delete unwanted local postcards before committing; do not rely on deleting them in a later release to erase Git history.

## Completion hooks on this device

The setup now includes `UserPromptSubmit` and `Stop` command hooks for Claude Code and Codex. Claude settings retain existing hooks. Codex uses inline hook tables and leaves existing notification and trust settings unchanged. Configuration backups are outside this repository under `~/.local/state/postcards/config-backups/`.

**Activation:** start a fresh Claude Code session after updating settings. In Codex CLI, run `/hooks` and review/trust the two postcard command hooks; Codex skips untrusted definitions. Then start a fresh Codex task. A configured hook has not been proven live until the first real turn records a decision. The implementation was tested with synthetic hook events, without paying for an extra agent session.

Each new turn receives a random delivery receipt. At completion, the agent either writes with `--receipt TOKEN` or records skipped/failed. Stop verifies a sent file's content hash and validation, accepts an explicit skip, or gives one reminder. Read-only/plan turns are deferred and work in this Postcards checkout is excluded. Subagent events are ignored. Missing state fails open and reports a generic warning; it does not block the main task indefinitely.

Receipt reuse cannot generate another card. New receipts share a hashed session allowance: at most one automatic postcard per session, enforced by an atomic writer claim. Subsequent prompts are suppressed without a reminder. An explicit “send me a postcard” request gets an additional allowance. Existing sessions adopt the guard on their next prompt; older receipts do not contain the session guard. Hooks do not prove that a milestone was correctly classified or force delivery through unavailable permissions. If a plan turn is deferred, the next writable turn reevaluates normally; there is no background queue that sends it later.

View the latest local statuses with:

```sh
node scripts/delivery-status.mjs
```

State stays under `~/.local/state/postcards/`, outside Git. It contains random receipts, hashed session lookup keys, timestamps, status flags, and saved-card filenames/content hashes. Hook input may include prompts and response text, but neither is saved, transmitted, or used as postcard source. Transcripts are never opened. These hooks do not run a separate model; one missed checkpoint may still cost an extra continuation in the existing model.

To disable: remove only the `completion-hook.mjs` entries from Claude's settings and the two matching inline hook handlers in Codex config (or disable them through `/hooks`). Keep unrelated hooks intact. The original instruction-based postcard behavior remains unless you also remove its personal instruction section.

References: [Claude hook configuration](https://code.claude.com/docs/en/hooks), [Codex hook configuration and trust review](https://learn.chatgpt.com/docs/hooks).

## Pi

Pi 0.84.1 on this device is connected through `~/.pi/agent/extensions/postcards.ts`, which loads this checkout's `integrations/pi-extension.mjs`. Existing extensions are unchanged. Run `/reload` in Pi or start a fresh session to activate it. No model name or API key is needed; the extension uses the active Pi session and labels postcards `Pi`.

The extension uses `before_agent_start` for the receipt instructions and `agent_settled` for completion verification. It waits for automatic retries and queued work to finish, avoids resuming aborted/error runs, and sends at most one visible custom extension reminder. It shares the local receipt store, writer validation, and duplicate protection used by Claude and Codex. It passes no prompts or conversation messages to the local checker.

Without the bash tool, it defers delivery. Custom plan-mode extensions may not expose a common mode flag, so the injected instructions also require Pi to respect active read-only restrictions. The extension does not enable tools or change access permissions. Only use this interactive integration for the main agent; do not load it in custom automated subagent runners.

Remove `~/.pi/agent/extensions/postcards.ts` and run `/reload` to disable. Adapter lifecycle tests and shared delivery tests pass; live Pi delivery has also been verified in the original local installation. See [Pi extensions documentation](https://pi.dev/docs/latest/extensions).
