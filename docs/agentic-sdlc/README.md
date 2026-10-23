# Agentic SDLC Pipeline

> **GitHub Copilot Multi-Agent Project Structure**

Agents live in `.github/agents/` — they appear automatically in the **Agents dropdown** in GitHub Copilot Chat.  
Pipeline artifacts are written to `docs/agentic-sdlc/artifacts/` as each stage completes.

## Active Stories

| Story | Jira | Purpose |
|---|---|---|
| Task Due Dates and Overdue Tracking | [KT-11](https://bharathwaj1390.atlassian.net/browse/KT-11) | Current implementation |
| Task Search and Advanced Filtering | [KT-12](https://bharathwaj1390.atlassian.net/browse/KT-12) | Future demo |

## Structure

```
.github/
  copilot-instructions.md     ← project-wide Copilot context
  agents/                     ← ✅ agents appear in Copilot Chat dropdown
    01-requirements.md        ← Stage 1: fetch story from Jira, produce requirements.md
    02-architecture.md        ← Stage 2: design data model, API, UI changes
    03-design-review.md       ← Stage 3: review architecture before coding
    04-implementation-plan.md ← Stage 4: dependency-ordered task list
    05-implementation.md      ← Stage 5: execute tasks, log completions
    06-review.md              ← Stage 6: peer-style code review
    07-verify.md              ← Stage 7: build, lint, API, regression checks
    08-pr.md                  ← Stage 8: generate PR description

docs/agentic-sdlc/
  README.md                   ← this file
  artifacts/                  ← populated by agents as each stage runs
    requirements.md
    architecture.md
    design-review.md
    impl-plan.md
    implementation-log.md
    review-findings.md
    verification-report.md
    pr-description.md
```

## How to Run the Pipeline

1. Open GitHub Copilot Chat in VS Code
2. Select **Agent: 01 - Requirements Agent** from the Agents dropdown
3. When prompted, enter the Jira story key (e.g. `KT-11`)
4. The agent fetches the story, produces `artifacts/requirements.md`
5. Move to the next agent in sequence — each reads the prior artifact

> No story numbers are hardcoded in the agents. Any story key works.

## Secrets

Use `.env.local` (already in `.gitignore`) for any API keys:
- `JIRA_API_TOKEN`
- `GITHUB_TOKEN`
- `KV_REST_API_URL` / `KV_REST_API_TOKEN`

## Story Tracks

| Story | Jira | File |
|---|---|---|
| Option A — Task Due Dates **(active)** | [KT-11](https://bharathwaj1390.atlassian.net/browse/KT-11) | `docs/agentic-sdlc/stories/option-a-due-dates.md` |
| Option B — Task Search *(future demo)* | [KT-12](https://bharathwaj1390.atlassian.net/browse/KT-12) | `docs/agentic-sdlc/stories/option-b-search.md` |

## Structure

```
.github/
  copilot-instructions.md            ← project-wide Copilot context (already exists)
  prompts/
    01-requirements.prompt.md        ← Stage 1 agent
    02-architecture.prompt.md        ← Stage 2 agent
    03-design-review.prompt.md       ← Stage 3 agent
    04-implementation-plan.prompt.md ← Stage 4 agent
    05-implementation.prompt.md      ← Stage 5 agent
    06-review.prompt.md              ← Stage 6 agent
    07-verify.prompt.md              ← Stage 7 agent
    08-pr.prompt.md                  ← Stage 8 agent

docs/agentic-sdlc/
  README.md                          ← this file
  stories/
    option-a-due-dates.md            ← KT-11 active story
    option-b-search.md               ← KT-12 future demo story
  artifacts/                         ← stage outputs
    requirements.md
    architecture.md
    design-review.md
    impl-plan.md
    implementation-log.md
    review-findings.md
    verification-report.md
    pr-description.md
```

## How to Run a Stage

1. Open the relevant `.prompt.md` file in VS Code
2. Click **"Run in Agent Mode"** (or use `@workspace /prompt` in Copilot Chat)
3. Copilot reads the inputs, performs its task, and writes the output artifact
4. Review the artifact, then move to the next stage

## Secrets

Never commit tokens. Use `.env.local` (already in `.gitignore`) for:
- `JIRA_API_TOKEN`
- `GITHUB_TOKEN`
- `KV_REST_API_URL` / `KV_REST_API_TOKEN`


