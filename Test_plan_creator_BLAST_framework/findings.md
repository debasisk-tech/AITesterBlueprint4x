# 🔍 Research & Technical Findings: Jira-to-Test Plan Engine

**Project:** AI Test Plan Creator from Jira ID  
**Framework:** B.L.A.S.T. (Blueprint, Link, Architect, Stylize, Trigger)  
**Layer Model:** A.N.T. (Architecture, Navigation, Tools)  
**Last Updated:** 2026-10-28  

---

## 1. Executive Summary & Thought Process

### 1.1 The Problem Statement
Generating high-quality, comprehensive QA test plans manually from Jira tickets is time-consuming, prone to cognitive fatigue, and often skips negative scenarios, security boundaries, edge cases, and dependency validation. Jira issues often vary wildly in quality: some have rich Acceptance Criteria (AC), while others have only a one-line summary or poorly formatted descriptions.

### 1.2 Our Architectural Thinking
To build an enterprise-grade, deterministic, and self-healing test plan generator, we separate concerns using the **A.N.T.** pattern:
1. **Deterministic Data Ingestion (Layer 3 - Tools):** We never ask an LLM to "fetch" or "browse" Jira directly if we can do it deterministically via Python with Jira REST APIs.
2. **Deterministic Preprocessing:** Raw Jira payloads (especially Jira Cloud v3 Atlassian Document Format / ADF) must be cleanly parsed into normalized Markdown before reaching the LLM context window.
3. **Probabilistic Reasoning (Layer 2 - Navigation / LLM):** The LLM is given structured, normalized inputs under strict anti-hallucination rules to synthesize test scenarios (Positive, Negative, Boundary, Edge Cases, Security, Performance).
4. **Deterministic Validation (Layer 3 - Tools):** The LLM response is forced into a strict JSON schema (Pydantic validation). If parsing fails, self-healing triggers retry or fallback formatting.
5. **Stylized Delivery (Layer 1 & Phase 4):** Delivery formatted as high-grade Markdown, BDD/Gherkin tables, or exportable Jira/Confluence format.

---

## 2. Jira REST API Integration Findings

Jira exposes two major API architectures:
- **Jira Cloud:** Uses REST API v3 (`/rest/api/3/issue/{issueKey}`) with **Atlassian Document Format (ADF)** for text fields.
- **Jira Data Center / Server:** Typically uses REST API v2 (`/rest/api/2/issue/{issueKey}`) with raw text or Atlassian Wiki Markup.

### 2.1 Authentication Strategies
1. **Jira Cloud (API Token):**
   - Authentication header: `Authorization: Basic <base64(email:api_token)>`
   - Generated from: Atlassian Account Settings > Security > Create API token.
2. **Jira Server / Data Center (PAT - Personal Access Token):**
   - Authentication header: `Authorization: Bearer <personal_access_token>`
3. **Jira Cloud OAuth 2.0 (3LO):**
   - Ideal for SaaS apps, but overkill for automated CLI tools; API Token or PAT is preferred for deterministic CLI workers.

---

## 3. Concrete API Requests & cURL Commands

### 3.1 Jira Cloud REST API v3 - Fetch Issue Details
Fetches the summary, description, issue type, status, priority, components, labels, and issue links.

```bash
curl --request GET \
  --url "https://your-domain.atlassian.net/rest/api/3/issue/PROJ-101?fields=summary,description,issuetype,status,priority,components,labels,issuelinks,attachment,comment" \
  --header "Authorization: Basic $(echo -n 'user@company.com:YOUR_API_TOKEN' | base64)" \
  --header "Accept: application/json"
```

### 3.2 Jira Data Center / Server REST API v2
```bash
curl --request GET \
  --url "https://jira.your-company.com/rest/api/2/issue/PROJ-101?fields=summary,description,issuetype,status,priority,components,labels,issuelinks,attachment,comment" \
  --header "Authorization: Bearer YOUR_PERSONAL_ACCESS_TOKEN" \
  --header "Accept: application/json"
```

### 3.3 Python Implementation (`requests` with Resiliency)
```python
import os
import base64
import requests
from typing import Dict, Any, Optional

def fetch_jira_issue(jira_key: str, domain: str, email: str, token: str, is_cloud: bool = True) -> Dict[str, Any]:
    """
    Deterministically fetches issue details from Jira REST API.
    Handles Cloud (Basic Auth + v3 API) and Data Center (Bearer + v2 API).
    """
    fields = [
        "summary",
        "description",
        "issuetype",
        "status",
        "priority",
        "components",
        "labels",
        "issuelinks",
        "attachment",
        "comment"
    ]
    fields_param = ",".join(fields)
    
    if is_cloud:
        url = f"https://{domain}.atlassian.net/rest/api/3/issue/{jira_key}?fields={fields_param}"
        auth_str = f"{email}:{token}".strip()
        encoded_auth = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
        headers = {
            "Authorization": f"Basic {encoded_auth}",
            "Accept": "application/json"
        }
    else:
        url = f"{domain.rstrip('/')}/rest/api/2/issue/{jira_key}?fields={fields_param}"
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }

    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        status_code = response.status_code
        if status_code == 401:
            raise PermissionError(f"[401 Unauthorized] Check your Jira API Token or Email. Response: {response.text}")
        elif status_code == 403:
            raise PermissionError(f"[403 Forbidden] Account lacks permission to access issue {jira_key}.")
        elif status_code == 404:
            raise FileNotFoundError(f"[404 Not Found] Issue key {jira_key} does not exist in domain {domain}.")
        else:
            raise RuntimeError(f"HTTP error {status_code} fetching {jira_key}: {http_err}")
    except requests.exceptions.RequestException as req_err:
        raise ConnectionError(f"Network error communicating with Jira: {req_err}")
```

---

## 4. Jira Data Structure & Parsing Findings

### 4.1 Atlassian Document Format (ADF) Challenge
In Jira v3, `description` is not plain text or markdown; it is an ADF JSON tree:
```json
{
  "type": "doc",
  "version": 1,
  "content": [
    {
      "type": "paragraph",
      "content": [
        {"type": "text", "text": "As a user, I want to reset my password."}
      ]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{"type": "text", "text": "Must send verification code to registered email."}]
            }
          ]
        }
      ]
    }
  ]
}
```

### 4.2 Deterministic ADF-to-Markdown Parser
Passing raw ADF JSON directly to an LLM wastes context tokens and degrades prompt adherence. We must implement an internal deterministic DFS (depth-first search) recursive parser:
- `paragraph` -> text + newline
- `heading` -> `#` * level + text
- `bulletList` -> `* ` per `listItem`
- `orderedList` -> `1. ` per `listItem`
- `codeBlock` -> ` ```language ... ``` `
- `table` -> Markdown table

### 4.3 Custom Fields for Acceptance Criteria & Test Cases
Many enterprise Jira instances do not keep Acceptance Criteria in `description`; they use custom fields such as:
- `customfield_10014` (Epic Link / Feature Link)
- `customfield_10020` (Sprint / Agile info)
- `customfield_10100` or custom named fields ("Acceptance Criteria", "Gherkin AC", "Definition of Done")
- Zephyr Scale / Xray Test Issue links (`issuelinks`)

**Finding:** The tool must allow a configuration mapping for custom fields in `.env` or config JSON (e.g., `JIRA_AC_CUSTOM_FIELD=customfield_10100`).

---

## 5. Test Plan Generation & Prompting Strategy

### 5.1 Test Plan Industry Standards
A standard, enterprise-ready Test Plan should combine IEEE 829 principles with Agile execution:
1. **Test Plan Header:** Test Plan ID, Jira Reference, Version, Target Release, Date.
2. **Objective & Feature Scope:**
   - In-Scope Features (explicitly derived from AC).
   - Out-of-Scope Items (explicit boundaries to prevent scope creep).
3. **Environment & Prerequisites:** Test data requirements, browser/OS matrix, configurations, API dependencies.
4. **Test Strategy & Categorization:**
   - Positive Functional Scenarios (Happy path, expected workflows).
   - Negative Scenarios (Invalid inputs, permission denials, rate limit hits).
   - Boundary & Edge Cases (Threshold values, null payloads, max character limits).
   - Security & Authorization (RBAC validation, SQLi/XSS checks on inputs, token expiry).
   - Performance & Concurrency Considerations (Load impact, race conditions).
5. **Detailed Test Scenarios (Gherkin / Tabular):**
   - Scenario ID, Title, Type, Preconditions, Steps, Expected Result, Priority.
6. **Entry & Exit Criteria:** Conditions to start testing and sign off for release.
7. **Risks, Assumptions, & Mitigations:** Identified blockers and technical risks.

### 5.2 Anti-Hallucination & Verifiability Invariants
Adhering to `ANTI-HALLUCINATION.rules.md`:
- **Explicit Facts:** The LLM may only assert functional behavior specified in the Jira summary, description, and AC.
- **Inference Tagging:** Any inferred test scenario (e.g., inferring password complexity checks when the ticket mentions "password reset") must be explicitly tagged as `[Inference (low confidence)]`.
- **Missing Information Section:** If the Jira ticket lacks non-functional requirements or boundary parameters, the output must explicitly list: `Missing / Unknown Information: Unspecified password length policy`.

---

## 6. Constraints & Edge Cases Identified

| Edge Case | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Empty or minimal Jira ticket** | LLM hallucinates entire system behavior | Enforce validation check: If text < 30 words, halt and prompt user for supplemental context or mark all scenarios as low confidence. |
| **ADF Parser Crash on unknown node** | Tool fails before reaching LLM | Implement graceful node traversal fallback that extracts `.text` from leaf nodes. |
| **Jira Cloud 429 Rate Limits** | API request fails under batch processing | Implement exponential backoff retry decorator in `fetch_jira_issue.py`. |
| **Large description + 50 attachments** | Exceeds token context or slows down processing | Filter attachments to metadata only (names, MIME types); summarize long text or chunk logically. |
---

## 7. Jira Cloud Dashboard & Bug Management Findings (Live Verification)

During testing and verification with project `SCRUM`, the following live API endpoints were validated:

1. **Jira Cloud Native Dashboard:**
   - Successfully created a native dashboard: **"Bug & QA Testing Dashboard"**
   - URL: `https://<your-domain>.atlassian.net/jira/dashboards/<dashboardId>`
   - Configured with live gadgets:
     - `com.atlassian.jira.gadgets:filter-results-gadget` (Filter: `project = SCRUM ORDER BY updated DESC`)
     - `com.atlassian.jira.gadgets:assigned-to-me-gadget`
     - `com.atlassian.jira.gadgets:pie-chart-gadget`
     - `com.atlassian.streams.streams-jira-plugin:activitystream-gadget`

2. **Issue Creation (`POST /rest/api/3/issue`):**
   - Verified creating test bugs with summary, ADF description, priority, and issuetype (`Bug`).
   - Successfully created test ticket `SCRUM-5`.

3. **Issue Editing (`PUT /rest/api/3/issue/{key}`):**
   - Verified updating summary, description, and priority (returned `204 No Content`).

4. **Workflow Status Transitions (`POST /rest/api/3/issue/{key}/transitions`):**
   - Supported workflow states: `To Do` (11), `In Progress` (21), `In Review` (31), `QA Testing` (41), `Done` (51).

5. **Local Testing Dashboard (`jira_bug_dashboard.py`):**
   - Created standalone zero-dependency dashboard server using Python's `http.server` + `requests`.
   - Allows QA engineers to instantly create, view, edit, filter, and transition bugs, and copy ticket IDs for test plan creation.


