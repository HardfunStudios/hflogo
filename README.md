# HardFun Logo

**HardFun Logo** is a visual, block-based programming environment for children, built on top of ideas first explored in the [Learnable Programming Visible Flow Prototype](https://github.com/HardfunStudios/lp-visible-flow-prototype) — a research project developed for the *CMP586 – Trends in Software Engineering* post-grad course at II-UFRGS, inspired by [Bret Victor's Learnable Programming essay](http://worrydream.com/LearnableProgramming/).

The original prototype investigated how to make execution flow *visible*: users build programs with Blockly blocks, execute them, and scrub through a time slider to replay each step on a Logo-style turtle graphics canvas. HardFun Logo takes those ideas and builds them into a full social platform — think Scratch, but for turtle graphics.

---

## What it is

A web platform where children and educators can:

- **Write programs** with a visual block editor (Blockly v11)
- **See execution happen** step by step on a turtle canvas, with a time slider to replay any moment
- **Save and publish** projects to share with the community
- **Explore** published projects, remix them, and learn from others' code

---

## Architecture

### Tech stack

- **Rails 8.1.3** · Ruby 3.3.11 · PostgreSQL 16
- **Blockly v11** — block editor, bundled via Vite as an IIFE
- **JS-Interpreter** — sandboxed JavaScript execution engine
- **Microworld** — two-canvas turtle graphics system (sprite layer + pen layer)
- **Stimulus** — bridges the Rails views with the editor bundle
- **Tailwind CSS v4** — HardFun design system tokens
- **Docker Compose** — development environment (app: 3002, db: 5434, redis: 6381)

### Execution pipeline

```
Blockly blocks
  → JavaScript source (Blockly.JavaScript.workspaceToCode)
    → JS-Interpreter (sandboxed)
      → *CT() global bridge functions (microworld_procedural_bindings.js)
        → Microworld canvas rendering
```

The key constraint: JS-Interpreter runs in an isolated environment separate from the browser. Objects cannot be passed between the two directly, so `microworld_procedural_bindings.js` exposes a flat set of global `*CT()` functions (e.g. `moveCT`, `turnCT`) that bridge interpreter calls to the `currentworld` Microworld instance.

### Time-visible mode

When "Mostra passos" is toggled on, after every turtle command `Microworld` pushes a snapshot of the canvas state onto `canvasStoryStack`. The time slider maps directly to this stack — scrubbing replays the frame at that index via `setPlayTime(frame)`.

### Editor bundle (`editor/`)

The editor source lives in `editor/js/` and is bundled by Vite into `app/assets/builds/logo-editor.js`. It exposes a `window.LogoEditor` API that the Rails `editor_controller.js` (Stimulus) uses to load/save project state and capture thumbnails.

```
editor/
  js/
    main.js                            — entry point, Blockly setup, LogoEditor API
    microworld.js                      — Microworld canvas class
    microworld_procedural_bindings.js  — *CT() bridge functions
    TurtleBlocks.js                    — turtle block definitions + code generators
    LPBlocks.js                        — pen/screen block definitions
    ui.js                              — run/step/slider wiring
  vite.config.js
```

### Key files (Rails app)

| File | Purpose |
|------|---------|
| `app/javascript/controllers/editor_controller.js` | Stimulus controller: autosave, versioning, thumbnail |
| `app/views/projects/edit.html.erb` | Scratch-like editor layout (Blockly left, canvas right) |
| `app/views/projects/show.html.erb` | Read-only viewer with scrollable/zoomable blocks + executable canvas |
| `app/views/projects/index.html.erb` | "Meus Projetos" card grid with thumbnails |
| `app/views/explore/index.html.erb` | Public project gallery |
| `app/views/layouts/editor.html.erb` | Full-screen editor layout (no page scroll) |
| `app/controllers/api/v1/projects_controller.rb` | PATCH autosave + POST thumbnail endpoints |
| `app/jobs/generate_thumbnail_job.rb` | Stores PNG data URI as project thumbnail |

---

## Running locally

```bash
docker compose up
```

The app runs at `http://localhost:3002`.

To rebuild the editor bundle after changes to `editor/js/`:

```bash
cd editor && npm install && npm run build
```

---

## Design system

HardFun uses a custom design system defined as Tailwind v4 `@theme` tokens:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-hf-blue` | `#0081A6` | Primary actions, links |
| `--color-hf-yellow` | `#FFAA00` | Highlights |
| `--color-hf-red` | `#D51414` | Destructive actions |
| `--color-hf-gray` | `#929292` | Secondary text, borders |

Typography: **Montserrat** (headings, UI) + **Roboto** (body).

---

## Origins

This project grew directly out of the *Learnable Programming Visible Flow Prototype*, which was a static, single-page research tool. The core execution engine (JS-Interpreter + Microworld) and the "time-visible" step replay idea are carried forward unchanged. What changed is everything around it: the block editor became Blockly v11, the interface became a full Rails social platform, and the focus shifted from research demo to a tool children can actually use together.
