"""
Jira Bug & Testing Dashboard (Robust Server-Side Rendered + Interactive REST)
Zero external runtime dependencies. Instant loading with server-rendered Jira issues.
"""

import os
import json
import base64
import html
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
import requests

def load_env(path):
    c = {}
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    c[k.strip()] = v.strip().strip('"').strip("'")
    return c

def get_jira_config():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    config = {}
    config.update(load_env(os.path.join(parent_dir, ".env")))
    config.update(load_env(os.path.join(current_dir, ".env")))
    for k in ["JIRA_URL", "JIRA_EMAIL", "JIRA_API_TOKEN"]:
        if os.environ.get(k):
            config[k] = os.environ[k]
    
    jira_url = config.get("JIRA_URL", "").rstrip("/")
    jira_email = config.get("JIRA_EMAIL", "")
    jira_token = config.get("JIRA_API_TOKEN", "")
    if not jira_url or not jira_email or not jira_token:
        raise ValueError("Missing JIRA_URL, JIRA_EMAIL, or JIRA_API_TOKEN in .env file.")
    return jira_url, jira_email, jira_token

def get_auth_header():
    jira_url, jira_email, jira_token = get_jira_config()
    auth_str = f"{jira_email}:{jira_token}"
    encoded = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
    headers = {
        "Authorization": f"Basic {encoded}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    return jira_url, headers

def adf_to_text(node):
    if not isinstance(node, dict):
        return ""
    text = ""
    if node.get("type") == "text":
        return node.get("text", "")
    for child in node.get("content", []):
        text += adf_to_text(child)
        if child.get("type") in ["paragraph", "heading", "listItem"]:
            text += "\n"
    return text.strip()

def text_to_adf(plain_text):
    paragraphs = plain_text.strip().split("\n\n")
    content = []
    for p in paragraphs:
        lines = p.split("\n")
        para_content = []
        for i, line in enumerate(lines):
            if line:
                para_content.append({"type": "text", "text": line})
            if i < len(lines) - 1:
                para_content.append({"type": "hardBreak"})
        if para_content:
            content.append({"type": "paragraph", "content": para_content})
    if not content:
        content = [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]
    return {"type": "doc", "version": 1, "content": content}

def fetch_issues_from_jira():
    jira_url, headers = get_auth_header()
    search_url = f"{jira_url}/rest/api/3/search/jql"
    params = {
        "jql": "project = SCRUM ORDER BY updated DESC",
        "fields": "summary,description,issuetype,status,priority,created,updated",
        "maxResults": 50
    }
    res = requests.get(search_url, headers=headers, params=params, timeout=10)
    if res.status_code != 200:
        raise RuntimeError(f"Jira API error {res.status_code}: {res.text}")
    
    raw_issues = res.json().get("issues", [])
    formatted = []
    for issue in raw_issues:
        fields = issue.get("fields", {})
        desc_adf = fields.get("description")
        desc_text = adf_to_text(desc_adf) if desc_adf else ""
        issuetype = fields.get("issuetype") or {}
        status = fields.get("status") or {}
        priority = fields.get("priority") or {}

        formatted.append({
            "key": issue.get("key", ""),
            "id": issue.get("id", ""),
            "summary": fields.get("summary", ""),
            "description": desc_text,
            "type": issuetype.get("name", "Task"),
            "status": status.get("name", "To Do"),
            "priority": priority.get("name", "Medium"),
            "created": (fields.get("created") or "")[:10],
            "updated": (fields.get("updated") or "")[:10],
            "url": f"{jira_url}/browse/{issue.get('key')}"
        })
    return formatted, jira_url

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class JiraDashboardHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.0"

    def _send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Connection", "close")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        jira_url, headers = get_auth_header()

        if path == "/api/issues":
            try:
                issues, j_url = fetch_issues_from_jira()
                self._send_json({"issues": issues, "jira_url": j_url})
            except Exception as e:
                self._send_json({"error": str(e)}, status=500)

        elif path.startswith("/api/transitions/"):
            issue_key = path.split("/")[-1]
            try:
                url = f"{jira_url}/rest/api/3/issue/{issue_key}/transitions"
                res = requests.get(url, headers=headers, timeout=10)
                self._send_json(res.json(), status=res.status_code)
            except Exception as e:
                self._send_json({"error": str(e)}, status=500)

        elif path == "/" or path == "/index.html":
            # Server-Side Rendered View: Never hangs, pre-loads issues directly
            try:
                issues, j_url = fetch_issues_from_jira()
                err_msg = None
            except Exception as e:
                issues = []
                j_url = jira_url
                err_msg = str(e)

            rendered_html = render_dashboard_html(issues, j_url, err_msg)
            body = rendered_html.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.send_header("Connection", "close")
            self.end_headers()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        jira_url, headers = get_auth_header()

        if path == "/api/issues":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length).decode("utf-8"))

            summary = body.get("summary", "").strip()
            description = body.get("description", "").strip()
            issue_type = body.get("type", "Bug")
            priority = body.get("priority", "Medium")

            if not summary:
                self._send_json({"error": "Summary is required"}, status=400)
                return

            issue_type_ids = {
                "Epic": "10001",
                "Subtask": "10002",
                "Task": "10003",
                "Story": "10004",
                "Feature": "10005",
                "Request": "10006",
                "Bug": "10007"
            }
            type_obj = {"id": issue_type_ids[issue_type]} if issue_type in issue_type_ids else {"name": issue_type}

            payload = {
                "fields": {
                    "project": {"id": "10000", "key": "SCRUM"},
                    "summary": summary,
                    "description": text_to_adf(description),
                    "issuetype": type_obj,
                    "priority": {"name": priority}
                }
            }

            try:
                res = requests.post(f"{jira_url}/rest/api/3/issue", headers=headers, json=payload, timeout=10)
                self._send_json(res.json(), status=res.status_code)
            except Exception as e:
                self._send_json({"error": str(e)}, status=500)

        elif path.startswith("/api/issues/") and path.endswith("/transition"):
            parts = path.split("/")
            issue_key = parts[3]
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            transition_id = body.get("transition_id")

            try:
                res = requests.post(
                    f"{jira_url}/rest/api/3/issue/{issue_key}/transitions",
                    headers=headers,
                    json={"transition": {"id": transition_id}},
                    timeout=10
                )
                self._send_json({"status": "updated"}, status=res.status_code if res.status_code != 204 else 200)
            except Exception as e:
                self._send_json({"error": str(e)}, status=500)

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        jira_url, headers = get_auth_header()

        if path.startswith("/api/issues/"):
            issue_key = path.split("/")[-1]
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length).decode("utf-8"))

            fields = {}
            if "summary" in body and body["summary"].strip():
                fields["summary"] = body["summary"].strip()
            if "description" in body:
                fields["description"] = text_to_adf(body["description"])
            if "priority" in body and body["priority"]:
                fields["priority"] = {"name": body["priority"]}

            try:
                res = requests.put(
                    f"{jira_url}/rest/api/3/issue/{issue_key}",
                    headers=headers,
                    json={"fields": fields},
                    timeout=10
                )
                if res.status_code == 204:
                    self._send_json({"status": "updated", "key": issue_key}, status=200)
                else:
                    self._send_json(res.json(), status=res.status_code)
            except Exception as e:
                self._send_json({"error": str(e)}, status=500)

def render_dashboard_html(issues, jira_url, err_msg=None):
    total = len(issues)
    bugs = sum(1 for i in issues if str(i.get("type", "")).lower() == "bug")
    in_prog = sum(1 for i in issues if str(i.get("status", "")).lower() in ["in progress", "qa testing", "in review"])
    done = sum(1 for i in issues if str(i.get("status", "")).lower() == "done")
    domain_display = urllib.parse.urlparse(jira_url).netloc or "jira-instance"

    cards_html = ""
    for item in issues:
        is_bug = str(item.get("type", "")).lower() == "bug"
        type_style = "background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);" if is_bug else "background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3);"
        status_style = "background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);" if str(item.get("status", "")).lower() == "done" else "background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);"

        k = html.escape(str(item.get("key", "")))
        s = html.escape(str(item.get("summary", "")))
        d = html.escape(str(item.get("description", "") or "No description provided"))
        t = html.escape(str(item.get("type", "Task")))
        st = html.escape(str(item.get("status", "To Do")))
        p = html.escape(str(item.get("priority", "Medium")))
        u = html.escape(str(item.get("updated", "")))
        target_url = html.escape(str(item.get("url", "#")))

        cards_html += f"""
        <div class="card" data-key="{k}" data-summary="{s.lower()}" data-type="{t}">
          <div class="card-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge" style="{type_style}">{t}</span>
              <a href="{target_url}" target="_blank" class="ticket-link">{k} &#8599;</a>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge" style="{status_style}">{st}</span>
              <span style="font-size: 11px; color: #94a3b8;">Pri: <strong style="color: #cbd5e1;">{p}</strong></span>
            </div>
          </div>
          <div class="card-title">{s}</div>
          <div class="card-desc">{d}</div>
          <div class="card-footer">
            <span style="font-size: 11px; color: #64748b;">Updated: {u}</span>
            <div style="display: flex; gap: 8px;">
              <button onclick="copyKey('{k}')" class="btn btn-secondary btn-sm">&#128203; Copy ID</button>
              <button onclick="openEditModal('{k}')" class="btn btn-edit btn-sm">&#9998; Edit</button>
            </div>
          </div>
        </div>
        """

    error_banner = f"""
    <div style="background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
      <strong>Jira Connection Error:</strong> {html.escape(err_msg)}
    </div>
    """ if err_msg else ""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jira Bug & Testing Dashboard</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }}
    body {{ background-color: #0f172a; color: #f8fafc; min-height: 100vh; padding-bottom: 40px; }}
    .navbar {{ background: rgba(30, 41, 59, 0.9); border-bottom: 1px solid #334155; padding: 16px 24px; position: sticky; top: 0; z-index: 30; backdrop-filter: blur(8px); }}
    .nav-container {{ max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }}
    .brand {{ display: flex; align-items: center; gap: 12px; }}
    .brand-icon {{ width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #2563eb, #4f46e5); display: flex; align-items: center; justify-content: center; font-size: 20px; }}
    .brand-title {{ font-size: 16px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }}
    .project-pill {{ font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 9999px; background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }}
    .brand-sub {{ font-size: 12px; color: #94a3b8; }}
    .nav-actions {{ display: flex; align-items: center; gap: 12px; }}
    .container {{ max-width: 1200px; margin: 24px auto; padding: 0 16px; }}
    .stats-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }}
    .stat-card {{ background: rgba(30, 41, 59, 0.6); border: 1px solid #334155; border-radius: 12px; padding: 16px; }}
    .stat-label {{ font-size: 12px; font-weight: 600; color: #94a3b8; }}
    .stat-val {{ font-size: 26px; font-weight: 700; margin-top: 4px; }}
    .controls {{ display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }}
    .search-box {{ flex: 1; min-width: 250px; position: relative; }}
    .search-box input {{ width: 100%; background: #1e293b; border: 1px solid #334155; color: #fff; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; }}
    .search-box input:focus {{ border-color: #3b82f6; }}
    .filter-select {{ background: #1e293b; border: 1px solid #334155; color: #fff; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; }}
    .btn {{ padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: 0.15s; }}
    .btn-primary {{ background: #2563eb; color: #fff; }}
    .btn-primary:hover {{ background: #1d4ed8; }}
    .btn-secondary {{ background: #334155; color: #cbd5e1; }}
    .btn-secondary:hover {{ background: #475569; }}
    .btn-edit {{ background: rgba(217, 119, 6, 0.2); color: #fbbf24; border: 1px solid rgba(217, 119, 6, 0.4); }}
    .btn-edit:hover {{ background: rgba(217, 119, 6, 0.3); }}
    .btn-sm {{ padding: 4px 10px; font-size: 11px; border-radius: 6px; }}
    .cards-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 16px; }}
    .card {{ background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; min-height: 180px; }}
    .card:hover {{ border-color: #475569; transform: translateY(-1px); transition: 0.15s; }}
    .card-header {{ display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }}
    .badge {{ font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; }}
    .ticket-link {{ font-family: monospace; font-size: 13px; font-weight: 700; color: #60a5fa; text-decoration: none; }}
    .ticket-link:hover {{ text-decoration: underline; }}
    .card-title {{ font-size: 14px; font-weight: 600; color: #f1f5f9; margin-bottom: 8px; line-height: 1.4; }}
    .card-desc {{ font-size: 12px; color: #94a3b8; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 16px; white-space: pre-line; }}
    .card-footer {{ display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(51, 65, 85, 0.6); padding-top: 12px; margin-top: auto; }}
    .modal-overlay {{ position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(4px); z-index: 50; display: none; align-items: center; justify-content: center; padding: 16px; }}
    .modal {{ background: #1e293b; border: 1px solid #334155; border-radius: 14px; width: 100%; max-width: 540px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }}
    .modal-header {{ display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 16px; }}
    .modal-title {{ font-size: 16px; font-weight: 700; color: #fff; }}
    .form-group {{ margin-bottom: 14px; }}
    .form-group label {{ display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 4px; }}
    .form-group input, .form-group select, .form-group textarea {{ width: 100%; background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 8px 10px; font-size: 13px; color: #fff; outline: none; }}
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {{ border-color: #3b82f6; }}
    .modal-actions {{ display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; border-top: 1px solid #334155; padding-top: 14px; }}
  </style>
</head>
<body>
  <div class="navbar">
    <div class="nav-container">
      <div class="brand">
        <div class="brand-icon">&#128027;</div>
        <div>
          <div class="brand-title">
            Jira Bug & Testing Dashboard
            <span class="project-pill">Project SCRUM</span>
          </div>
          <div class="brand-sub">Project SCRUM &bull; {domain_display}</div>
        </div>
      </div>
      <div class="nav-actions">
        <a href="{jira_url}/jira/dashboards/10001" target="_blank" class="btn btn-secondary btn-sm">&#8599; Jira Cloud Dashboard</a>
        <button onclick="openCreateModal()" class="btn btn-primary">+ Create Bug / Ticket</button>
      </div>
    </div>
  </div>

  <div class="container">
    {error_banner}

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Tickets</div>
        <div class="stat-val" style="color: #fff;">{total}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Bugs</div>
        <div class="stat-val" style="color: #f87171;">{bugs}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">In Progress / QA</div>
        <div class="stat-val" style="color: #fbbf24;">{in_prog}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Completed (Done)</div>
        <div class="stat-val" style="color: #34d399;">{done}</div>
      </div>
    </div>

    <div class="controls">
      <div class="search-box">
        <input id="searchInput" oninput="filterCards()" type="text" placeholder="Search ticket key, summary...">
      </div>
      <div style="display: flex; gap: 8px;">
        <select id="typeFilter" onchange="filterCards()" class="filter-select">
          <option value="ALL">All Types</option>
          <option value="Bug">Bugs Only</option>
          <option value="Story">Stories</option>
          <option value="Task">Tasks</option>
          <option value="Feature">Features</option>
        </select>
        <button onclick="window.location.reload()" class="btn btn-secondary">&#8635; Refresh</button>
      </div>
    </div>

    <div id="cardsGrid" class="cards-grid">
      {cards_html}
    </div>
  </div>

  <!-- Create Modal -->
  <div id="createModal" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">+ Create New Bug / Ticket</div>
        <button onclick="closeCreateModal()" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">&times;</button>
      </div>
      <form onsubmit="handleCreate(event)">
        <div class="form-group">
          <label>Issue Type</label>
          <select id="createType">
            <option value="Bug">Bug (Defect)</option>
            <option value="Story">Story</option>
            <option value="Task">Task</option>
            <option value="Feature">Feature</option>
          </select>
        </div>
        <div class="form-group">
          <label>Summary / Title *</label>
          <input id="createSummary" required placeholder="e.g. Login page does not give option for forgot password">
        </div>
        <div class="form-group">
          <label>Priority</label>
          <select id="createPriority">
            <option value="Highest">Highest</option>
            <option value="High" selected>High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div class="form-group">
          <label>Description & Acceptance Criteria</label>
          <textarea id="createDescription" rows="4" placeholder="Steps to reproduce, expected vs actual behavior, acceptance criteria..."></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" onclick="closeCreateModal()" class="btn btn-secondary">Cancel</button>
          <button type="submit" id="createBtn" class="btn btn-primary">Create Ticket in Jira</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Edit Modal -->
  <div id="editModal" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">&#9998; Edit Ticket: <span id="editKeyTitle" style="color: #60a5fa;"></span></div>
        <button onclick="closeEditModal()" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">&times;</button>
      </div>
      <form onsubmit="handleEdit(event)">
        <input type="hidden" id="editKey">
        <div class="form-group">
          <label>Summary *</label>
          <input id="editSummary" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label>Priority</label>
            <select id="editPriority">
              <option value="Highest">Highest</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div class="form-group">
            <label>Workflow Status</label>
            <select id="editStatusTransition">
              <option value="">(Keep current status)</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="editDescription" rows="4"></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" onclick="closeEditModal()" class="btn btn-secondary">Cancel</button>
          <button type="submit" id="editBtn" class="btn btn-primary" style="background: #d97706;">Save Changes</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    const issuesData = {json.dumps(issues)};

    function filterCards() {{
      const q = document.getElementById('searchInput').value.toLowerCase();
      const type = document.getElementById('typeFilter').value;
      const cards = document.querySelectorAll('.card');

      cards.forEach(card => {{
        const k = card.getAttribute('data-key').toLowerCase();
        const s = card.getAttribute('data-summary');
        const t = card.getAttribute('data-type');
        const matchQ = k.includes(q) || s.includes(q);
        const matchT = (type === 'ALL') || (t === type);
        card.style.display = (matchQ && matchT) ? 'flex' : 'none';
      }});
    }}

    function copyKey(k) {{
      navigator.clipboard.writeText(k);
      alert('Copied Jira Key: ' + k);
    }}

    function openCreateModal() {{
      document.getElementById('createSummary').value = '';
      document.getElementById('createDescription').value = '';
      document.getElementById('createModal').style.display = 'flex';
    }}
    function closeCreateModal() {{
      document.getElementById('createModal').style.display = 'none';
    }}

    async function handleCreate(e) {{
      e.preventDefault();
      const btn = document.getElementById('createBtn');
      btn.disabled = true;
      btn.innerText = 'Creating in Jira...';

      const payload = {{
        type: document.getElementById('createType').value,
        summary: document.getElementById('createSummary').value,
        priority: document.getElementById('createPriority').value,
        description: document.getElementById('createDescription').value
      }};

      try {{
        const res = await fetch('/api/issues', {{
          method: 'POST',
          headers: {{'Content-Type': 'application/json'}},
          body: JSON.stringify(payload)
        }});
        const data = await res.json();
        if (res.ok && data.key) {{
          alert('Success! Created ticket: ' + data.key);
          window.location.reload();
        }} else {{
          alert('Failed to create ticket:\\n' + (data.error || JSON.stringify(data)));
        }}
      }} catch (err) {{
        alert('Error: ' + err.message);
      }} finally {{
        btn.disabled = false;
        btn.innerText = 'Create Ticket in Jira';
      }}
    }}

    async function openEditModal(key) {{
      const item = issuesData.find(i => i.key === key);
      if (!item) return;

      document.getElementById('editKey').value = key;
      document.getElementById('editKeyTitle').innerText = key;
      document.getElementById('editSummary').value = item.summary;
      document.getElementById('editPriority').value = item.priority;
      document.getElementById('editDescription').value = item.description;

      const transSelect = document.getElementById('editStatusTransition');
      transSelect.innerHTML = '<option value="">(Keep current: ' + item.status + ')</option>';

      try {{
        const res = await fetch('/api/transitions/' + key);
        const data = await res.json();
        if (data.transitions) {{
          data.transitions.forEach(t => {{
            transSelect.innerHTML += `<option value="${{t.id}}">Move to &rarr; ${{t.to.name}}</option>`;
          }});
        }}
      }} catch (e) {{
        console.error(e);
      }}

      document.getElementById('editModal').style.display = 'flex';
    }}

    function closeEditModal() {{
      document.getElementById('editModal').style.display = 'none';
    }}

    async function handleEdit(e) {{
      e.preventDefault();
      const key = document.getElementById('editKey').value;
      const btn = document.getElementById('editBtn');
      btn.disabled = true;
      btn.innerText = 'Updating...';

      const payload = {{
        summary: document.getElementById('editSummary').value,
        priority: document.getElementById('editPriority').value,
        description: document.getElementById('editDescription').value
      }};
      const transId = document.getElementById('editStatusTransition').value;

      try {{
        const res = await fetch('/api/issues/' + key, {{
          method: 'PUT',
          headers: {{'Content-Type': 'application/json'}},
          body: JSON.stringify(payload)
        }});

        if (transId) {{
          await fetch(`/api/issues/${{key}}/transition`, {{
            method: 'POST',
            headers: {{'Content-Type': 'application/json'}},
            body: JSON.stringify({{transition_id: transId}})
          }});
        }}

        alert('Updated ticket ' + key + ' successfully!');
        window.location.reload();
      }} catch (err) {{
        alert('Error: ' + err.message);
      }} finally {{
        btn.disabled = false;
        btn.innerText = 'Save Changes';
      }}
    }}
  </script>
</body>
</html>"""

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Jira Bug & Ticket Testing Dashboard")
    parser.add_argument("--port", type=int, default=8080, help="Port to run the dashboard on")
    args = parser.parse_args()

    jira_url, jira_email, _ = get_jira_config()
    server_address = ("127.0.0.1", args.port)
    httpd = ThreadedHTTPServer(server_address, JiraDashboardHandler)
    print(f"================================================================")
    print(f"[RUNNING] Jira Bug & Testing Dashboard running at: http://localhost:{args.port}")
    print(f"Connected to Jira: {jira_url} (User: {jira_email})")
    print(f"Jira Cloud Dashboard: {jira_url}/jira/dashboards/10001")
    print(f"Press Ctrl+C to stop.")
    print(f"================================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping dashboard server...")

if __name__ == "__main__":
    main()
