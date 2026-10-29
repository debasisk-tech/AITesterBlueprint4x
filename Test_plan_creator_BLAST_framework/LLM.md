# 📜 Project Constitution: LLM Rules, Schemas & Architecture (`LLM.md`)

**Project:** AI Test Plan Creator from Jira ID  
**Role:** System Pilot  
**Framework:** B.L.A.S.T. & A.N.T. 3-Layer Architecture  
**Document Status:** Locked Constitution (Protocol 0 / Phase 1)  

---

## 1. System Identity & Core Philosophy

1. **System Identity:** You are the **System Pilot**. Your mission is to generate comprehensive, deterministic, and verifiable QA test plans from a given Jira Issue Key (e.g., `PROJ-101`).
2. **Core Philosophy:**
   - **Deterministic vs. Probabilistic:** Jira API fetching, file operations, ADF parsing, and schema validation are **deterministic** (handled by Python scripts in `tools/`). Synthesis of test cases, scenario expansion, and risk analysis are **probabilistic** (handled by the LLM).
   - **Data-First Contract:** No code runs without an approved, locked data schema.
   - **Zero Unverified Hallucinations:** Every assertion in the test plan must be explicitly traceable back to the Jira ticket. Missing information must be called out rather than fabricated.

---

## 2. A.N.T. 3-Layer Architecture Invariants

All implementation within this project must strictly respect the 3 layers:

```
┌────────────────────────────────────────────────────────┐
│  Layer 1: Architecture (architecture/*.md SOPs)        │
│  - Standard Operating Procedures (SOPs)                │
│  - The Golden Rule: Update SOP before modifying code   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Layer 2: Navigation (main.py / Orchestrator)          │
│  - Evaluates inputs and coordinates tools              │
│  - Never runs raw ad-hoc logic; delegates to tools     │
│  - Enforces schema checkpoints between steps           │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Layer 3: Tools (tools/*.py)                           │
│  - Deterministic, atomic Python scripts                │
│  - Accepts CLI arguments & environment variables       │
│  - Writes all intermediate state into .tmp/            │
└────────────────────────────────────────────────────────┘
```

### Architectural Invariants
1. **Tool Independence:** Every tool script in `tools/` must be executable standalone from the command line with `--help` and standard arguments.
2. **State Isolation:** No tool may mutate persistent configurations or another tool's private scratchpad. All intermediate artifacts must reside in `.tmp/`.
3. **The Golden Rule:** If business logic or prompt rules change, update the corresponding SOP in `architecture/` before touching Python code.

---

## 3. Strict Data Schemas

### 3.1 Schema 1: Normalized Feature Model (`NormalizedFeatureModel`)
This is the sanitized intermediate data structure produced by `tools/fetch_jira.py` and `tools/parse_adf.py` before passing to the LLM.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "NormalizedFeatureModel",
  "type": "object",
  "properties": {
    "jira_key": { "type": "string", "example": "PROJ-101" },
    "summary": { "type": "string", "example": "Add Two-Factor Authentication via SMS" },
    "issue_type": { "type": "string", "example": "Story" },
    "priority": { "type": "string", "example": "High" },
    "components": { "type": "array", "items": { "type": "string" } },
    "labels": { "type": "array", "items": { "type": "string" } },
    "status": { "type": "string", "example": "In Progress" },
    "description_markdown": { "type": "string", "description": "ADF-parsed clean markdown text." },
    "acceptance_criteria": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Extracted list of explicit acceptance criteria or DoD items."
    },
    "linked_issues": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "key": { "type": "string" },
          "relationship": { "type": "string" },
          "summary": { "type": "string" }
        }
      }
    },
    "attachment_names": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["jira_key", "summary", "description_markdown", "acceptance_criteria"]
}
```

---

### 3.2 Schema 2: Generated Test Plan JSON Schema (`GeneratedTestPlanSchema`)
The LLM must produce output conforming to this exact structure before it is rendered into Markdown:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "GeneratedTestPlan",
  "type": "object",
  "properties": {
    "test_plan_id": { "type": "string", "example": "TP-PROJ-101" },
    "jira_key": { "type": "string", "example": "PROJ-101" },
    "title": { "type": "string", "example": "Test Plan: Add Two-Factor Authentication via SMS" },
    "objective": { "type": "string" },
    "scope": {
      "type": "object",
      "properties": {
        "in_scope": { "type": "array", "items": { "type": "string" } },
        "out_of_scope": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["in_scope", "out_of_scope"]
    },
    "prerequisites_and_environment": {
      "type": "array",
      "items": { "type": "string" }
    },
    "test_scenarios": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "example": "TC-001" },
          "title": { "type": "string" },
          "category": { 
            "type": "string", 
            "enum": ["Positive", "Negative", "Boundary", "Security", "Edge Case", "Performance"] 
          },
          "is_inference": { 
            "type": "boolean", 
            "description": "True if this scenario was deduced/inferred rather than explicitly dictated in AC." 
          },
          "preconditions": { "type": "string" },
          "steps": { "type": "array", "items": { "type": "string" } },
          "expected_result": { "type": "string" },
          "priority": { "type": "string", "enum": ["P1", "P2", "P3", "P4"] }
        },
        "required": ["id", "title", "category", "is_inference", "steps", "expected_result", "priority"]
      }
    },
    "entry_criteria": { "type": "array", "items": { "type": "string" } },
    "exit_criteria": { "type": "array", "items": { "type": "string" } },
    "risks_and_mitigations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "risk": { "type": "string" },
          "mitigation": { "type": "string" }
        },
        "required": ["risk", "mitigation"]
      }
    },
    "anti_hallucination_audit": {
      "type": "object",
      "properties": {
        "verified_facts": { "type": "array", "items": { "type": "string" } },
        "missing_information": { "type": "array", "items": { "type": "string" } },
        "assumptions_made": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["verified_facts", "missing_information", "assumptions_made"]
    }
  },
  "required": [
    "test_plan_id",
    "jira_key",
    "title",
    "objective",
    "scope",
    "test_scenarios",
    "anti_hallucination_audit"
  ]
}
```

---

## 4. Behavioral & Anti-Hallucination Rules

1. **Explicit Fact Derivation:**
   - The LLM may only base functional behavior on the provided Jira ticket summary, description, and acceptance criteria.
   - Do NOT invent external APIs, undocumented endpoints, custom database tables, or proprietary internal systems not mentioned in the Jira issue.
2. **Inference Tagging:**
   - Any scenario generated from general QA domain knowledge (e.g., standard SQL injection checks, boundary testing on input lengths not specified in Jira) must set `is_inference: true`.
   - In Markdown output, these must be rendered with an explicit badge: `[Inference (low confidence)]`.
3. **Handling Incomplete Tickets:**
   - If acceptance criteria are missing or ambiguous, the LLM must populate `anti_hallucination_audit.missing_information` with clear questions (e.g., `"Password minimum length not specified in AC."`).
   - The LLM must NEVER quietly make up a specific number (e.g., claiming "Password must be 8 characters" unless stated in Jira).
4. **Mandatory Test Categorization:**
   - Every generated test plan must include at least:
     - Positive Happy-Path scenarios.
     - Negative validation & failure-path scenarios.
     - Boundary / Edge case scenarios.
     - Security / Authorization scenarios.

---

## 5. LLM Runtime & Prompting Strategy

1. **Model Selection:**
   - Preferred: Gemini 2.5/3.x Pro or Flash via `@google/genai` or standard REST API.
   - Fallback: OpenAI GPT-4o / Anthropic Claude 3.5 Sonnet.
2. **Sampling Parameters:**
   - `temperature: 0.1` (Minimize variance, maximize deterministic adherence to schemas).
   - `top_p: 0.95`.
3. **Structured Outputs:**
   - Responses must be requested with `response_mime_type: "application/json"` and the JSON schema registered directly in the API call.
4. **Resiliency & Self-Healing:**
   - If the returned JSON violates Schema 2, a validation error is caught by `pydantic`. The validator feeds the exact ValidationError message back to the LLM for a single targeted self-correction turn before aborting.

