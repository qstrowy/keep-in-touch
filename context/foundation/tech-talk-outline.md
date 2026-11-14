# First Steps from Project Manager to Builder: Bringing Ideas to Life with AI

**Expanded collection update, 2026-11-14:** the speaker is now gathering a substantive course sneak peek before tightening the eventual agenda. Use [the current speaker structure](tech-talk-speaker-structure.md) and [source-grounded 10x workflow research](tech-talk-10x-workflow-research.md), including the golden path, two loops, 23-skill dictionary, and ten PM lessons. The timing below is the earlier reference draft; the new source material is not being forced into it yet.

Working talk proposal — 2026-10-26. Based on the KeepInTouch journey and the speaker's reflections. Planned duration: 40 minutes including five minutes of Q&A. This is an agenda and narrative brief, not a slide deck.

Revised after the speaker's additional voice notes. The course gets five dedicated minutes as the trigger for the learning journey. See [Additional reflections and claim refinements](tech-talk-additional-reflections.md) for the complete thought bank and optional material.

For the current section-by-section arguments, evidence, and transitions, use [Speaker structure](tech-talk-speaker-structure.md), prepared on 2026-11-13 with the `craft-inspirational-talk` skill. This earlier outline retains the wider preparation material.

Review update 2026-11-14: the speaker selected **Changed way of working**. The [speaker structure](tech-talk-speaker-structure.md) now incorporates the supplied AIQ discussion, including early technical involvement, capability versus judgment, and maintenance/ownership. See [coverage and claim refinements](tech-talk-community-feedback.md). Its four-minute reality-check section now centers on the community challenge; the overall slot remains 40 minutes. Use that current structure rather than treating the older segment notes below as the final plan.

## Purpose and audience

Help colleagues understand how a person with PM experience and limited hands-on development experience can direct AI through a complete MVP delivery workflow. Give them a realistic starting point and a way to assess results.

Primary audience: IT PMs, BAs, POs, delivery leads, and colleagues who understand software delivery but do not regularly write production code. Secondary audience: QA, UX, developers, and engineering managers interested in collaboration across roles. No coding knowledge is required. Explain terms through user consequences before naming tools.

Promise to attendees: see a working example, understand the human decisions behind it, learn how context and verification supported delivery, and identify one small experiment they could run themselves.

## Main message

> AI let me take an idea much further on my own. Clear decisions, shared project memory, and verification made that progress manageable. I still had to own the outcome.

The personal thread: “The course got me started. The process helped me continue. Building the app changed what I thought I could do—and made me more aware of what I still couldn't assess.”

Supporting takeaways:

1. PM skills in problem definition, scope, trade-offs, and acceptance become directly useful in building software with AI.
2. AI can contribute across discovery, research, planning, implementation, testing, and documentation.
3. A working demonstration, passing tests, and production readiness answer different questions. Be clear about what the evidence supports.

## Narrative

Use a personal journey with a question running through it: “How far could I get if I could direct the technical work myself?”

Start with the result so the audience knows the story has a payoff. Then rewind to the expectation of rapid building, the surprise of substantial planning, the initial feeling of returning to Waterfall, and the later realization that some early decisions made subsequent delivery easier.

Use concrete scenes from the project instead of a chronological tour of all course modules. Explicitly credit the course: the speaker believes they would not have started this journey without its structure and guidance. Then show how those methods played out, including the difficulty restarting after a break and an agent spending disproportionate effort on a small visual change. These two latter incidents are the speaker's recollections, not independently verified timings or causal diagnoses.

Qualify “non-technical”: the speaker was an experienced IT PM with some technical understanding, working outside a day-to-day developer role. Existing delivery experience was an advantage. Attribute “a dozen or so evenings” to the speaker's recollection, not a measured productivity study. Distinguish active building time from calendar duration and course-learning time.

## Timed agenda

| Time        | Segment                                 | Audience experience                                                             | Message                                                                              |
| ----------- | --------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 00:00–02:00 | Could a PM take this all the way?       | Opening question, personal starting point, one screenshot                       | Familiar delivery skills can support a new kind of experiment.                       |
| 02:00–07:00 | The course that got me started          | Why the guidance mattered, its scope, and the initial process friction          | A structured route made the experiment approachable.                                 |
| 07:00–11:00 | The thing I built                       | Short synthetic-data demo of KeepInTouch                                        | This is a complete user journey with persistence, access control, and an AI feature. |
| 11:00–17:00 | Why am I writing documents again?       | Personal tension, architecture trade-off, and feature evolution                 | Early choices reduced repeated uncertainty; the product still evolved.               |
| 17:00–24:00 | Keeping the work moving across sessions | Follow one feature, show artifact handoffs and the restart-after-a-break story  | Decisions and status need to survive beyond one conversation.                        |
| 24:00–29:00 | How did I know it worked?               | A browser test catching a deliberate defect; rules encoded in executable checks | Verification needs to distinguish visible success from durable behavior.             |
| 29:00–33:00 | When confidence gets ahead of evidence  | The small visual tweak, process overhead, and limits of personal expertise      | Scope and risk still need active human judgment.                                     |
| 33:00–35:00 | Find your first small problem           | Reporting, rules, or a recurring task with a clear expected result              | Start with a bounded problem and explicit acceptance criteria.                       |
| 35:00–40:00 | Discussion                              | Audience questions                                                              | Explore relevance to company work without promising universal applicability.         |

Rehearse to 33 minutes of prepared material. The two remaining minutes absorb transitions, short answers, and demo delays. Audience polls belong inside the stated segment timings.

## Segment notes and evidence

### Opening: 00:00–02:00

Possible opening:

> “I'm an IT PM. I understand delivery, but I don't write application code as my day job. I wanted to find out how far I could get building an application with AI—and what I would still have to take responsibility for.”

Ask for a show of hands: “Who uses AI for individual tasks, and who has taken something from an idea all the way to a deployed application?”

Present the scope in plain language: a small personal MVP, built using existing services, with automated tests and a deployment workflow. The hook is the span of work one person could direct. Avoid opening with a list of frameworks or job roles allegedly replaced.

### The course as the trigger: 02:00–07:00

Open with the speaker's own attribution: “Without the course, I probably wouldn't have started. It gave me a route through a process I understood from the PM side but hadn't carried out myself.”

Spend roughly one minute on why the guided approach helped; two minutes on its breadth, from CLI/IDE interaction and APIs to discovery, architecture, implementation, testing, review, and deployment; and two minutes on reusable skills, tangible outputs, and what initially felt too heavy. Use one map of the lifecycle rather than a catalog of commands.

Introduce programming-oriented tools as approachable through an approved setup and a bounded task. Examples the speaker encountered include Codex, Claude Code, and GitHub Copilot. Avoid product rankings or installation tutorials. Their value in this story is the ability to work with files and run checks, beyond answering questions in a chat.

### Demo: 07:00–11:00

Explain KeepInTouch in one sentence: “I record things worth remembering about people, then ask for useful context before our next conversation.”

Use fictional people and notes. Start signed in, with a prepared record. Add one note, request Core Topics, expand a suggested question, and show how a topic can be hidden or excluded. Show persistence with a reload if the flow fits comfortably. End with a brief view of signed-out access being blocked, or use a prepared clip.

Explain that relationship records remain in that browser, while selected note context and exclusions are sent to the configured AI provider on request. “Local data” does not mean no external processing.

Have a short recording of the same path. Real email delivery, waiting for sign-in links, and unpredictable provider latency should not consume the demo slot. Recheck the demo environment before the talk; previous verification is historical evidence.

### Turning point: 11:00–17:00

Keep the speaker's own line:

> “I came in with an appreciation for Agile—or, more honestly, a reasonable amount of chaos. Suddenly I was writing requirements, discussing architecture, and planning tests. It felt suspiciously like going backwards.”

Use local versus cloud storage as the architecture example. Ask: “Would you prioritize keeping these relationship notes in the browser, or having them available on every device?” Give the audience a brief choice, then explain the actual compromise: browser-local storage supported the chosen boundary and smaller scope, but left sync and recovery outside the MVP.

Show one short decision excerpt. Translate architecture into consequences the audience can understand. Then acknowledge that discovery continued: the original overlapping anchor categories were later simplified into Core Topics. Early planning stabilized some foundations without freezing the product.

Use “short planning-and-feedback cycles” rather than “Waterfall is no longer a problem because AI is fast.” Faster document production does not eliminate the consequences of a wrong requirement or delayed user feedback. Distinguish the useful structure from rigid stage gates and excessive upfront detail.

### Keeping the work moving: 17:00–24:00

Trace one feature: remembering subjects the user does not want suggested again.

1. Intent: “Don't keep suggesting this subject.”
2. Clarification: temporary hiding and future exclusion are different behaviors.
3. Specification and plan: define confirmation, storage, and what a future AI request receives.
4. Execution: AI implements a bounded change and corresponding checks.
5. Acceptance: inspect the experience, review evidence, and record the outcome.

Mention that semantic exclusions are best-effort. A recorded requirement or passing contract test cannot guarantee every future model response.

Show three small excerpts at most: requirement, planned check, recorded result. Explain documentation as shared project memory: “I could return in another session and recover what we had decided.” Documentation still needs maintenance and comparison with the actual code.

Make the handoff explicit: one skill's output becomes another skill's input. Where a skill checks prerequisites, a missing artifact can reveal that an earlier step was skipped. This is guidance, not a guarantee that every omission is detected.

Use the speaker's recollection of returning after a three-to-five-day break and struggling to recover their own place. They report creating a summary skill to record the day's work, decisions, outstanding checks, and next action. Show a five-line example with links to the authoritative files; do not claim the illustrative note is an actual historical artifact.

For separate initiatives, prefer separate chats with a small relevant context packet. New chats can reduce unrelated conversational baggage, but do not eliminate bias or reconstruct omitted decisions automatically. Use task boundaries rather than restarting after every tiny action. Context compaction can omit detail, so keep important decisions and exact constraints in durable files.

Show the skill map as a usability aid: purpose, expected input, output, and next step. The speaker found the number of skills hard to remember. This is one concrete cost of the system, and a reason to start with a few workflows.

Define terms briefly:

- A skill is a reusable set of instructions for a particular kind of work, such as researching a repository or reviewing an implementation.
- The agent harness is the software around the model that manages its work: access to tools, context, execution, permissions, and feedback from checks. Project instructions and skills help configure how it operates.
- A hook automatically triggers a check at a particular point. A configured check can provide repeatable feedback, but it only checks the rules it actually covers.

For an existing repository, explain focused exploration: locate relevant modules and contracts, inspect tests and decisions, summarize with references, and reopen details when needed. Summaries save context but can omit information or become stale.

### Verification and executable rules: 24:00–29:00

Use a concrete question: “If an edited name looks correct on screen, do we know it was saved?”

The certification record documents a useful experiment: edit persistence was temporarily bypassed in a controlled exercise. The UI showed the updated name, but the browser test failed after reload. Restoring the implementation made the test pass.

Use a recording if reproducing this exercise for the talk. Reproduce only in an isolated local copy and restore it before presenting. Do not present a reconstruction as original recorded footage.

Then show the delivery checks at a high level: types and lint, unit/integration tests, build, browser tests, and deployment. A prepared screenshot is enough. Translate each into a question it helps answer. Do not equate a green pipeline with comprehensive security or correctness.

Introduce the determinism insight through a simple example: ask AI to implement “reject future interaction dates,” then run that check against fixed inputs and a fixed date. Repeatable rule evaluation is useful even when the AI that helped write the program varies its responses. Generated code still needs inspection and tests; changing clocks, network services, state, and live model calls can change results. Separate fixed-rule checks from the app's generative suggestions.

The certification file last verified on 2026-09-13 records 91 unit/integration tests and six browser tests. Verify counts and statuses before putting them on a slide. The current repository workflow includes typecheck, lint, unit tests, build, and browser tests; deployment uses the separate Cloudflare path. Verify a current successful deployment before claiming one in the presentation.

### Confidence, friction, and limits: 29:00–33:00

Discuss the learning in trade-off questions: storage, auth, privacy, scope, error handling, and acceptance. Explain that consequential choices sometimes require specialist review if the decision exceeds the speaker's expertise.

Use three real observations:

- The initial amount of documentation felt excessive; ceremony needs to match the size and risk of the change.
- Simplifying three overlapping anchor categories into Core Topics improved the product concept. AI could implement either design; product judgment still mattered.
- Cross-device sync was parked to keep the MVP manageable. Scope cuts were part of delivery.

An optional brief personal reflection: asking AI to review the collaboration highlighted recurring habits such as scope discipline and asking for evidence. Treat this as an interesting interpretation of the record, not an objective assessment of the speaker.

Tell the small-tweak story as a counterweight to the success: the speaker recalls an agent spending around 25 minutes on a small frontend adjustment before they intervened. The precise cause is unverified. The lesson is to ask for the proposed scope, what is taking time, and the smallest safe edit. Process ceremony should match the change; a color adjustment should not automatically trigger a full architecture exercise. A model agreeing with the interruption is not itself evidence of the correct diagnosis.

Use “my confidence grew faster than my ability to assess every technical risk” rather than labeling this the Dunning–Kruger effect. Explain where expert review is still needed. AI review can catch omissions but cannot certify a plan or implementation as flawless.

### Limits to weave into 29:00–33:00

Describe the achievement as a deployed MVP with documented decisions and verification evidence. Avoid “everything needed for production” or “fully secure.” State the relevant limits: browser-local records, no sync/recovery, limited operational observation, and no proof of large-scale behavior.

Managed services carry some infrastructure duties; application access control, configuration, data handling, and verification remain application responsibilities. Test coverage does not independently certify AI-generated code. Writing tests with the same assistant makes meaningful failure demonstrations especially useful.

The comparison with traditional delivery should concern competencies: backend/data, frontend, deployment, design, and QA. Those skills are often distributed across a team, but this project cannot establish that it replaced five specialists or measured a particular speedup.

### First experiment and close: 33:00–35:00

End with an accessible experiment: choose one small, approved problem; define the user outcome and acceptance criteria; give AI relevant context; deliver one complete slice; inspect the result and evidence. Use synthetic data and company-approved tools where applicable. Possible examples are a report-formatting script, fixed-rule validation, or a user-story drafting workflow with human review. The speaker also mentioned exam-generation and recipe-post projects; include only examples they can accurately describe or demonstrate, and make the human-review needs clear.

Possible final line:

> “My PM skills turned out to be part of the build process. I could take the idea further myself, but I still needed to decide what mattered and ask how we knew it worked.”

## What to show and what to leave out

Show the user journey, one decision with consequences, one requirement-to-result trail, one meaningful test failure, a simple delivery-check view, and one scope cut. Use approximately 10–12 slides plus the demo.

Leave implementation code, full prompt transcripts, the complete skill catalog, stack comparisons, installation details, model selection, and the full folder tree for optional follow-up material. Give the course its requested five-minute introduction, then return to the experience and lessons. Keep handover templates and the skill dictionary as useful take-home material. Avoid real relationship notes, credentials, or company data in examples.

Do not lead with “this is technically unimpressive.” The subject is how the work was carried out and verified, not novel technology. Also avoid unsupported security claims, team-replacement claims, and a live build from scratch.

## Audience prompts and likely questions

Use at most three planned prompts so discussion does not fragment the story:

1. Opening: “Who uses AI for individual tasks, and who has taken an idea all the way to deployment?”
2. Architecture: “Browser-local privacy boundary or availability across devices—which would you prioritize here?”
3. Verification: “What would convince you this app works beyond the demo?”

Likely Q&A:

- “How technical do I need to be?” Explain the advantage of existing delivery knowledge and knowing when to seek help.
- “How much did it cost?” Bring actual subscriptions, provider usage, and hosting figures if available; do not estimate from memory.
- “How many hours?” Distinguish recalled evenings, active work, course learning, and calendar time.
- “Can I use this on company systems?” Relate the approach to approved tools, data access, and engineering ownership; the personal project does not establish permission.
- “Who maintains the code?” The owner or adopting team still needs an agreed maintenance responsibility.
- “How do you trust AI-written tests?” Use the deliberate-defect example and acknowledge that independent review can still be needed.
- “Does this replace developers?” Describe the broader span of work a PM could direct in a bounded MVP and the expertise still required for higher-risk systems.
- “Could you do it again?” The workflow and judgment can be reused; a different domain changes the unknowns and necessary review.
- “Should I always use a new chat?” Use a fresh chat for a distinct task or phase, carrying relevant decisions and status; continuity is useful within a focused task.
- “Can a cheaper model implement any good plan?” A clear plan can help delegation, but cannot guarantee correctness across models. Compare actual results, correction effort, cost, and risk.

## Suggested invitation

**From PM to Builder: What It Took to Ship an App with AI**

What happens when an IT PM with limited coding experience tries to build and deploy an application? In this session I'll share my KeepInTouch journey: a working MVP, the decisions I still had to make, the process that initially felt a bit like Waterfall, and the checks that helped me assess the result. Expect a short demo and practical lessons about working with AI across delivery. Suitable for PMs, BAs, POs, QA, and anyone curious about going beyond isolated AI tasks. No coding knowledge required.

## Preparation and sources

Before the talk: confirm the demo path, capture a fallback recording, verify any displayed test/build/deployment results, collect actual cost/time information if available, and rehearse the 35-minute boundary. If time is short, cut tool detail and the optional collaboration reflection before cutting the evidence or Q&A.

Project sources:

- [Speaker reflections](course-feedback.md)
- [Additional reflections and claim refinements](tech-talk-additional-reflections.md)
- [Certification evidence](certification-evidence.md)
- [Roadmap and parked scope](roadmap.md)
- [Current CI workflow](../../.github/workflows/ci.yml)
- [Browser test conventions and synthetic authentication](../../tests/e2e/README.md)
- [Public release record](../archive/2026-09-12-public-production-entry/release.md)

These are project records, not a fresh audit of current hosted behavior.
