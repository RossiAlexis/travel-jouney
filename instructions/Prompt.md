# Travel journey - Agent prompt

Research and create an app to register travels, get the context from `instructions/00-PROJECT-OVERVIEW` and review the existing apps inside the `apps/` folder.
The idea of the project is to be a monorepo with the fullstack web app, mobile app, backend and MCP.

Create a team agent `tra-1-plan` with 4 parallel agents, then aggregate their findings into `docs/plan/travel-journey-plan`.


## Agent 1 - Business and Product

**Name"** `business-product`
**Model:** Sonnet
**Sub-Agent type:** `product-strategy-advisor`

Use web search to gather competitor and market data. Output structured table, not prose.

- Competitor comparisson matrix: User experience, features, platforms, free/paid.
- User Experience comparison: Connection flow steps, technology used, missing features.


## Agent 2 - Technical architecture
**Name"** `tech-architect`
**Model:** Opus
**Sub-Agent type:** `system-architect`

Review the current architecture and solution to identify imporovements opportunities and make an evaluation if the current architecture is the best to support the product or something needs to be changed. 

- Create mermaid diagrams for the architecture overview. 
- Identify the data flow and look for edge cases and create diagrams to show that data flow.


## Agent 3 - UX designer
**Name"** `ux-designer`
**Model:** Sonnet
**Sub-Agent type:** `premium-ux-designer`

Review the current design, palette, theme, flows and patterns and make an evaluation about it. Use web search to look into competitors and see what kind of experience they offer and propose changes if needed. 

## Agent 4 - Devil's advocate
**Name"** `devils-advocate`
**Model:** Opus
**Sub-Agent type:** `general-purpose`

Your job is to challenge and stress-test the findings from agents 1-3. After they complete their research, use `SendMessage` to communicate with each agent directly:

- Send messages to `business-product`: Question the competitor matrix - are we comparing apples with apples? Challenge the narratives assumptions.

- Send messages to `tech-architect`: Challenge technology stack decision, are we over-engineering? Challenge the providers use and if we an use deploy platforms for a minimal cost.

- Send messages to `ux-designer`: Challenge the simple solutions, are we looking well on what is possible with GSAP and Three.js? Are we holding back crazy ideas? 


## Lead Synthesis (You - Opus)
After all 4 agents report back, write the final report to '`docs/plan/travel-journey-plan-final.md' containing:
1. **Go / No-Go recommendation** with rationale
2. **Tech stack recommendation** - using existing one vs change everything (with reasoning)
4. **Architecture recommendation** - include the Mermaid diagram and abstraction layer design
5. **Risk register** - from Agent 4's devil's advocate analysis, with mitigations
6. **Implementation phases** - suggested rollout plan with effort estimates



