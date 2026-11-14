# AIQ discussion — coverage and integration into the talk

Prepared 2026-11-14 from the AIQ post, a community reply, and the speaker's response supplied in this chat. This captures discussion themes for presentation preparation. It is not a technical audit, a verified risk classification, or an agreed company policy.

Source attachment: `C:\Users\Kamil\.codex\attachments\a04fefc2-af12-409d-8fbd-5d4d08fde1bb\Pasted text.txt`. Participant names are omitted from this summary. The post and response are the speaker's views; the community challenge is a question, not proof of defects in the app.

Current plan: [Speaker structure](tech-talk-speaker-structure.md). Earlier material: [Original reflections](course-feedback.md), [additional thought bank](tech-talk-additional-reflections.md), and [earlier outline](tech-talk-outline.md).

## Confirmed direction and audience outcome

The speaker selected **Changed way of working**. The initial expectation of informal prompting developed into an appreciation for a repeatable workflow with plans, documented decisions, handoffs, focused context, and verification.

Refine “the LLM is not the tool; the process is the tool” into a less absolute claim: the usable working setup includes the model, tools, workflow, project memory, checks, and human judgment. Model capability still matters. Process makes the work more inspectable and resumable; it does not guarantee correctness, safety, or the ability to build almost anything.

The intended audience aha, in proposed speaker wording:

> “Instead of starting with 'What should I ask AI?', start with 'What am I trying to deliver, how will I check it, and who needs to be involved?'”

The intended change is observable: a listener can choose one recurring task and prepare a short delivery brief containing outcome, context/constraints, acceptance checks, and reviewer/owner. Then they can try a small solution and inspect the result. This is an achievable experiment, not a requirement to build a whole app after attending.

## Coverage check

“Already covered” describes the plan before this update. “Strengthened” means the topic existed but needed a more explicit argument or audience implication. “Added” identifies material from the discussion newly given a place in the plan.

| Theme from the supplied exchange | Previous coverage | Integration |
| --- | --- | --- |
| Course as the spark; guided lifecycle across new and existing projects | Already covered | Retained in the five-minute course segment |
| Initial Waterfall discomfort and later planning payoff | Already covered | Retained as the main turning point, without endorsing rigid upfront specification |
| Skills hand off tangible artifacts | Already covered | Retained in the workflow segment |
| Shared documentation reduces repeated decisions and context reconstruction | Already covered | Connected more explicitly to the audience's changed starting question |
| AI trade-off questions develop technical understanding | Strengthened | Section 4 distinguishes learning from independently judging omitted options |
| Harnesses, hooks, human decisions, and AI execution | Already covered | Clarified the whole working setup; avoided claiming process replaces model capability |
| Working prototype versus production suitability | Strengthened | Explicit distinction in verification and the reality-check section |
| Hidden anti-patterns, late rewrites, and cost of delayed expertise | Added | Community question becomes the transition to section 7; early involvement also appears in section 4 |
| Personal managed-service solution, internal tool, and exposed/critical system | Added | Three illustrative contexts in section 7, without safety labels or headcount thresholds |
| Appropriate technical involvement from the beginning | Strengthened | The involvement decision becomes part of shaping the work, not only final acceptance |
| Misconfiguration and application responsibilities despite managed services | Strengthened | Provider-dominant-risk assertion removed from the presentation formulation |
| Internal tools and spreadsheets as a comparison | Added with qualification | Internal access and an Excel baseline do not establish safety; compare actual consequences and controls |
| False understanding, overconfidence, and inability to assess under/overengineering | Strengthened | A central distinction between producing an outcome and judging its suitability |
| Responsibility shifts rather than a disappearance of developers | Strengthened | Concludes the reality-check section and supplies a prepared Q&A answer |
| Ownership, maintenance, infrastructure/model costs, and retirement | Added | Named in the four practical questions and preserved in Q&A |
| Price/speed incentives versus responsible delivery | Added | Discussion question, not a new full presentation segment |
| Experimentation versus control; unsupported tool proliferation | Added | Q&A and the route from prototype to team adoption |
| Risk boundaries for cases between obvious extremes | Added | Questions guide review; examples are not a universal permission framework |
| Evening work over approximately three weeks | More specific source wording | Replaces vague time framing when effort is mentioned; remains a personal recollection |

## The important new tension

The strongest addition is the community question: if an app performs its expected functions, can its non-developer creator judge whether it has sound foundations? Could an engineer brought in late discover issues that require expensive rework?

This is worth presenting because it challenges the success story on its own terms. It supports a more useful conclusion than either “everyone can now build production software alone” or “non-developers should not experiment.”

The speaker's answer can acknowledge:

- They learned to understand options and compare stated trade-offs.
- They cannot independently evaluate every proposed architecture or identify every missing concern.
- A process creates opportunities to ask questions and record answers.
- Those artifacts can also create false confidence if the answers are insufficient and nobody can challenge them.
- Expertise may need to be involved while defining boundaries and architecture, before implementation builds on a weak assumption.
- The discussion does not establish that any particular defect or rewrite need exists in KeepInTouch.

## Three illustrative contexts

These examples organize a conversation about appropriate support. They are not mutually exclusive tiers, an assessment of the actual app, or a company approval policy.

| Context | What the illustration makes visible | Question to ask |
| --- | --- | --- |
| A small personal tool using managed services | Existing services can reduce work in some areas, while configuration, app logic, data handling, and ownership remain | What am I responsible for, and what data would a failure expose or lose? |
| An internal tool in an established corporate environment | Identity, access, and infrastructure may already exist, but integrations, privileges, and business dependency still matter | What access and consequences does the tool actually have, and who approves and maintains it? |
| An exposed, sensitive-data, or business-critical application | The consequences and expertise needed can exceed what the creator can independently assess | Which specialist input is needed before we commit to the architecture and delivery plan? |

An internal tool can handle sensitive data or become business-critical. A personal app can contain sensitive information. Few users, managed hosting, a local database, or a private network do not by themselves establish low risk.

Use four practical prompts rather than a numeric classification:

1. What data does it handle?
2. Who or what can access it?
3. What happens if it fails or behaves incorrectly?
4. Who will review, maintain, fund, and own it?

These prompts support discussion; they do not replace a suitable technical assessment or an existing organizational policy.

## Statements to refine before presenting

| Original idea | Presentation formulation |
| --- | --- |
| “The biggest risk lies with the provider.” | Managed services handle defined infrastructure responsibilities. We still own configuration and application behavior; this case does not establish where the largest risk sits. |
| “It probably shouldn't do more harm than emailed Excel files.” | The existing spreadsheet workflow may also be risky. Compare actual data access, consequences, traceability, and controls rather than assuming equivalence. |
| “10–100 internal users” as a boundary | User count is only one characteristic. Exposure, privileges, sensitivity, dependency, and consequences can matter even for a small tool. |
| “The process forces us through the questions, so we're safe.” | The workflow exposes some questions and records choices; an informed reviewer may still need to challenge the answers. |
| “An expert can verify security at the end.” | Some decisions need appropriate expertise before later work depends on them. Final checks cannot make every foundational choice cheap to change. |
| “AI can build almost everything.” | This experience expands what the speaker can attempt; it does not establish unlimited capability or reliable independent assessment. |
| “This is becoming the standard way of working.” | This approach changed how the speaker works. Broad adoption claims need separate evidence and are unnecessary here. |
| “Vibe coding is not the way.” | For this app and the speaker's goals, informal prompting alone did not provide the process, memory, and evidence they wanted. Keep exploratory prompting distinct from handing an unchecked result to users. |
| “The LLM isn't a tool; the process is the proper tool.” | The useful unit is the full setup: model, tools, workflow, durable context, checks, and people. |

The Kiro/spec-driven comparison in the post can be mentioned as the speaker's association. Avoid adding a product comparison or attributing the general method to a company without separately verifying the claim. Correct the acronym to SDLC when describing the software development life cycle.

## Where this belongs in 40 minutes

The timing remains 35 minutes of presentation plus five minutes of Q&A. No new standalone governance section is added.

- Opening and thesis: name the changed starting question and retain the modest speaker identity.
- Planning, 11:00–17:00: include deciding when expertise is required, and the distinction between learning a trade-off and independently evaluating it.
- Workflow, 17:00–24:00: make the full working setup visible; artifacts carry decisions across sessions.
- Verification, 24:00–29:00: distinguish a demonstrated behavior from broader architectural and production suitability.
- Reality check, 29:00–33:00: center the actual community challenge. About 30 seconds for the challenge, 60 seconds for capability versus judgment, 90 seconds for contexts and questions, and 60 seconds for ownership and transition. Cut the optional color-change anecdote first if necessary.
- Closing, 33:00–35:00: give the audience a small delivery brief they can apply to a task, including checks and ownership.
- Q&A: preserve maintenance, funding, retirement, rework economics, and experimentation-versus-control questions without attempting to resolve all of them in the main talk.

## Discussion questions to retain

- At what point does a personal experiment become a team-supported service?
- When should a developer or other specialist become involved, and what should they inspect first?
- How do we account for verification and maintenance when comparing cost and delivery speed?
- Who pays for infrastructure/model usage and handles access, upgrades, support, and retirement?
- What route lets people experiment while making adoption and ownership explicit?
- How do we distinguish documented answers from enough understanding to challenge those answers?
- How should we approach the ambiguous cases between a harmless prototype and an obviously critical system?

These are candidate discussion prompts, not seven extra audience exercises. Select one or two if Q&A needs a starting point.

## Source handling and next review

The post, community reply, and response are evidence of a conversation and of the speaker's changing view. They do not independently verify implementation quality, security, scaling, cost, or a rewrite requirement. No current product capability or incident claim from the post is needed for the talk, and no such claim was independently researched in this integration pass.

The speaker will next review and adjust the plan. Keep the selected direction, the 40-minute budget, and a single practical takeaway stable while revising the sequence. The `craft-inspirational-talk` skill influenced this pass by keeping the audience's next action explicit and distinguishing personal observations, objections, and established project evidence.
