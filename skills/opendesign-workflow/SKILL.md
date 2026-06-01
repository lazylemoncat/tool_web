---
name: opendesign-workflow
description: Use this skill whenever the user asks to open, restart, debug, preview, or generate pages in Open Design, especially for local Open Design projects, Open Design daemon/web ports, generated artifacts, spawn EPERM, SyntaxError from opening source files, or using Open Design to create an editable prototype instead of previewing an existing app.
---

# Open Design Workflow

Use this skill to operate Open Design as a local design/prototype workspace while keeping the target application repository separate.

## Core Workflow

1. Confirm the target repository and branch before searching or changing project code.
2. Start Open Design from its own repository, not from the target app repository.
3. After starting Open Design, return to the target app repository before code search or edits.
4. Prefer generating an Open Design artifact from a clear feature brief when source files cannot be previewed directly.
5. Keep generated Open Design prototype files separate from the product repository unless the user explicitly asks to port the design back.

## Starting Open Design

Use the Open Design repo as the working directory. If a normal instance is enough, use the default ports:

```powershell
tools-dev run web --daemon-port 17456 --web-port 17573
```

Expected URLs:

```text
Web:    http://127.0.0.1:17573/
Daemon: http://127.0.0.1:17456/
```

If the user reports `spawn failed: spawn EPERM`, restart Open Design from an elevated PowerShell window. If the default namespace is already running, use a separate namespace and ports:

```powershell
tools-dev run web --namespace admin --daemon-port 17457 --web-port 17574
```

Expected admin URLs:

```text
Web:    http://127.0.0.1:17574/
Daemon: http://127.0.0.1:17457/
```

Check daemon health before creating projects:

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:17457/api/health'
Invoke-RestMethod -Uri 'http://127.0.0.1:17457/api/agents'
```

## Choosing Preview Strategy

When the user wants to preview and edit UI in Open Design, choose the strategy based on what Open Design is asked to open:

- Existing app route: use only when the app route is already running and Open Design can iframe or link to it cleanly.
- Source file such as `.tsx`: avoid direct preview. Open Design may eval the file as standalone JavaScript and fail with `SyntaxError: Unexpected token 'export'`.
- Editable prototype: give Open Design a product brief and ask it to generate `index.html`, `styles.css`, and `app.js` or a single complete `index.html`.

For generated prototypes, tell the agent not to ask discovery questions when the user already gave enough context:

```text
Do not output discovery/question-form. Do not ask clarifying questions.
Directly generate an editable responsive prototype with realistic sample data.
Write the artifact files into the Open Design project.
```

## Creating A Project Through The Daemon API

Use this shape when automating project creation. The `id` field is required.

```powershell
$base = 'http://127.0.0.1:17457'
$projectId = [guid]::NewGuid().ToString()
$prompt = '...feature brief...'

$projectBody = @{
  id = $projectId
  name = '记账模块页面设计'
  skillId = $null
  designSystemId = $null
  pendingPrompt = $prompt
  metadata = @{
    kind = 'prototype'
    platform = 'responsive'
    platformTargets = @('responsive', 'web-desktop')
    nameSource = 'user'
    skipDiscoveryBrief = $true
  }
  skipDiscoveryBrief = $true
} | ConvertTo-Json -Depth 12

$projectResp = Invoke-RestMethod -Uri "$base/api/projects" -Method Post -ContentType 'application/json; charset=utf-8' -Body $projectBody
```

If the response has no `conversationId`, create one with:

```powershell
$convBody = @{ title = '页面设计' } | ConvertTo-Json
$convResp = Invoke-RestMethod -Uri "$base/api/projects/$projectId/conversations" -Method Post -ContentType 'application/json; charset=utf-8' -Body $convBody
```

## Writing Or Repairing Generated Files

Read files through raw URLs:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri "$base/api/projects/$projectId/raw/index.html"
```

Write text files through `/api/projects/:id/files`:

```powershell
$body = @{
  name = 'index.html'
  content = $html
  artifactManifest = @{
    version = 1
    kind = 'html'
    title = 'index.html'
    entry = 'index.html'
    renderer = 'html'
    status = 'complete'
    exports = @('html', 'pdf', 'zip')
  }
} | ConvertTo-Json -Depth 20

Invoke-RestMethod -Uri "$base/api/projects/$projectId/files" -Method Post -ContentType 'application/json; charset=utf-8' -Body $body
```

If `artifact=true` fails with `FILE_EXISTS`, retry without `artifact=true` while preserving `artifactManifest`.

When an artifact depends on external `styles.css` or `app.js`, prefer raw absolute project paths in `index.html`:

```html
<link rel="stylesheet" href="/api/projects/PROJECT_ID/raw/styles.css" />
<script src="/api/projects/PROJECT_ID/raw/app.js"></script>
```

## Common Failure Modes

`SyntaxError: Unexpected token 'export'`

The user probably opened a React/TypeScript source file as if it were a standalone artifact. Do not keep trying to preview that file directly. Generate an editable prototype or open the running app route instead.

`spawn failed: spawn EPERM`

Open Design failed to spawn its agent process. Restart Open Design from an elevated PowerShell window. If the default namespace is occupied, use `--namespace admin` and alternate ports.

Dashboard or page area is empty

Check whether the generated page relies entirely on JavaScript to populate an empty container. Add static fallback markup for the first screen, and make script paths use `/api/projects/<id>/raw/<file>`. Also check date filters; sample data from a fixed month should not depend on the machine's current date.

## Clean Handoff

After Open Design work:

1. Give the user the Open Design web URL.
2. State which daemon namespace/ports are active.
3. Clarify whether the target app repo was modified.
4. If app code was modified, run `git diff` and update related project docs according to the repository rules.
