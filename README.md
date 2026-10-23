# 🔍 Open PR Reviewer

> **Offline-First, Zero-API-Key AI Agent Skill for Automated Pull Request Reviews**  
> *Built for Hacktoberfest Hack Day — Track 1: Best Open-Source AI Project*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Standard: Agent Skills](https://img.shields.io/badge/Standard-Agent%20Skills%20v1.0-emerald)](https://agentskills.io/specification)
[![Engine: Ollama](https://img.shields.io/badge/Engine-Ollama%20(Local)-orange)](https://docs.ollama.com/)

---

## 📌 Problem Statement

Open-source maintainers are buried under pull requests. Manual code reviews are time-consuming, inconsistent, and often miss critical security risks and regression bugs before merging.

Existing AI code review solutions suffer from three core drawbacks:
1. **Privacy & Security Risks:** Sending proprietary or pre-release open-source code to external cloud LLM servers.
2. **High Costs:** Requiring paid API tokens and recurring subscriptions.
3. **Closed Ecosystems:** Proprietary integrations that cannot be ported between tools.

---

## 💡 Solution

**Open PR Reviewer** is a 100% open-source, local-first code review tool and Agent Skill compliant with the [Agent Skills Specification](https://agentskills.io/specification).

- **100% Private & Offline:** Powered locally by Ollama (`codellama:7b` / `qwen2.5-coder`). No external server calls, no telemetry, and zero network leakage.
- **Fail-Safe Heuristic Engine:** Features an instant regex-based heuristic safety net to catch critical secrets and injection flaws even when local LLM instances are cycling.
- **Agent Skill Ready:** Plugs directly into autonomous coding agents like OpenCode, Cursor, and Claude Code using standardized I/O schemas.
- **Interactive UI + CLI:** Inspect diffs in real time via an intuitive dashboard or pipe `git diff` streams straight from terminal workflows.

---

## 🏗️ Architecture

```
+-------------------------------------------------------------+
|                     Input Git Diff                          |
|             (CLI stdin / Web UI Text Area)                  |
+------------------------------+------------------------------+
                               |
                               v
               +---------------+---------------+
               |    Diff Parsing & Chunking    |
               +---------------+---------------+
                               |
               +---------------+---------------+
               |    Local Ollama Daemon        |
               |    (CodeLlama-7B / Qwen)      |
               +---------------+---------------+
                               |
                   [LLM Reachable?]
                   /              \
            (Yes) /                \ (No / Timeout)
                 v                  v
    +-------------------+    +--------------------+
    | Structured JSON   |    | Heuristic Fallback |
    | AI Vulnerability  |    | Regex Engine       |
    | Analysis          |    | (Secrets, SQLi)    |
    +---------+---------+    +---------+----------+
              \                        /
               \                      /
                v                    v
         +----------------------------------+
         |      Standardized JSON Output    |
         |  (Severity, Line, Issue, Fix)    |
         +-----------------+----------------+
                           |
            +--------------+--------------+
            |                             |
            v                             v
+-----------------------+     +-----------------------+
|  Terminal Rich Table  |     | Modern Dark-Theme Web |
|  & Markdown Summary   |     | Dashboard Interface   |
+-----------------------+     +-----------------------+
```

---

## 🚀 Quickstart Guide

### Prerequisites
1. [Node.js](https://nodejs.org/) (v18+)
2. [Ollama](https://ollama.com/) installed and running:
   ```bash
   ollama pull codellama:7b
   ```

### 1. Clone & Install
```bash
git clone [https://github.com/](https://github.com/)<your-username>/open-pr-reviewer.git
cd open-pr-reviewer
npm install
```

### 2. Start the Application
```bash
node server.js
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Review a Sample Diff
1. Click **Load Sample Diff** on the web dashboard.
2. Click **Review PR Offline**.
3. View the classified security findings, line references, and remediation code.

---

## 🧩 Agent Skills Specification (`skill.yaml`)

This tool complies with the [Agent Skills standard](https://agentskills.io/specification):

```yaml
version: "1.0.0"
name: "open-pr-reviewer"
description: "Offline, zero-API-key automated code review agent skill."
author: "Open PR Reviewer Team"
license: "MIT"
entrypoint: "server.js"

interface:
  inputs:
    diff:
      type: "string"
      description: "Unified git diff of pull request."
      required: true
  outputs:
    reviews:
      type: "array"
      items:
        type: "object"
        properties:
          file: { type: "string" }
          line: { type: "integer" }
          severity: { type: "string", enum: ["CRITICAL", "WARNING", "SUGGESTION", "STYLE"] }
          issue: { type: "string" }
          fix: { type: "string" }
```

---

## 🔒 Security & Privacy

Open PR Reviewer performs all inference entirely on `localhost`. At no stage is your code, diff text, or file structure sent across public networks or proprietary APIs.

---

## 📜 License

Distributed under the [MIT License](LICENSE).