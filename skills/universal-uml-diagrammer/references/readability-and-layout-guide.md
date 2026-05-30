# Readability and Layout Guide

This guide is mandatory for diagrams intended for documentation, README files, design reviews, or screenshots.

## Goal

The generated diagram must be readable as an image, not merely syntactically valid PlantUML.

A diagram fails the quality bar if:
- text overlaps with other text
- arrows cross through labels or component names
- labels sit directly on top of connector lines
- the canvas is too cramped
- edge crossings make the dependency direction hard to follow
- many long relationship labels compete with component names
- the image is technically correct but unpleasant to read

## Presentation-quality workflow

Use this workflow whenever the user asks for a polished diagram, architecture overview, documentation figure, README diagram, or screenshot-ready image.

1. Build a logical model first.
2. Choose a layered layout.
3. Split dense graphs before rendering.
4. Apply the shared style preset.
5. Render to SVG and PNG.
6. Inspect the rendered image if possible.
7. If readability fails, revise the diagram source and render again.
8. Only report success after the rendered diagram is readable.

## Layered layout rule

For component and architecture diagrams, arrange nodes into explicit layers.

Typical frontend layers:

```text
App shell / routing
Pages and feature entrypoints
Shared frontend layer
API, primitives, styling
External libraries
```

Typical backend layers:

```text
Entrypoints
Application services
Domain model
Infrastructure adapters
External systems
```

Typical event systems:

```text
Producers
Topics / queues
Consumers
Data stores / side effects
External systems
```

Do not let the layout engine freely place a dense graph without grouping.

## Density limits for readable images

For a single overview diagram:

- maximum 4 major section containers
- maximum 6 boxes per section
- maximum 18 visible nodes
- maximum 24 visible connectors
- maximum 8 connector labels
- maximum 4 long cross-section connectors

If the model exceeds these limits, create:
1. one overview diagram
2. one or more focused detail diagrams

Recommended split for dense frontend diagrams:
- `frontend-overview.puml`
- `frontend-routing-and-shell.puml`
- `frontend-pages-to-shared-layer.puml`
- `frontend-ui-libraries.puml`

## Text readability rules

Use:
- large default font
- dark text
- light section backgrounds
- strong contrast
- consistent component dimensions
- wrapped labels
- short connector labels

Avoid:
- labels longer than 28 characters on connector lines
- multi-sentence edge labels
- tiny path strings inside already crowded boxes
- arrows passing behind text
- arrows terminating at the center of large boxes

When a label is long, move the detail into:
- a note
- a legend
- the evidence section
- a separate detail diagram

Bad:

```plantuml
A --> B : theme and preference data with dashboard widgets and module cards
```

Better:

```plantuml
A --> B : preference data
note on link
  theme, user preferences,
  dashboard widgets
end note
```

Or:

```plantuml
A --> B : preference data
' Details documented in Modeling summary.
```

## Connector routing rules

Prefer:
- top-to-bottom flow for layered diagrams
- left-to-right flow for pipelines
- short local arrows inside a section
- dashed arrows for optional, inferred, async, or indirect relationships
- fewer cross-container arrows

Avoid:
- long arrows spanning the entire canvas
- multiple parallel arrows with labels
- diagonal arrows through boxes
- bidirectional arrows unless the relationship is truly bidirectional
- one node with more than 6 visible outgoing arrows

Use directional arrows to influence placement:

```plantuml
A -down-> B
A -right-> B
A -left-> B
A -up-> B
```

Use hidden links to stabilize layout when necessary:

```plantuml
A -[hidden]right- B
B -[hidden]right- C
```

Use `together` blocks to keep closely related nodes near each other:

```plantuml
together {
  component "Todo Page" as TodoPage
  component "Todo Components" as TodoComponents
}
```

## Line style rule

Use `skinparam linetype polyline` as the default for dense labeled component diagrams.

Use `skinparam linetype ortho` only when:
- labels are short
- rendered output has been inspected
- labels are not displaced or overlapping

For diagrams with many connector labels, polyline is usually safer.

## Section container rules

Every major group should have:
- clear title
- subtle background color
- enough padding
- related nodes arranged in a row or column
- no arrows crossing the group title

Example groups:
- Frontend App
- Pages and Feature Components
- Shared Frontend Layer
- External UI Libraries

## Relationship simplification

If a diagram has many relationships, classify them:

1. primary flow relationships: draw with solid arrows
2. secondary dependencies: draw with dashed arrows
3. styling/config/runtime context: draw as notes or legend
4. low-value dependencies: omit from overview and move to detail diagram

Do not draw every import relationship in a documentation overview.

## Frontend component overview pattern

For frontend component overview diagrams, use this structure:

```text
[Frontend App]
  Umi Route Config
  AppLayout
  AppTopBar
  AuthPage
  Theme/i18n Runtime

[Pages and Feature Components]
  Finance Routes
  Todo Page
  Settings and Utility Pages
  Home Dashboard

[Shared Frontend Layer]
  Common Components
  Hooks
  API Client
  UI Primitives
  Feature Components
  Styles and Tokens

[External UI Libraries]
  Radix UI
  Recharts
  dnd-kit
```

Rules:
- The App shell should be on the left or top.
- Pages should be grouped as entrypoints.
- Shared layer should sit below pages.
- External UI libraries should sit at the bottom.
- Long page-to-shared relationships should be dashed and labeled briefly.
- Avoid drawing every page-to-component import edge; summarize repeated patterns.
- Use one legend for relationship types.

## Readability checklist

Before finalizing, answer these questions:

- Can the title be read at thumbnail size?
- Can every component name be read without zooming?
- Does any arrow cross a component name?
- Does any label overlap a connector?
- Are section boundaries clear?
- Are there fewer than 18 nodes in the overview?
- Are long details moved to notes or child diagrams?
- Is the diagram visually balanced?
- Does the diagram still preserve the correct architecture logic?

If any answer is no, revise the diagram before final response.
