# 📋 Project Task Plan: AI Test Plan Creator from Jira ID

**Framework:** B.L.A.S.T. (Blueprint, Link, Architect, Stylize, Trigger)  
**Layer Architecture:** A.N.T. (Architecture, Navigation, Tools)  
**Status:** Protocol 0 - In Progress (Initialization)  
**Current Date:** 2026-10-28  

---

## 🎯 Master Objective & North Star
Build a deterministic, self-healing CLI and modular automation engine that ingests a single Jira Issue ID (or key, e.g., `PROJ-1234`), extracts all relevant feature metadata (summary, description, acceptance criteria, components, attachments, issue links), and generates an enterprise-grade, IEEE 829/Agile-compliant Test Plan complete with positive, negative, boundary, security, and edge-case scenarios under strict anti-hallucination constraints.

---

## 🚦 Phase Overview & Status Matrix

| Phase | Description | Status | Gate Requirement |
| :--- | :--- | :--- | :--- |
| **Protocol 0** | Project Initialization & Memory Setup | ✅ **Complete** | Memory files created, execution halted until user sign-off |
| **Phase 1: B** | Blueprint (Vision, Schemas & SOP Contracts) | ⏳ Pending | 5 Discovery questions answered & Data Schema approved |
| **Phase 2: L** | Link (API Handshake & Credential Verification) | ⏳ Pending | Jira & LLM connection verified via minimal atomic scripts |
| **Phase 3: A** | Architect (3-Layer Build: SOPs, Nav, Tools) | ⏳ Pending | Architecture SOPs written before tool code; tools testable |
| **Phase 4: S** | Stylize (Formatting, Markdown/Gherkin tables, UI) | ⏳ Pending | Formatted test plan reviewed and validated |
| **Phase 5: T** | Trigger (Autonomous Execution & CLI/CI Integration)| ⏳ Pending | End-to-end regression test with mock & live Jira tickets |

---

## 📝 Detailed Checklists

### 🟢 Protocol 0: Project Initialization (Current Phase)
- [x] **0.1 Initialize Project Memory Files**
  - [x] Create `findings.md` (Jira REST API research, curl/request recipes, ADF parsing, industry test plan standard, risks).
  - [x] Create `task_plan.md` (Phases, checklists, gates, deliverables).
  - [x] Create `progress.md` (Chronological progress logs at 10m/30m/60m cadences, errors, results).
  - [x] Create `LLM.md` (Project Constitution: Schemas, behavioral rules, anti-hallucination protocols, A.N.T. invariants).
- [x] **0.2 Strict Execution Halt**
  - [x] Execution halted in accordance with Protocol 0. Strictly no scripts written in `tools/` or `architecture/` until user returns for Phase 1 Blueprint sign-off.

---

### 🏗️ Phase 1: Blueprint (Vision & Logic)
- [ ] **1.1 Discovery Questions Protocol**
  - [ ] Present the 5 BLAST Discovery Questions to the user:
    1. *North Star:* What is the singular desired outcome?
    2. *Integrations:* Which Jira instance type (Cloud vs Server/Data Center)? Which LLM provider (Gemini, OpenAI, Anthropic, or local)? Are credentials available?
    3. *Source of Truth:* Are Acceptance Criteria stored in `description` or custom fields (e.g., `customfield_10100`, Zephyr, Xray)?
    4. *Delivery Payload:* Where should the generated test plan be delivered (Local `.md` file, Jira issue comment, new Confluence page, or new Jira Test Plan ticket)?
    5. *Behavioral Rules:* Preferred test scenario style (BDD/Gherkin vs Table vs Step-by-Step)? Required compliance level?
- [ ] **1.2 Data-First Rule: Schema Approval**
  - [ ] Review and lock down `JiraRawPayloadSchema` in `LLM.md`.
  - [ ] Review and lock down `NormalizedFeatureModel` in `LLM.md`.
  - [ ] Review and lock down `GeneratedTestPlanSchema` in `LLM.md`.
- [ ] **1.3 Blueprint Sign-Off**
  - [ ] User confirms discovery answers and approves schemas.

---

### ⚡ Phase 2: Link (Connectivity & Handshake)
- [ ] **2.1 Environment Configuration**
  - [ ] Create `.env.example` defining `JIRA_BASE_URL`, `JIRA_USER_EMAIL`, `JIRA_API_TOKEN`, `JIRA_IS_CLOUD`, `LLM_API_KEY`, `LLM_MODEL`.
  - [ ] Create local `.env` (gitignored).
- [ ] **2.2 Atomic Handshake Scripts**
  - [ ] Build `tools/handshake_jira.py`: Minimal script to ping Jira REST API with a test issue ID and confirm 200 OK.
  - [ ] Build `tools/handshake_llm.py`: Minimal script to ping the LLM endpoint and verify token validity and latency.
- [ ] **2.3 Verification Gate**
  - [ ] Confirm both external connections succeed before writing core business logic.

---

### ⚙️ Phase 3: Architect (The 3-Layer Build)
#### Layer 1: Architecture (`architecture/` SOPs)
- [ ] Write `architecture/SOP_001_jira_ingestion.md`:
  - Input: Jira Issue Key.
  - Output: Sanitized `.tmp/jira_issue_<KEY>.json` and normalized `.tmp/feature_spec_<KEY>.md`.
  - Error recovery: 401, 403, 404, rate limit handling.
- [ ] Write `architecture/SOP_002_test_plan_synthesis.md`:
  - Input: Normalized Feature Spec + Schema.
  - Output: Structured JSON test plan `.tmp/test_plan_<KEY>.raw.json`.
  - Rules: Anti-hallucination, mandatory negative/edge scenarios, inference labeling.
- [ ] Write `architecture/SOP_003_test_plan_stylize_export.md`:
  - Input: Validated JSON test plan.
  - Output: Professional Markdown test plan `.tmp/test_plan_<KEY>.md` or external delivery payload.

#### Layer 2: Navigation (Decision Making & Routing)
- [ ] Build `main.py` / `orchestrator.py`:
  - Routes data sequentially: SOP-001 -> Tool-001 -> SOP-002 -> Tool-002 -> SOP-003 -> Tool-003.
  - Inspects intermediate `.tmp/` files at each step.
  - Halts execution with descriptive error diagnostics if any invariant is breached.

#### Layer 3: Tools (`tools/` Deterministic Python Scripts)
- [ ] `tools/fetch_jira.py`: Deterministic REST client with rate limiting & error handling.
- [ ] `tools/parse_adf.py`: Deterministic parser converting Jira Cloud ADF nodes into clean Markdown.
- [ ] `tools/synthesize_plan.py`: LLM caller with strict Pydantic schema enforcement and retry logic.
- [ ] `tools/format_exporter.py`: Exporter converting structured JSON into production-ready Markdown / Gherkin tables.

---

### ✨ Phase 4: Stylize (Refinement & UI)
- [ ] **4.1 Output Formatting Review**
  - [ ] Beautiful GitHub-Flavored Markdown styling.
  - [ ] Clear Gherkin / BDD tables (`Scenario`, `Given`, `When`, `Then`).
  - [ ] Anti-hallucination verification badges: `[Verified Fact]` vs `[Inference (low confidence)]`.
- [ ] **4.2 User Feedback Loop**
  - [ ] Present generated sample test plan to the user for structural critique.
  - [ ] Fine-tune prompt guidelines and formatting constraints based on feedback.

---

### 🚀 Phase 5: Trigger (Autonomous Execution)
- [ ] **5.1 CLI Ergonomics**
  - [ ] Support simple execution: `python main.py --jira-id PROJ-101 --output ./test_plans/`
  - [ ] Support offline mock mode: `python main.py --mock-file ./fixtures/sample_jira_ticket.json`
- [ ] **5.2 Automated Validation**
  - [ ] Verify test suite against 3 diverse Jira ticket formats (rich AC, minimal AC, legacy wiki markup).
- [ ] **5.3 Final Documentation & Handoff**
  - [ ] Update README with quickstart instructions and architecture diagrams.

