# Quantum MLOps Studio

A Next.js prototype for composing quantum circuits and workspace blueprints from reusable blocks. The interface combines a drag-and-drop canvas, editable gates, reusable modules, custom OpenQASM, QASM/Qiskit generation, browser state-vector simulation, and a mock workspace registry.

**Project status:** this is a prototype with a validated gate compiler and an ideal, noiseless JavaScript simulator limited to 16 qubits. It is not a hardware runtime or an arbitrary Python/OpenQASM interpreter. Persistence remains in server memory. The topology preview is decorative; actual probabilities appear only after compilation.

## Contents

- [Technology stack](#technology-stack)
- [Getting started](#getting-started)
- [Commands](#commands)
- [Functionality and usage](#functionality-and-usage)
- [Compilation and simulation](#compilation-and-simulation)
- [Repository structure](#repository-structure)
- [Application architecture](#application-architecture)
- [Data models](#data-models)
- [API reference](#api-reference)
- [Configuration](#configuration)
- [Current limitations](#current-limitations)
- [Validation and troubleshooting](#validation-and-troubleshooting)
- [Extending the prototype](#extending-the-prototype)

## Technology stack

| Technology | Role |
| --- | --- |
| Next.js 14 | App Router pages, development/build tooling, and API route handlers |
| React 18 | Interactive client-side workspace |
| TypeScript 5 | Component props, store contracts, and service interfaces |
| Zustand 4 | In-memory browser state for workspace data and global qubit count |
| Tailwind CSS 3 | Utility-based dark-theme styling |
| PostCSS and Autoprefixer | CSS processing and browser prefixes |

Dependency ranges are defined in [package.json](./package.json); resolved versions are recorded in [package-lock.json](./package-lock.json).

## Getting started

### Requirements

- Node.js and npm. Next.js 14 requires Node.js 18.17 or later; use a currently supported Node.js LTS release meeting that requirement.
- A modern browser. A desktop-sized viewport is recommended for the three-pane layout.

### Install and run

From the repository root:

```powershell
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Next.js may select another port if 3000 is occupied; check the terminal output.

Choose a port with `npm run dev -- --port 3100`, or set `$env:PORT = '3100'` in PowerShell before `npm run dev`. Substitute any available port. Run only one server/build per checkout: concurrent processes share `.next` and can leave JavaScript chunks out of sync.

The home page redirects in the browser to a generated URL such as `/studio/researcher_123456`. For a stable workspace key, navigate directly to a URL such as [http://localhost:3000/studio/demo](http://localhost:3000/studio/demo).

No environment variables, database, credentials, or external quantum services are required for the current implementation.

### Production build

Stop the development server before building in the same checkout so development and production commands do not compete over generated output.

```powershell
npm run build
npm run start
```

This starts a production Next.js server. It does **not** make the mock storage durable or turn the prototype into a production-ready service.

## Commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install dependencies using the committed lockfile |
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Compile and validate the production application |
| `npm run start` | Serve an existing production build |
| `npm run lint` | Invoke `next lint`; ESLint dependencies/configuration are not currently supplied, so initial setup may be required |
| `npx tsc --noEmit --incremental false` | Check TypeScript without generating an incremental cache file |
| `npm test` | Run compiler, transpiler, and simulator tests using Node's built-in test runner |

The tests use the existing TypeScript dependency to load service code; no additional test-runner dependency is required.

## Functionality and usage

### Workspace layout

- **Header:** application identity, the current URL-based user context, and the global qubit input.
- **Left pane:** gate palette, modules, custom code, selected block attributes, blueprint placeholders, and community artifacts.
- **Center pane:** action ribbon and a grid-backed, selectable card canvas.
- **Right pane:** usage guidance and a clearly labeled illustrative topology preview.
- **Footer:** available compiler targets and browser simulation limit.

### Native primitives

Click a gate/module to add a node, or drag it onto the canvas. Select it to edit its attributes in the left pane. Nodes can be moved; drag a bottom port to another node's top port to create an execution dependency.

The gate palette includes H, X, Y, Z, S, SDG, T, TDG, RX, RY, RZ, CX, CY, CZ, SWAP, CCX, MEASURE, and BARRIER. Rotation angles accept decimal radians or pi fractions. Multi-qubit gates expose ordered operands (controls first, target last; SWAP has two symmetric operands).

Bell-pair and three-qubit GHZ modules are ready to use. Custom modules and custom-code blocks expose editable OpenQASM source. **Save as reusable module** validates the selected source and adds a template to the left palette for this browser session. Each instance has its own source; editing it does not change earlier instances or the saved template. Templates use absolute global qubit indices, not local module registers.

The following legacy blueprints remain available under **Blueprint placeholders (not compilable)**:

| Primitive | Stored type | Configuration |
| --- | --- | --- |
| Undefined custom gate | `CustomGate` | No defined gate semantics; replace with a supported gate/module |
| QNN Layer Mold | `QNN` | Editable layer depth, initially `4` |
| QRAM Matrix Array | `QRAM` | Address mode: `Direct`, `BinaryTree`, or `Superposition` |

Click a canvas card to reveal its properties. Property changes update the workspace store and the card immediately. **Hide** clears selection. **Disconnect & Remove Block** removes the node and its wires.

All cards display the shared global qubit count, initially `8`. The compiler validates an integer count of 1-33, distinct gate operands within range, finite angles, and valid classical bits. Compilation does not silently repair invalid input. Legacy QNN/QRAM attributes describe blueprints only and do not define executable gates.

### Community library

The library initially contains:

- QTransformer Core, version `1.2.0`
- QLLM Attention Block, version `1.0.1`

Clicking a community item creates a placeholder node with a type derived from the first word of its name and a `versionRef` parameter. It does not restore a published subgraph or execute the named model.

### Action ribbon

| Action | Current behavior |
| --- | --- |
| New | Asks for confirmation, clears nodes and edges, resets the workspace name to `untitled_pipeline`, and resets global qubits to `8` |
| Load | Retrieves the current user key's workspace from the mock API and replaces browser workspace state |
| Save Local | Despite the label, posts the workspace to server memory; it does not write a local file or browser storage |
| Export JSON | Downloads the current workspace as `<workspaceName>.json` |
| Compile | Opens a language-selection card, generates OpenQASM 3 or Qiskit, and simulates the same circuit in JavaScript |
| Export QASM | Validates and compiles through the same compiler, then downloads `<workspaceName>.qasm` without simulation |
| Publish | Prompts for a name and appends an artifact metadata entry to the mock community registry |

The library is fetched on mount and refreshed after publishing in the current page. Other open pages are not synchronized automatically.

### Example workflow

1. Open `/studio/demo` to reuse a predictable save/load key.
2. Set global qubits to `2` and add a **Bell pair (2 qubits)** module.
3. Select its card and inspect/edit its OpenQASM source in the left pane.
4. Select **Compile**, choose OpenQASM 3 or Qiskit, then **Compile and simulate**. Expect `00` and `11` with probability 50% each.
5. Select **Save Local** to store the blueprint in the running server process.
6. Select **Export JSON** for a downloadable snapshot independent of the server's lifetime.
7. Select **New**, then **Load**, to restore the saved blueprint while the same server instance retains it.
8. Select **Publish** to add an artifact metadata entry to the community shelf.

Refreshing a studio page resets browser state; select **Load** explicitly to retrieve a saved workspace. Returning through `/` generates a new user key rather than reopening the previous key.

## Compilation and simulation

### Pipeline

```text
Workspace nodes + dependency wires + global qubit count
    -> stable topological ordering
    -> gate validation / module and custom-source expansion
    -> shared Circuit instruction representation
         |-> OpenQASM 3 emitter -> .qasm download
         |-> Qiskit emitter    -> .py download
         `-> simulator worker -> exact basis/measurement probabilities
```

Wires are **execution dependencies**, not qubit mappings. Gate attributes choose the quantum operands. Ready blocks use insertion order to break ties; an unwired circuit executes in insertion order regardless of visual position. Cycles, dangling wires, and duplicate node IDs cause explicit errors.

The compilation card displays generated code, a download action, simulation status, and up to 64 of the most probable outcomes, with the full nonzero-outcome count and total probability. Editing the circuit invalidates old results. Closing the card terminates its simulation worker.

### Supported custom OpenQASM subset

Source consists of semicolon-terminated statements using the global registers `q` and `c`. For example:

```qasm
h q[0];
cx q[0], q[1];
rz(pi/4) q[1];
barrier q;
c[0] = measure q[0];
c[1] = measure q[1];
```

- Supported gate names: `h`, `x`, `y`, `z`, `s`, `sdg`, `t`, `tdg`, `rx`, `ry`, `rz`, `cx`, `cy`, `cz`, `swap`, `ccx`, `barrier`.
- Angles accept finite decimal/scientific notation and signed pi fractions such as `-pi/2`; arbitrary expressions/functions are not supported.
- Measurement forms: `c[0] = measure q[0];`, `measure q[0] -> c[0];`, `c = measure q;`, or `measure q -> c;`.
- Optional OpenQASM `2.0`/`3.0` headers and `qelib1.inc`/`stdgates.inc` includes are recognized. Register declarations, if supplied, must match the global qubit count and use only `q`/`c`.
- Whole-register barriers and indexed barrier operand lists are supported. The QASM 3 emitter represents CY as `ctrl @ y`, also recognized by the parser.
- Line/block comments are accepted. Other includes, gate definitions, reset, conditions, loops, user variables, arbitrary Python, and unsupported statements are rejected.
- Measurement is terminal: no subsequent unitary operation is allowed. A qubit/classical bit may be measured at most once.
- Limits: 4,096 blocks/expanded operations and 100,000 source characters per custom-code/module block.

QNN, QRAM, undefined custom gates, and metadata-only community artifacts are not silently assigned artificial gate behavior. Replace them with supported gates or explicit modules before compiling.

### Execution semantics and limits

[jsQuantumSimulator.ts](./src/services/compiler/jsQuantumSimulator.ts) starts in the all-zero state and applies complex gate matrices using little-endian qubit indexing. Displayed bitstrings run highest index to lowest: `q[0]`/`c[0]` is the rightmost bit. It returns exact basis probabilities, or classical probabilities aggregated according to terminal measurement mappings (unmeasured classical bits remain zero).

This is an ideal simulation: no noise, shot sampling, hardware execution, reset, or conditional control. Qiskit Python is **not evaluated** in the browser, and emitted QASM is not re-parsed for execution; both outputs and simulation use the same validated instructions.

Up to **16 qubits** are simulated in a background worker. Circuits with **17-33 qubits** still generate downloadable code but show an explicit simulation-limit message without allocating a state vector. Reusable palette templates are browser-session-only; their placed node instances are included in normal workspace save/load and JSON export.

## Repository structure

```text
QMLOps-ui
|-- public
|   `-- favicon.ico
|-- src
|   |-- app
|   |   |-- api
|   |   |   `-- studio
|   |   |       `-- route.ts          # Mock workspace/community HTTP API
|   |   |-- studio
|   |   |   `-- [userId]
|   |   |       `-- page.tsx          # Client workspace composition
|   |   |-- globals.css              # Tailwind directives and custom effects
|   |   |-- layout.tsx               # Root HTML layout and metadata
|   |   `-- page.tsx                 # Random user-context redirect
|   |-- components
|   |   |-- libraries
|   |   |   |-- CommunityArtifacts.tsx
|   |   |   `-- NativePrimitives.tsx
|   |   |-- ui
|   |   |   |-- button.tsx
|   |   |   |-- dialog.tsx
|   |   |   |-- global-qubit-counter.tsx
|   |   |   `-- slider.tsx
|   |   `-- workspace
|   |       |-- CanvasViewport.tsx
|   |       |-- ControlRibbon.tsx
|   |       |-- CompileDialog.tsx     # Language choice, code, worker results
|   |       |-- NodePortWire.tsx      # Exports NodePortWrite properties panel
|   |       `-- WaveProfileMonitor.tsx
|   |-- hooks
|   |   |-- useQuantumLibrarySync.ts
|   |   `-- useWorkspaceActions.ts
|   |-- services
|   |   |-- compiler
|   |   |   |-- circuit.ts           # Gate catalog, types, validation, parser
|   |   |   |-- index.ts             # Graph ordering and compilation entry point
|   |   |   |-- jsQuantumSimulator.ts
|   |   |   |-- simulator.worker.ts  # Off-main-thread simulation
|   |   |   `-- transpilers
|   |   |       |-- qasmTranspiler.ts
|   |   |       `-- qiskitTranspiler.ts
|   |   |-- download.ts             # Shared browser download helper
|   |   `-- quantumLayerStub.ts      # Legacy stub; no longer used by exports
|   `-- store
|       |-- useGlobalQubitStore.ts
|       `-- useWorkspaceStore.ts
|-- next-env.d.ts                    # Next.js TypeScript declarations
|-- package.json
|-- package-lock.json
|-- postcss.config.js
|-- tailwind.config.js
|-- tsconfig.json
|-- tests
|   `-- compiler.test.cjs
`-- README.md
```

Generated/dependency directories such as `.next` and `node_modules` are omitted.

## Application architecture

### Routing and rendering

[The root layout](./src/app/layout.tsx) supplies metadata, global CSS, and the HTML/body wrapper. [The home page](./src/app/page.tsx) generates an ephemeral user identifier and uses `router.replace` to enter the studio.

[The studio page](./src/app/studio/%5BuserId%5D/page.tsx) is a client component. It reads the route parameter, composes the workspace panels, and holds the selected node ID in local React state. Its imported interactive components run within that client boundary.

[The API route](./src/app/api/studio/route.ts) executes on the Next.js server. Its module-scoped object and array are the only backend storage.

### State and data flow

```text
Library click / property edit / global qubit input
                         |
                         v
               Browser Zustand stores
                         |
              +----------+-----------+
              |                      |
              v                      v
      Canvas and telemetry      Action hooks
                                     |
                         +-----------+-----------+
                         |                       |
                         v                       v
                 /api/studio fetch       Downloads / compiler
                         |               JSON / QASM / Qiskit
                         v
                Server-memory registry
```

- [useWorkspaceStore](./src/store/useWorkspaceStore.ts) owns `workspaceName`, `nodes`, `edges`, and session-only reusable module templates, and exposes setters, append actions, positioning, deletion, and reset.
- [useGlobalQubitStore](./src/store/useGlobalQubitStore.ts) owns the shared qubit count separately from node parameters.
- [useWorkspaceActions](./src/hooks/useWorkspaceActions.ts) implements reset, save/load requests, and browser downloads.
- [useQuantumLibrarySync](./src/hooks/useQuantumLibrarySync.ts) owns the fetched community list and the publish interaction.
- [CanvasViewport](./src/components/workspace/CanvasViewport.tsx) subscribes to both stores and supports positioned cards, palette drops, movement, and dependency wiring.
- [NodePortWire.tsx](./src/components/workspace/NodePortWire.tsx) exports `NodePortWrite`, which updates selected-node parameters while preserving edges.
- [WaveProfileMonitor](./src/components/workspace/WaveProfileMonitor.tsx) derives a clearly labeled decorative SVG path from node count/order; it is not simulation output.
- [CompileDialog](./src/components/workspace/CompileDialog.tsx) owns the chosen output language, generated-code snapshot, errors, worker lifecycle, and simulation results.
- [compiler/index.ts](./src/services/compiler/index.ts) validates the graph and expands blocks into a shared circuit, then calls a language emitter.
- [jsQuantumSimulator](./src/services/compiler/jsQuantumSimulator.ts) computes state-vector and terminal-measurement probabilities from that circuit.
- [quantumLayerStub](./src/services/quantumLayerStub.ts) remains as an unused legacy stub; export/compile workflows no longer call it.

[Button](./src/components/ui/button.tsx) is used by the ribbon and compilation card. [Dialog](./src/components/ui/dialog.tsx) provides the compilation modal, Escape handling, and focus containment/restoration. [Slider](./src/components/ui/slider.tsx) remains available but unused by the dashboard.

## Data models

The core interfaces are defined in [useWorkspaceStore.ts](./src/store/useWorkspaceStore.ts):

```typescript
interface NodeData {
  id: string;
  type: string;
  position: { x: number; y: number };
  parameters: Record<string, any>;
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
}
```

Node positions control canvas layout. Edges are rendered and become compiler ordering dependencies. A `Gate` node stores `gate`, `qubits`, optional `angle`, and measurement `bit` in `parameters`. Module/code nodes store OpenQASM `source` and an optional display `name`.

### JSON download / save payload

```json
{
  "workspaceName": "untitled_pipeline",
  "globalQubits": 8,
  "nodes": [
    {
      "id": "h_example",
      "type": "Gate",
      "position": { "x": 120, "y": 160 },
      "parameters": { "gate": "h", "qubits": [0] }
    }
  ],
  "edges": []
}
```

The API load response uses `global_qubit_count` instead of `globalQubits`; the action hook translates that field back into the qubit store.

### QASM export

The exporter uses the validated compiler, emits `OPENQASM 3.0`, `stdgates.inc`, modern `qubit[n]`/`bit[n]` registers, executable gate operations, and explicit measurement mappings. The compilation card also offers Qiskit Python using `QuantumCircuit` and corresponding gate calls. Both operate on the same ordered circuit; see [Compilation and simulation](#compilation-and-simulation).

## API reference

All endpoints use `/api/studio` and return JSON. The `userId` is a caller-controlled lookup key, **not** an authenticated identity.

### GET operations

| Request | Response |
| --- | --- |
| `GET /api/studio?action=load&userId=demo` | Saved workspace with `nodes`, `edges`, `global_qubit_count`, and `workspaceName` |
| `GET /api/studio?action=fetch-community` | `{ "community": [{ "id": "...", "name": "...", "version": "...", "icon": "..." }] }` |

Loading an unknown or missing user key returns HTTP 200 with an empty workspace, 8 qubits, and the name `untitled_pipeline`. An unsupported GET action returns HTTP 400 with an `error` string.

### POST save

Send `Content-Type: application/json` with:

```json
{
  "action": "save",
  "userId": "demo",
  "payload": {
    "workspaceName": "untitled_pipeline",
    "globalQubits": 8,
    "nodes": [],
    "edges": []
  }
}
```

This overwrites the workspace stored for that user key and returns HTTP 200 with a `message` string.

### POST publish

```json
{
  "action": "publish",
  "userId": "demo",
  "payload": {
    "name": "My Quantum Block",
    "nodes": [],
    "edges": []
  }
}
```

Returns HTTP 200 with a `message` and an `artifact` containing a generated ID, name, version `1.0.0`, and icon. Although the client sends nodes and edges, the server stores **only artifact metadata**, not the graph. An omitted or empty name falls back to `Custom Sculpture Block`.

POST requests with no `userId` or an unsupported action return HTTP 400. Exceptions, including malformed JSON or missing payloads that trigger property-access errors, return HTTP 500 with an `error` string. Request bodies are not comprehensively schema-validated.

## Configuration

- [tsconfig.json](./tsconfig.json): Next.js TypeScript integration, non-strict checking, and the `@/*` alias mapped to `src/*`. Existing source imports primarily use relative paths.
- [tailwind.config.js](./tailwind.config.js): scans application/component files for utility classes and uses the default theme without extra plugins.
- [postcss.config.js](./postcss.config.js): runs Tailwind CSS 3 and Autoprefixer.
- [globals.css](./src/app/globals.css): Tailwind 3 directives, dark background, grid pattern, fade-in animation, and slider thumb styles.

Keep the Tailwind version, CSS directives, and PostCSS plugin configuration aligned. Upgrading to Tailwind 4 requires a deliberate configuration migration rather than just changing the dependency version.

## Current limitations

- **No hardware/Python execution:** only the supported ideal JavaScript simulator runs locally; no hardware SDK, Python backend, model training, or job queue is connected.
- **No durable persistence:** saved workspaces and published entries live only in server memory. Restarts, reloads of the server module, or separate server instances can lose or diverge data.
- **No browser persistence or automatic loading:** Zustand state is not stored in local storage, scoped into per-user browser stores, or automatically rehydrated from the API.
- **No authentication or authorization:** URL user IDs do not provide access control or isolation suitable for real users.
- **Limited canvas editing:** positioning, wiring, and deletion are supported; undo/redo, edge deletion controls, and zoom/pan are not implemented.
- **Metadata-only community publishing:** server registry entries are not reusable serialized subgraphs. Local reusable modules use explicit supported OpenQASM and are separate from this registry.
- **Restricted code input:** no JSON file import or arbitrary OpenQASM/Python execution. The workspace name has store support but no rename control.
- **Illustrative topology preview:** the decorative curve is distinct from real compile-card simulation results.
- **Prototype validation and feedback:** workflows use native browser alerts, prompts, and confirmations; network error handling and payload validation are limited.
- **Desktop-oriented layout:** fixed-width sidebars are not a complete responsive/mobile design.

Do not rely on legacy save/publish messages mentioning cloud storage or secure saving as guarantees of those capabilities.

## Validation and troubleshooting

### Manual smoke check

1. Run `npm run build` to check compilation and TypeScript validity.
2. Start `npm run dev` and open `/`.
3. Confirm the redirect to `/studio/<userId>`, dark styling, and community items.
4. Add supported gates/modules, select them, and edit their attributes in the left pane.
5. Change global qubits and confirm cards update.
6. Save, reset, then load using the same user URL.
7. Compile a two-qubit Bell pair in both languages: verify 50% `00` and 50% `11`, then inspect downloaded JSON/QASM/Python.
8. Publish a named artifact and confirm it appears in the current page's community list.
9. Check browser console and server terminal output for errors.
10. Verify invalid operands, cyclic wires, undefined blocks, and unsupported custom source show explicit errors; verify a 17-qubit circuit generates code but skips simulation.

Run `npm test` for service regression tests covering all supported gate outputs, complex amplitudes, entanglement, measurement mapping, graph ordering/errors, module expansion, parser rejection, and the exact 16/17-qubit simulation boundary.

### Module import errors

Ensure the import path matches the on-disk filename and its casing, particularly on case-sensitive deployment systems. The properties panel is exported as `NodePortWrite`, but its filename is [NodePortWire.tsx](./src/components/workspace/NodePortWire.tsx); these names are intentionally documented as they currently exist.

For an `@/` import, confirm the `@/*` mapping in [tsconfig.json](./tsconfig.json) and restart the dev server after configuration changes.

### Missing styles or stale compilation

Confirm the PostCSS filename is exactly `postcss.config.js` and that Tailwind 3 is installed. If stale webpack output persists after fixing configuration, stop the development server, then run:

```powershell
Remove-Item -LiteralPath '.next\cache\webpack' -Recurse -Force
npm run dev
```

Only run the removal if that generated cache directory exists. Do not clear it while the server is running.

### Saved workspace appears empty

Use the same `/studio/<userId>` URL and select **Load**. The root redirect generates a different key on each visit. A restarted or different server instance may not retain the prior in-memory save.

## Extending the prototype

- Add new block definitions in the native/community libraries and their property controls in the properties panel.
- Extend the gate catalog, both language emitters, parser, simulator, and tests together when adding operations.
- Replace module-level API storage with a persistent backend, then add authentication, authorization, and request/response schemas.
- Add undo/redo, edge management, and zoom/pan to the graph interaction layer.
- Expand test coverage to store actions, API persistence contracts, and automated browser workflows.
- Before production use, implement reliable error reporting, numeric constraints, durable artifact storage, and accessibility/responsive behavior.
