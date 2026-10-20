# Quantum MLOps Studio

A Next.js prototype for composing quantum-oriented workspace blueprints from reusable blocks. The interface combines a component library, a selectable node canvas, editable block properties, JSON/QASM downloads, and a mock server-side workspace registry.

**Project status:** this is a UI and integration prototype, not a production quantum compiler or simulator. Persistence is in server memory, telemetry is illustrative, and QASM export is a stub. Status text such as "Compiler Core: Connected" does not indicate an actual hardware or simulator connection.

## Contents

- [Technology stack](#technology-stack)
- [Getting started](#getting-started)
- [Commands](#commands)
- [Functionality and usage](#functionality-and-usage)
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

There is no automated test suite or `test` script in the repository.

## Functionality and usage

### Workspace layout

- **Header:** application identity, the current URL-based user context, and the global qubit input.
- **Left pane:** native primitives and community artifacts.
- **Center pane:** action ribbon and a grid-backed, selectable card canvas.
- **Right pane:** properties for the selected node and an emulated telemetry panel.
- **Footer:** illustrative compiler/runtime status labels.

### Native primitives

Click an item in the native library to add a node:

| Primitive | Stored type | Configuration |
| --- | --- | --- |
| Custom QGate Block | `CustomGate` | Generic properties message; no gate editor |
| QNN Layer Mold | `QNN` | Editable layer depth, initially `4` |
| QRAM Matrix Array | `QRAM` | Address mode: `Direct`, `BinaryTree`, or `Superposition` |

Click a canvas card to select it and reveal its properties. Property changes update the workspace store and the card immediately. **Hide** clears the selection without removing the node.

All cards display the shared global qubit count, initially `8`. The header input declares a range of 1-33; the QNN layer input declares 1-64. These HTML attributes are not comprehensive validation: the qubit store enforces only a lower bound of 1, and the property handler does not enforce the advertised upper layer limit.

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
| Export QASM | Downloads stub QASM text as `<workspaceName>.qasm` |
| Publish | Prompts for a name and appends an artifact metadata entry to the mock community registry |

The library is fetched on mount and refreshed after publishing in the current page. Other open pages are not synchronized automatically.

### Example workflow

1. Open `/studio/demo` to reuse a predictable save/load key.
2. Add a QNN node and a QRAM node from the native library.
3. Select each card and edit its supported properties.
4. Change the global qubit count in the header.
5. Select **Save Local** to store the blueprint in the running server process.
6. Select **Export JSON** for a downloadable snapshot independent of the server's lifetime.
7. Select **New**, then **Load**, to restore the saved blueprint while the same server instance retains it.
8. Select **Publish** to add an artifact metadata entry to the community shelf.

Refreshing a studio page resets browser state; select **Load** explicitly to retrieve a saved workspace. Returning through `/` generates a new user key rather than reopening the previous key.

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
|   |       |-- NodePortWire.tsx      # Exports NodePortWrite properties panel
|   |       `-- WaveProfileMonitor.tsx
|   |-- hooks
|   |   |-- useQuantumLibrarySync.ts
|   |   `-- useWorkspaceActions.ts
|   |-- services
|   |   `-- quantumLayerStub.ts      # QASM export boundary
|   `-- store
|       |-- useGlobalQubitStore.ts
|       `-- useWorkspaceStore.ts
|-- next-env.d.ts                    # Next.js TypeScript declarations
|-- package.json
|-- package-lock.json
|-- postcss.config.js
|-- tailwind.config.js
|-- tsconfig.json
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
                 /api/studio fetch       Browser downloads
                         |               JSON / QASM stub
                         v
                Server-memory registry
```

- [useWorkspaceStore](./src/store/useWorkspaceStore.ts) owns `workspaceName`, `nodes`, and `edges`, and exposes setters, append actions, and reset.
- [useGlobalQubitStore](./src/store/useGlobalQubitStore.ts) owns the shared qubit count separately from node parameters.
- [useWorkspaceActions](./src/hooks/useWorkspaceActions.ts) implements reset, save/load requests, and browser downloads.
- [useQuantumLibrarySync](./src/hooks/useQuantumLibrarySync.ts) owns the fetched community list and the publish interaction.
- [CanvasViewport](./src/components/workspace/CanvasViewport.tsx) subscribes to both stores and renders cards in a flex layout.
- [NodePortWire.tsx](./src/components/workspace/NodePortWire.tsx) exports `NodePortWrite`, which updates selected-node parameters while preserving edges.
- [WaveProfileMonitor](./src/components/workspace/WaveProfileMonitor.tsx) derives a decorative SVG path from node count/order. Its state count and error/coherence labels are not simulation measurements.
- [quantumLayerStub](./src/services/quantumLayerStub.ts) accepts normalized node data and produces placeholder QASM text. It is the current boundary for future compiler integration.

[Button](./src/components/ui/button.tsx) is used by the ribbon. [Dialog](./src/components/ui/dialog.tsx) and [Slider](./src/components/ui/slider.tsx) are reusable components present in the repository but not wired into the current dashboard.

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

Node positions and edges are stored and exported, but the canvas does not currently use positions for layout or render edges.

### JSON download / save payload

```json
{
  "workspaceName": "untitled_pipeline",
  "globalQubits": 8,
  "nodes": [
    {
      "id": "qnn_example",
      "type": "QNN",
      "position": { "x": 120, "y": 160 },
      "parameters": { "layers": 4 }
    }
  ],
  "edges": []
}
```

The API load response uses `global_qubit_count` instead of `globalQubits`; the action hook translates that field back into the qubit store.

### QASM export

The exporter writes an `OPENQASM 3.0` header, a standard-gate include, legacy-style `qreg`/`creg` declarations, and per-node comments. QNN depth and QRAM mode appear as comments only. It does not emit executable gates, validate OpenQASM compatibility, or compile edges into operations.

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

- **No real quantum execution:** no simulator, quantum hardware SDK, model training, job queue, or numerical compiler is connected.
- **No durable persistence:** saved workspaces and published entries live only in server memory. Restarts, reloads of the server module, or separate server instances can lose or diverge data.
- **No browser persistence or automatic loading:** Zustand state is not stored in local storage, scoped into per-user browser stores, or automatically rehydrated from the API.
- **No authentication or authorization:** URL user IDs do not provide access control or isolation suitable for real users.
- **Limited canvas editing:** there is no drag-and-drop positioning, edge creation/rendering, individual node deletion, undo/redo, or zoom/pan.
- **Metadata-only publishing:** community entries are not reusable serialized subgraphs; non-QNN/QRAM cards currently use the generic custom-gate presentation.
- **Export-only files:** there is no JSON file import or QASM parser. The workspace name has store support but no rename control.
- **Illustrative telemetry:** curves, state-count labels, and coherence/error values do not reflect quantum computation.
- **Prototype validation and feedback:** workflows use native browser alerts, prompts, and confirmations; network error handling and payload validation are limited.
- **Desktop-oriented layout:** fixed-width sidebars are not a complete responsive/mobile design.

Do not rely on UI messages mentioning cloud storage, secure saving, or connected runtimes as guarantees of those capabilities.

## Validation and troubleshooting

### Manual smoke check

1. Run `npm run build` to check compilation and TypeScript validity.
2. Start `npm run dev` and open `/`.
3. Confirm the redirect to `/studio/<userId>`, dark styling, and community items.
4. Add native blocks, select them, and edit QNN/QRAM properties.
5. Change global qubits and confirm cards update.
6. Save, reset, then load using the same user URL.
7. Download JSON/QASM and inspect their contents.
8. Publish a named artifact and confirm it appears in the current page's community list.
9. Check browser console and server terminal output for errors.

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
- Replace [quantumLayerStub.ts](./src/services/quantumLayerStub.ts) with validated compilation behind the existing service boundary.
- Replace module-level API storage with a persistent backend, then add authentication, authorization, and request/response schemas.
- Add a graph interaction layer to consume stored positions and edges.
- Add unit tests for store actions and compilation, API tests for persistence contracts, and browser tests for workspace workflows.
- Before production use, implement reliable error reporting, numeric constraints, durable artifact storage, and accessibility/responsive behavior.
