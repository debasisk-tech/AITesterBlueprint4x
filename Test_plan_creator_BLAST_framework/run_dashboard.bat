@echo off
echo Starting Jira Bug & Testing Dashboard...
cd /d "%~dp0"
python jira_bug_dashboard.py --port 8080
pause

