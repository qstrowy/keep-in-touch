# Additional Tech Talk reflections — organized thought bank

Captured from the speaker's pasted voice-note transcript on 2026-10-26. This document preserves their additional ideas, separates presentation claims from personal recollections, and records editorial refinements. It complements [the talk outline](tech-talk-outline.md) and [the earlier reflections](course-feedback.md). It is preparation material, not a transcript of the final talk or a new technical audit.

## 1. The course was the trigger

The speaker wants the course to receive about five minutes. It was the spark that made them begin this learning journey; they believe they would not have started without it. Its guidance reduced the difficulty of knowing where to start and what to do next.

Describe its breadth as experienced: ways of working with coding agents, CLI versus IDE interaction, APIs, product definition, architecture, plans, implementation, testing, review, and deployment. The intended term is SDLC: software development life cycle.

Useful phrasing:

> “The course gave me a route through the whole thing. I already understood software delivery from the PM side, but I hadn't carried out all those parts myself.”

Positive observations: clear progression, reusable workflows, tangible artifacts, and handoffs. Critical observations: substantial upfront documentation, many skills to navigate, and the risk of too much ceremony for a small change. Keep both in the talk.

## 2. Planning felt like going back to Waterfall

Preserve the personal reaction: an appreciation for Agile, or a reasonable amount of chaos, made early documentation and architecture feel like a backward step. Later, having settled some foundational decisions helped delivery proceed with fewer repeated discussions.

The speaker proposes that the speed of AI makes this organized sequence more attractive. Refine the conclusion: shorter cycles make planning, implementation, and review easier to repeat. Faster production does not make rigid Waterfall safe, remove uncertainty, or replace user feedback.

What works: define boundaries, review consequential choices, implement a small slice, inspect the outcome, and revise when needed. What does not work: fully specify an uncertain product, delay all user feedback, or route every minor adjustment through a heavy lifecycle.

> “I stopped seeing the plan as a delay once it started saving us repeated decisions. We could still change the product; we had a more stable starting point.”

## 3. Skills made the process usable

The important pattern was that each step produced something the next step could use: requirements, research, a plan, verification evidence, a review, or a recorded status. The process became inspectable rather than existing only in conversation.

Some skills check expected inputs and can point out a missing predecessor or artifact. Avoid claiming that every skill knows the entire process, that every step must be used, or that the chain enforces correctness automatically. Prerequisite checking is only as strong as the instructions and execution.

One useful illustration: intent → plan → implementation evidence → review. Show only a short excerpt at each point. The audience does not need all the skill names.

> “Even when I forgot the sequence, the workflow sometimes reminded me that a previous step was missing.”

## 4. Documentation became project memory

Capture the problem: after exploring several alternatives and choosing one, an undocumented decision can be reopened later. The speaker must explain the same rationale again, spending attention and tokens to reconstruct the conversation.

Useful levels of documentation:

- Product: problem, user, purpose, scope, and exclusions.
- Architecture: boundaries, dependencies, assumptions, and trade-offs.
- Decisions: selected option, rejected alternatives, rationale, and conditions for revisiting.
- Delivery: roadmap, current phase, completed work, and next action.
- Evidence: executed checks, results, limitations, and pending acceptance.

Different artifacts serve different audiences and tasks; avoid copying every decision into every file. A brief rationale with a link to its authoritative source is often enough. Docs need maintenance and can disagree with live code.

> “If we've considered five approaches and picked one, write down which one and why. Otherwise the next session can become the same meeting again.”

## 5. Keep each task's context relevant

The speaker found that very long conversations could carry unrelated work and superseded options into a new task. They prefer a fresh chat for a distinct initiative, with a concise handover or references to current artifacts.

Refinement: optimize relevance, not the smallest possible context. Omitting a constraint is also a failure. A fresh chat reduces conversational baggage but does not guarantee an unbiased model. A summary can preserve an incorrect assumption as easily as a correct decision.

Automatic compaction summarizes earlier context and can omit useful detail. Do not claim that every platform deletes the original history or implements compaction identically. The practical lesson is that decisions and exact constraints should have durable references outside an automatic summary.

Suggested pattern: finish a coherent unit, update status and decisions, capture any remaining transient information, then start the next distinct unit with the relevant context. No need to restart after every tiny action.

## 6. Restarting after a break revealed a human problem too

The speaker recalls a break of roughly three to five days, then spending time reconstructing what they had done and where to continue. They report creating a custom summary skill that produced a small Markdown restart note.

This is a strong human story: documentation helped the PM recover context as well as the agent. The existence and contents of that custom skill have not been independently inspected for this talk preparation.

An illustrative restart note:

```text
Completed: [outcome and evidence link]
Current task: [specific phase or change]
Decisions to retain: [links and key constraints]
Pending: [checks, risks, approvals, or unfinished work]
Next action: [one concrete starting step]
```

Optional additions: files or branch in use, commands/skills used, latest commit, and an active server or process. Include only what helps resumption. Keep the note short and link to durable records instead of duplicating them.

Where current artifacts already preserve everything necessary, a separate handover can be minimal. Opening a new chat still requires finding the right project and checking its present state.

## 7. Many skills create their own navigation problem

The speaker recalls roughly 30 skills across their course experience and sometimes forgot their names or purposes. Treat that count as an approximate recollection, not a count of the current repository.

A small dictionary or diagram can show purpose, when to use it, expected input, output, and next step. It can also show optional routes, such as a small direct edit versus a change needing research and a plan.

Keep one simple workflow map in the presentation and provide the fuller dictionary as take-home material. People starting out should not feel they must memorize dozens of commands.

## 8. Programming tools became approachable

Encourage the audience to try coding-oriented tools for a bounded problem even if programming is not their day job. The speaker mentions Codex, Claude Code, and GitHub Copilot as examples they encountered.

Focus on capabilities useful to this journey: inspecting files, editing an artifact, executing a script, and running a check. Do not claim one tool is currently best or that all have identical capabilities. Tool setup and product comparisons belong in follow-up material.

> “You can ask for a useful result and learn what the tool is doing along the way. Start small enough that you can inspect the outcome.”

## 9. AI can help write repeatable rule-based software

The speaker's insight: variable natural-language answers do not prevent AI from helping implement a program that evaluates explicit rules repeatedly.

Example for this project: reject a future interaction date. For fixed inputs, a fixed notion of today, and the same environment, a deterministic check can return a repeatable result. Another approachable example is checking required report fields.

Refinement: AI-generated code is not automatically deterministic, correct, or suitable. Results can depend on clocks, services, randomness, state, and live model calls. The generative Core Topics feature remains variable. Testing and controlling dependencies matter.

> “For a repeated rule, I don't always need to ask the model to decide again. I can use it to help build and test the rule once, then run the program.”

## 10. Confidence can outgrow the ability to assess the result

Finishing a working app made the speaker feel they could build almost anything. They also recognized that they could not independently assess every choice concerning scaling, security, privacy, or overengineering.

Use this as honest reflection rather than diagnosing the Dunning–Kruger effect. Increased capability and remaining knowledge gaps can coexist.

> “I felt much more capable. That didn't mean I suddenly knew how to judge every architecture or security decision.”

Distinguish ability to produce an artifact from ability to validate it under every condition. More consequential or unfamiliar systems can require specialist review.

## 11. The small visual tweak that took too long

The speaker recalls asking for a minor frontend visual change, then interrupting after approximately 25 minutes of disproportionate agent effort. They asked why it was taking so long, whether broader changes were necessary, and what the agent was actually planning.

This is a speaker-reported anecdote. Do not assert a verified cause, exact timing, or the literal text of the agent's reply. The model's agreement that it overcomplicated the task is not independent proof.

The useful habit: ask for scope, the files involved, the reason for continued effort, and the smallest safe completion. Reserve broad analysis for decisions that warrant it. The same process that organizes a substantial feature can become waste on a cosmetic edit.

Possible audience prompt: “When would you interrupt an agent that is still working?” Keep it optional if three other prompts are already scheduled.

## 12. Plan, review, execute, verify

The speaker found planning more important than expected, with code writing often the easier part. Preserve that as their experience rather than a universal ranking of engineering activities.

Plan review can expose assumptions, missing acceptance criteria, and weak points before implementation. Implementation review and tests help compare the outcome with the requirements. Neither review proves there are no flaws. Repeated reviews by the same assistant may preserve correlated mistakes.

Make reviews purposeful: what specific risk or uncertainty is this review checking? A tiny change may not need a separate written plan review. A complex change may need human specialist review in addition to automated checks.

## 13. Matching models to work is a hypothesis to test

The speaker proposes using a capable reasoning model for planning and delegating bounded implementation to a less expensive model after the plan is clear.

Present this as an optional strategy to evaluate. A good plan can reduce ambiguity but cannot make any model reliably implement any task. Track actual task success, correction effort, total cost, and latency. The largest model is not guaranteed to produce the best plan; the cheapest implementation attempt may cost more after corrections.

Keep model tiers, token economics, and product names outside the core 40-minute story unless specifically asked. The general lesson is to delegate a clear task with observable acceptance criteria.

## 14. Start with recurring annoyances

Invite people to look for small tasks with an existing pattern or rule: preparing a report, reformatting structured data, checking completeness, or drafting user stories with review. A reusable skill can guide a repeated judgment-heavy workflow; a script can execute fixed steps; an agent can combine tools when needed.

The speaker also mentions their exam-generation, recipe-post, and data-analysis initiatives. They can use those as personal examples if they can accurately describe them, but these notes do not verify their implementations.

Discuss the task's risk. Formatting a report, producing an exam, and analyzing company data have different validation and access needs. Use examples the audience can inspect and data the tools are authorized to process.

> “Find one small thing you keep explaining to the chat. Could you turn the useful part into a repeatable workflow?”

## 15. Where the additional material belongs

| Material | Placement |
| --- | --- |
| Course as the trigger and guided SDLC | Five-minute introduction |
| Waterfall discomfort and later payoff | Main personal turning point |
| Skills handing off tangible artifacts | Core workflow explanation |
| Documented decisions and restart after a break | Core practical lesson |
| Meaningful test and repeatable rules | Proof segment |
| Small-tweak overprocessing and confidence limits | Closing reality check |
| Simple everyday problem to try | Final invitation to act |
| Complete skill dictionary and handover template | Take-home material |
| Model selection, token trade-offs, and detailed tooling | Q&A or a separate session |
| AI's assessment of the speaker | Optional brief reflection, cut first |

There is more material than fits in 40 minutes. Keep the personal journey as the organizing thread. Use practical techniques to explain what happened at each turning point rather than presenting an exhaustive list of tips.

## 16. Candidate lines in the speaker's style

> “I wanted to build something. Apparently, first I had to organize myself. That was the less pleasant part.”

> “The documentation became useful the moment I came back after a few days and couldn't remember what I had done.”

> “Sometimes the skill knew which step I had skipped before I remembered the name of that step.”

> “A small color change taking 25 minutes was a useful reminder that I still had to manage the scope.”

> “I came out of it thinking I could build much more. I also came out with a better list of things I couldn't yet judge.”

> “Find something small that annoys you repeatedly. Make the expected result clear, build one useful piece, and check it.”

These are suggested formulations, not verbatim quotations from a historical conversation.
