# Study runtime boundary

The study path engine remains unchanged. `Study.flow` and
`Profile/Guest.studiesInfo.path` continue to control branching, retakes,
resume behavior, and progression. A flow node identifies a Task; only the
resolved Task selects its runtime.

```mermaid
flowchart LR
  Flow["Study.flow"] --> Path["Existing path manager"]
  Path --> Task["Resolved Task"]
  Task --> Dispatch["Runtime dispatcher"]
  Dispatch --> Lab["Lab.js compatibility adapter"]
  Dispatch --> P5["P5 lifecycle shell"]
  Dispatch --> JsPsych["jsPsych iframe bridge shell"]
  Lab --> Contract["Neutral run contract"]
  P5 --> Contract
  JsPsych --> Contract
  Contract --> Results["Dataset and SummaryResult"]
```

P5 and jsPsych currently mount non-executing shells. Only Lab.js
(`isSavingData`) calls `startRun` and persists a Dataset.

## Layers

Reusable code lives on runtime assets. A Task binds one asset, plus semantic
type, parameters, and settings. Study flow still only places that Task.

```mermaid
flowchart TB
  subgraph assets["Reusable runtime assets"]
    template["Template<br/>Lab.js code, script, version"]
    visual["Visual<br/>P5 code"]
    jsPsychExperiment["JsPsychExperiment<br/>archive, manifest, entryPoint"]
  end

  subgraph configuration["Execution configuration"]
    task["Task<br/>taskType, runtimeType,<br/>parameters, settings"]
  end

  subgraph orchestration["Unchanged orchestration"]
    flow["Study.flow placement"]
    manager["Study path manager<br/>studiesInfo.path"]
  end

  subgraph execution["Pluggable execution"]
    dispatcher["TaskRun dispatcher"]
    labjs["Lab.js adapter"]
    p5Shell["P5 shell"]
    jsPsychShell["jsPsych iframe shell"]
  end

  subgraph persistence["Result store"]
    contract["startRun / ingestRunMessage"]
    dataset["Dataset"]
    summary["SummaryResult"]
  end

  template --> task
  visual --> task
  jsPsychExperiment --> task
  task --> flow
  flow --> manager
  manager --> dispatcher
  dispatcher --> labjs
  dispatcher --> p5Shell
  dispatcher --> jsPsychShell
  labjs --> contract
  p5Shell -.-> contract
  jsPsychShell -.-> contract
  contract --> dataset
  contract --> summary
```

Dashed persistence edges are the intended contract. They are not wired for
production P5 or jsPsych execution yet.

## Study flow graph

Flow-node shape is unchanged. Runtime metadata is not stored on the node.

```mermaid
flowchart LR
  A["my-anchor<br/>registration"] --> B["my-node<br/>Task A"]
  B --> D{"design<br/>between-subjects"}
  D -->|"condition L1"| C1["my-node Task B"]
  D -->|"condition L2"| C2["my-node Task C"]
  C1 --> E["…"]
  C2 --> E
```

Each `my-node` carries `componentID` (Task id) and `testId`. The dispatcher
loads that Task and reads `runtimeType` plus the matching asset relationship.

## Ownership

`Task.taskType` remains semantic (`TASK`, `SURVEY`, or `BLOCK`).
`Task.runtimeType` selects `LABJS`, `P5`, or `JSPSYCH`.

- LABJS uses `Task.template`.
- P5 uses `Task.visual`.
- JSPSYCH uses `Task.jsPsychExperiment`.

Exactly one matching relationship is required. Runtime assets own reusable
code/package metadata, publication/privacy, parameter definitions,
documentation, version, and asset authorship. Tasks own concrete parameter
values, runtime settings, aggregate-variable configuration, and Task
authorship. Dataset and SummaryResult associations for both authors are
looked up on the server.

```mermaid
flowchart LR
  codeAsset["Reusable runtime asset"] --> task["Task configuration"]
  task --> placement["Study.flow placement"]
  placement --> run["Runtime execution"]

  template["Template<br/>Lab.js code"] --> task
  visual["Visual<br/>P5 code"] --> task
  jsPsychAsset["JsPsychExperiment<br/>jsPsych package"] --> task
```

```mermaid
erDiagram
  PROFILE ||--o{ TASK : authors
  PROFILE ||--o{ TEMPLATE : authors
  PROFILE ||--o{ VISUAL : authors
  PROFILE ||--o{ JS_PSYCH_EXPERIMENT : authors
  TASK }o--o| TEMPLATE : labjs_asset
  TASK }o--o| VISUAL : p5_asset
  TASK }o--o| JS_PSYCH_EXPERIMENT : jspsych_asset
  TASK ||--o{ DATASET : produces
  STUDY ||--o{ DATASET : collects
  PROFILE ||--o{ DATASET : participant
  GUEST ||--o{ DATASET : participant
  DATASET ||--o| SUMMARY_RESULT : links
  PROFILE ||--o{ DATASET : taskAuthor
  PROFILE ||--o{ DATASET : assetAuthor
```

`JsPsychExperiment` stores a versioned archive, manifest, and entry point.
The first runtime only establishes a same-origin iframe handshake; it does not
extract or execute the archive.

## Participate sequence

Join still writes `studiesInfo.path`. The Manager still advances that path.
The leaf executor is now `TaskRun`, which issues a server run before Lab.js
mounts.

```mermaid
sequenceDiagram
  participant U as Participant
  participant RS as Study run
  participant M as Path manager
  participant TR as TaskRun dispatcher
  participant API as Run service
  participant LJ as Lab.js adapter
  participant Save as /api/save adapter

  U->>RS: /participate/run
  RS->>RS: If no path: getNextStep(flow)
  Note over RS: Skip anchor, resolve design branches,<br/>stop at first my-node
  RS->>M: studiesInfo.path
  M->>TR: Current task step
  TR->>API: startRun(Task, Study, guestPublicId?)
  Note over API: Guest public id wins over a signed-in session
  API-->>TR: Signed run token and Dataset token
  TR->>LJ: Mount Lab.js with run token
  LJ->>Save: Transmit incremental / full
  Save->>API: FINAL sequence 1
  LJ->>API: COMPLETE sequence 2
  LJ->>M: onFinish
  M->>M: findNextSteps / mark finished / maybe end
  M->>API: UPDATE studiesInfo.path
```

## Lifecycle and persistence

`startRun` validates study membership and Task configuration, derives the
participant, study, test/study versions, runtime asset, and both authors, then
creates a Dataset and returns a signed, expiring run token.

If `guestPublicId` is provided, the run is always a GUEST participant, even
when a researcher session cookie is present.

Messages use the following runtime-neutral operations:

1. `BATCH` appends incremental rows.
2. `FINAL` stores final rows and the runtime-computed aggregate.
3. `COMPLETE` marks the Dataset complete. It is rejected until a `FINAL`
   exists.
4. `FAILURE` records a runtime failure.

Every message carries a strictly increasing sequence. Repeated sequence
numbers receive an idempotent acknowledgement; gaps are rejected.

```mermaid
sequenceDiagram
  participant Client as Runtime adapter
  participant API as Run service
  participant Store as Result store
  Client->>API: startRun(Task, Study)
  API->>Store: Create Dataset from server-derived context
  API-->>Client: Signed run token
  Client->>API: FINAL sequence 1
  API->>Store: Store rows and aggregate
  API-->>Client: Acknowledgement
  Client->>API: COMPLETE sequence 2
  API->>Store: Mark Dataset complete
  API-->>Client: Acknowledgement
```

### Lab.js compatibility adapter

The Lab.js Transmit plugin still posts to `/api/save`. That route now acts as
the compatibility adapter: it requires the run token, writes filesystem JSON
under the server Dataset token, preserves row-embedded `aggregated` behavior,
then translates `payload === "full"` to `FINAL`. `COMPLETE` is sent by the
Lab.js runner after Transmit, not by `/api/save`. Collection joins continue to
use the existing Dataset and SummaryResult relationships.

```mermaid
flowchart TB
  Script["Template script"]
  Convert["convert(script)"]
  Params["Inject Task.parameters"]
  FromObj["lab.util.fromObject → run()"]
  Tx["lab.plugins.Transmit"]

  Script --> Convert --> Params --> FromObj --> Tx

  Start["startRun"] --> Token["Signed run token"]
  Token --> FromObj
  Token --> Tx

  Tx -->|"incremental"| Files["Filesystem JSON"]
  Tx -->|"full"| Save["/api/save adapter"]
  Save --> Files
  Save -->|"FINAL sequence 1"| Ingest["ingestRunMessage"]
  FromObj -->|"on end"| Complete["COMPLETE sequence 2"]
  Complete --> Ingest
  Ingest --> DS["Dataset"]
  Ingest --> SR["SummaryResult<br/>from row.aggregated"]
```

```mermaid
flowchart LR
  labjs["Lab.js Transmit"] --> legacyAdapter["/api/save adapter"]
  jsPsych["jsPsych frame bridge"] -.-> runtimeContract["Runtime-neutral contract"]
  p5["P5 shell"] -.-> runtimeContract
  legacyAdapter --> runtimeContract
  runtimeContract --> ingestService["ingestRunMessage"]
  ingestService --> rawStore["Raw data storage"]
  ingestService --> dataset["Dataset"]
  ingestService --> summary["SummaryResult"]
```

The server stores the aggregate the runtime supplies. It does not compute
experiment summaries from raw trials. `Task.settings.aggregateVariables` is
catalog/UI metadata only.

## Collection and Data Tool

Completed Datasets appear in Test & Collect. Data Journal study datasources
load `SummaryResult` rows whose matching Dataset is marked `isIncluded`.
If none are included, the Data Tool shows an empty-state message instead of
an empty grid.

```mermaid
flowchart LR
  Run["Completed Dataset"] --> Collect["Test & Collect"]
  Collect -->|"researcher includes"| Included["Dataset.isIncluded"]
  Included --> Journal["Data Tool study datasource"]
  Journal --> Grid["Participant-by-row grid"]
  Collect -.->|"nothing included"| Empty["Empty-state message"]
```

## Security boundary

Clients never choose participant, author, asset, or result associations.
Dataset and SummaryResult direct creation is closed; run mutations use the
verified token and server-derived context. Result reads and updates are
limited to the participant, Task/asset authors, study author/collaborators,
and administrators. Guest token possession supports the existing anonymous
completion and data-policy flow.

```mermaid
flowchart TB
  Client["Participant client"] --> Start["startRun"]
  Start --> Claims["Server-derived claims"]
  Claims --> Token["HMAC run token"]
  Token --> Ingest["ingestRunMessage / /api/save"]
  Ingest --> ACL["Dataset and SummaryResult ACL"]
  ACL --> Reader["participant, task author,<br/>asset author, study author,<br/>collaborators, admin"]
```

## Deferred

Production P5 and jsPsych execution, archive extraction/building, Four-in-a-
Row migration, Firebase replacement, runtime authoring banks, GitHub import,
a separate runtime origin, broader raw-download hardening, and mixed-runtime
execution tests remain out of scope.
