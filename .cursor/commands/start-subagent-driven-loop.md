## FYI

read this if maybe you forget our overall context @AGENTS.md for your knowledge.

dont make documentation files exhaustive. it is less effective. you can use grammarly incorrect-but-understandable-for-ai-agent to save context tokens.

if there are any that still open or something to discuss even more, lets save it for now and talk about them later.

dont do anything/touch something that is a clear out of scope. except, it is related and must be touched.

## implementation

lets go to implementation.

we aim for production-level industry-standard batle-proven resilient busy apps traffic.

you are only ORCHESTRATOR. we work based on wave. each wave has loops. 1st wave must resolve our goals. the rest is to make the implementation of our goals to be near-perfect.

make acceptance gate and definition of done (apart from findings must become 0) for our goals.

you can completely refactor the existing code to achieve our coding principles and goals.

### variables

$automated-verify: ultracite check -> check-types (touched packages) -> test (touched). always use subagents Auto model, you are only ORCHESTRATOR.

$post-wave: `bun run generate:openapi` & `bun run build` & `bun run start` & cleanup all leftovers (Boy Scout Rule).

### wave 1 - implementation rule

start subagents protocol flow with (always use subagents Auto model, you are only ORCHESTRATOR):

- run $automated-verify (make sure we start from a fresh-clean state. if baseline verify fails on untouched code → note + ask user (picker); dont fix unrelated debt unless in scope).
- initial implementer.
- run $automated-verify.
- LOOP (UNTIL NO FINDINGS from the auditers + $automated-verify pass):
  - subagent (always use subagents Auto model, you are only ORCHESTRATOR) protocols for this wave:
    - acceptance gate + DoD + anything out of scope audit.
    - audit implementer.
    - run $automated-verify.
- git commit once.

### wave 2 - after wave 1 defined as done and no gate unresolved

start subagents protocol flow with (always use subagents Auto model, you are only ORCHESTRATOR):

- LOOP (UNTIL NO FINDINGS from the auditers + $automated-verify pass):
  - run $automated-verify.
  - auditers team (parallel subagents -> report to you + you merge duplicate findings):
    - [if touches client-related]: client performance + a11y audit.
    - security-review subagent audit (if unavailable, use a generic subagent for security review audit).
    - API contract + openapi drift audit.
    - boundary + monorepo architecture audit.
    - edge cases + errors audit.
    - try-really-hard-to-breaking-the-app audit.
    - code quality + this monorepo code conduct / coding principles audit (different from what $automated-verify doing).
  - audit implementer.
  - run $automated-verify.
- git commit once.
- run the `/simplify` skill as the final act (always use subagents Auto model, you are only ORCHESTRATOR. implementation is by subagents).
- run $post-wave.
- run $automated-verify.
- git commit once.

### git

total is 3 commits, no less no more. dont do other git command except those 3 commits at the exact step.

### gate before start initial implementation

if something is needed an answer, ask me using our QnA protocols (using picker, etc.).

## after everything

additionally give a very simple timestamp & agents report. just need the start + end + duration time and total subagents spawned/dispatched ONLY for this session (not the whole chat).
