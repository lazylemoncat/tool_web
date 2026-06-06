---
name: universal-uml-diagrammer
description: Generate code-grounded UML and architecture diagrams for software projects using PlantUML or Mermaid. Use this skill for any UML request, including class, object, package, component, deployment, composite structure, profile, use case, activity, state machine, sequence, communication, interaction overview, timing diagrams, plus practical engineering diagrams such as ERD, C4, DFD, flowchart, API dependency, event flow, and database schema diagrams.
---

# Universal UML Diagrammer Skill

## Purpose

This skill helps an agent generate software diagrams that are grounded in the actual repository.

It covers:

1. Standard UML diagrams
2. Practical engineering diagrams that are often requested as "UML" in real projects
3. Architecture-as-code outputs that can be reviewed, versioned, linted, and rendered

The preferred output format is PlantUML.

Use Mermaid only when:
- the user explicitly asks for Mermaid
- the diagram must render natively in Markdown
- PlantUML cannot be used in the target environment

## Core principle

Do not draw what the repository does not support.

## Mandatory visual-quality mode

When the requested output is a documentation image, architecture overview, README diagram, polished diagram, screenshot-ready figure, or any diagram meant to be read by humans outside raw PlantUML source, activate visual-quality mode.

In visual-quality mode, correctness is not enough. The rendered image must be readable.

Mandatory rules:
- Use the presentation style preset when possible:
  `!include .agents/skills/universal-uml-diagrammer/templates/presentation-style.puml`
- Prefer layered sections over free-form dense graphs.
- Use large fonts and high-contrast text.
- Use subtle background colors for major sections.
- Keep connector labels short.
- Move long relationship details into notes, legends, or child diagrams.
- Do not draw arrows through text.
- Do not allow labels to overlap arrows.
- Split diagrams that exceed readability limits.
- Render and inspect the output if possible.
- Run `scripts/check-readability.py` in addition to syntax linting.
- If the image is cluttered, revise the `.puml` source before finalizing.

For frontend component overview diagrams, use:
`templates/frontend-component-overview-readable.puml`

For detailed rules, read:
`references/readability-and-layout-guide.md`


Every diagram must be based on one or more of:
- source code
- tests
- configuration
- database schema or migrations
- infrastructure definitions
- API specs
- project documentation
- package manifests
- CI/CD files
- explicit user-provided facts

If something is inferred, mark it as an assumption.

## Required workflow

### Step 1: Classify the request

Identify the requested diagram type.

If the user says "UML" without specifying a diagram type, choose the best fit:

- Static code structure -> class diagram
- Runtime request or event flow -> sequence diagram
- Business process -> activity diagram
- State lifecycle -> state machine diagram
- Actors and system goals -> use case diagram
- Modules/packages -> package diagram
- Services and databases -> component diagram
- Runtime infrastructure -> deployment diagram
- Database tables -> ERD or database schema diagram
- System context/container architecture -> C4 diagram
- Data movement -> DFD
- Cross-service events -> event flow diagram

If multiple diagrams are necessary, generate an overview plus focused child diagrams.

### Step 2: Determine scope

Choose the smallest useful scope.

Good scopes:
- one bounded context
- one module/package
- one feature
- one API endpoint
- one user workflow
- one event flow
- one deployment environment
- one database schema group
- one subsystem integration

Avoid whole-repository mega diagrams unless the repository is small.

### Step 3: Inspect evidence

Read relevant files before drawing.

Prioritize:
- source code under `src/`, `app/`, `lib/`, `packages/`, `services/`
- tests that reveal expected behavior
- route/controller/handler definitions
- domain/entity/model/value object classes
- service/application layer code
- repository/DAO/gateway/adapters
- dependency injection and module wiring
- event producers/consumers
- API specs such as OpenAPI, GraphQL, protobuf, AsyncAPI
- database migrations and schema files
- Dockerfile, docker-compose, Helm, Kubernetes, Terraform, Pulumi
- README, ADRs, architecture docs
- package manifests and build files

### Step 4: Prepare a modeling summary

Before or alongside the diagram, include:

```markdown
## Modeling summary

- Diagram type:
- Scope:
- Included elements:
- Excluded elements:
- Evidence files:
- Assumptions:
- Known limitations:
```

### Step 5: Generate the diagram

Preferred output path:

```text
docs/uml/<diagram-type>/<scope>.puml
```

Examples:

```text
docs/uml/class/payment-domain.puml
docs/uml/sequence/checkout-payment.puml
docs/uml/activity/refund-workflow.puml
docs/uml/state/order-lifecycle.puml
docs/uml/component/backend-services.puml
docs/uml/deployment/prod-kubernetes.puml
docs/uml/erd/billing-schema.puml
docs/uml/c4/system-context.puml
```

Also update or create:

```text
docs/uml/index.md
```

### Step 6: Validate

If scripts are available, run:

```bash
python .agents/skills/universal-uml-diagrammer/scripts/lint-puml.py docs/uml
python .agents/skills/universal-uml-diagrammer/scripts/check-readability.py docs/uml
bash .agents/skills/universal-uml-diagrammer/scripts/render-plantuml.sh .
```

If PlantUML is unavailable, report the exact command the user can run.

### Step 7: Report

Final report should include:
- files generated
- diagram type and scope
- evidence files inspected
- assumptions
- validation result
- readability result
- rendered image inspection notes, if available
- suggested next diagrams, if helpful

## Supported standard UML diagrams

This skill supports all commonly recognized standard UML diagram categories.

### 1. Class diagram

Use for static type structure.

Shows:
- classes
- interfaces
- abstract classes
- enums
- fields
- methods
- inheritance
- realization
- composition
- aggregation
- association
- dependency

Best for:
- domain model
- service/repository relationships
- SDK/library APIs
- ports and adapters

### 2. Object diagram

Use for concrete runtime object snapshots.

Shows:
- object instances
- actual attribute values when known
- links between instances

Best for:
- example domain object graph
- debugging a specific scenario
- explaining a fixture/test case

Do not invent values. Use test fixtures, sample payloads, or explicit user-provided examples.

### 3. Package diagram

Use for source package/module dependencies.

Shows:
- packages
- modules
- libraries
- bounded contexts
- dependency direction

Best for:
- monorepo boundaries
- circular dependency analysis
- layer violations

### 4. Component diagram

Use for service/module architecture.

Shows:
- components
- services
- libraries
- databases
- queues
- external APIs
- provided/required interfaces when useful

Best for:
- backend architecture
- microservices
- internal modules
- integration maps

### 5. Deployment diagram

Use for runtime infrastructure.

Shows:
- nodes
- containers
- pods
- VMs
- serverless functions
- databases
- queues
- caches
- network boundaries
- external cloud/SaaS services

Best for:
- Docker/Kubernetes/cloud deployment
- production topology
- runtime dependencies

### 6. Composite structure diagram

Use for internal structure of one component/class/subsystem.

Shows:
- parts
- ports
- connectors
- internal collaborations

Best for:
- complex component internals
- hexagonal architecture
- adapter/port wiring
- one subsystem decomposition

PlantUML may require approximation using components, rectangles, ports, and connectors.

### 7. Profile diagram

Use for UML extensions/stereotypes.

Shows:
- stereotypes
- tagged values
- constraints
- metaclass extensions

Best for:
- documenting project-specific modeling conventions
- defining stereotypes such as `<<external>>`, `<<database>>`, `<<queue>>`, `<<bounded-context>>`

Most engineering projects do not need profile diagrams unless they maintain a modeling standard.

### 8. Use case diagram

Use for actors and system goals.

Shows:
- actors
- use cases
- system boundary
- include/extend relationships

Best for:
- product-facing capability overview
- permission/role capability map
- business requirement summary

Do not use for detailed control flow. Use activity or sequence diagrams instead.

### 9. Activity diagram

Use for business/process flow.

Shows:
- actions
- decisions
- forks/joins
- swimlanes/partitions
- start/end
- parallel behavior

Best for:
- workflows
- approval processes
- batch jobs
- business process logic
- algorithmic flow

### 10. State machine diagram

Use for lifecycle/state transitions.

Shows:
- states
- transitions
- events
- guards
- entry/exit actions
- terminal states

Best for:
- order status
- payment status
- ticket lifecycle
- job lifecycle
- retry/circuit breaker states

### 11. Sequence diagram

Use for ordered runtime interactions.

Shows:
- actors
- participants
- messages
- returns
- branches
- loops
- async calls
- external systems

Best for:
- API request flow
- event processing
- service-to-service interaction
- user workflow implementation

### 12. Communication diagram

Use for object/component collaboration topology.

Shows:
- participants
- links
- numbered messages

Best for:
- same information as sequence diagram, but emphasizing network of collaborators rather than time order

PlantUML support may be approximated with component/object diagrams plus numbered labels.

### 13. Interaction overview diagram

Use for high-level orchestration of interactions.

Shows:
- flow between interaction fragments
- references to sequence diagrams
- decision/fork nodes

Best for:
- large workflows with multiple sub-sequences
- overview of several use cases

PlantUML support may be approximated with activity diagrams that reference detailed sequence diagrams.

### 14. Timing diagram

Use for state/value changes over time.

Shows:
- lifelines
- states over time
- timing constraints
- events

Best for:
- protocols
- async systems
- retries/timeouts
- IoT/device behavior
- concurrent state changes

## Practical engineering extensions

These are not always strict UML, but are commonly needed in software architecture work.

### 15. ER diagram / database schema diagram

Use for relational data structure.

Shows:
- tables/entities
- columns
- keys
- relationships
- cardinality

Best for:
- database schema
- persistence model
- migration review
- table relationships

Preferred PlantUML style: `entity`.

### 16. C4 diagrams

Use for architecture views.

Supported levels:
- System Context
- Container
- Component
- Code-like class view when needed

Best for:
- stakeholder-friendly architecture
- service boundaries
- system landscape
- container/service responsibility

Use PlantUML C4 library if available; otherwise approximate with components and packages.

### 17. Data Flow Diagram

Use for data movement.

Shows:
- external entities
- processes
- data stores
- data flows

Best for:
- privacy/security reviews
- ETL pipelines
- analytics flows
- integrations

Approximate with PlantUML components, databases, queues, and directional arrows.

### 18. Flowchart

Use for simple procedural logic.

Shows:
- start/end
- actions
- decisions
- branches

Best for:
- simple algorithms
- onboarding docs
- operational runbooks

Prefer activity diagram when the flow is business/process-oriented.

### 19. API dependency diagram

Use for endpoint/service/API relationships.

Shows:
- routes
- handlers/controllers
- services
- clients
- external APIs
- auth dependencies

Best for:
- API review
- backend entrypoint map
- endpoint-to-service dependency tracking

### 20. Event flow diagram

Use for event-driven systems.

Shows:
- producers
- topics/queues
- consumers
- events
- databases
- side effects

Best for:
- Kafka/RabbitMQ/SNS/SQS/EventBridge systems
- saga choreography
- async workflows

### 21. Domain model diagram

Use for DDD domain concepts.

Shows:
- aggregate roots
- entities
- value objects
- domain services
- repositories
- domain events
- bounded contexts

This is usually a specialized class/component diagram.

### 22. Context map

Use for bounded context relationships.

Shows:
- bounded contexts
- upstream/downstream relationships
- shared kernel
- conformist
- anti-corruption layer
- published language
- customer/supplier

Approximate with component diagrams and stereotypes.

## Routing matrix

| User asks for | Generate |
|---|---|
| "类图", "class", "domain model", "entity relationship in code" | Class diagram |
| "对象实例", "sample object graph", "runtime snapshot" | Object diagram |
| "包依赖", "module dependency", "monorepo structure" | Package diagram |
| "组件", "服务依赖", "architecture overview" | Component diagram |
| "部署", "Docker", "Kubernetes", "runtime topology" | Deployment diagram |
| "内部结构", "ports/adapters", "component internals" | Composite structure diagram |
| "建模规范", "stereotype", "profile" | Profile diagram |
| "用户角色", "系统能力", "用例" | Use case diagram |
| "业务流程", "审批流程", "job flow" | Activity diagram |
| "状态流转", "lifecycle", "status" | State machine diagram |
| "调用链", "时序", "request flow" | Sequence diagram |
| "协作关系", "collaboration" | Communication diagram |
| "多个时序图总览", "orchestration overview" | Interaction overview diagram |
| "时间变化", "timeout", "protocol timing" | Timing diagram |
| "数据库关系", "表结构" | ERD / database schema diagram |
| "C4", "system context", "container diagram" | C4 diagram |
| "数据流", "ETL", "privacy data map" | DFD |
| "流程图" | Flowchart or activity diagram |
| "API 依赖" | API dependency diagram |
| "事件流", "Kafka", "RabbitMQ", "SQS" | Event flow diagram |
| "DDD context map" | Context map |

## Diagram quality rules

### Scope and size limits

Default maximums:
- class diagram: 25 nodes
- object diagram: 20 nodes
- package diagram: 30 nodes
- component diagram: 25 nodes
- deployment diagram: 25 nodes
- use case diagram: 25 use cases
- activity diagram: 40 actions
- state machine diagram: 30 states
- sequence diagram: 12 participants
- timing diagram: 8 lifelines
- ERD: 30 tables
- C4 diagram: 25 nodes
- DFD: 25 nodes
- event flow: 30 nodes

If a diagram exceeds the limit:
1. create a high-level overview
2. split details by bounded context, module, feature, or workflow
3. link all child diagrams from `docs/uml/index.md`

### Naming

Use names exactly as they appear in code/config when possible.

Do not invent:
- class names
- method names
- field names
- packages
- services
- tables
- routes
- queues
- event names
- external systems
- infrastructure nodes

If a display alias improves readability, keep the original name visible.

### Evidence comments

Each `.puml` file should include:

```plantuml
' Scope: ...
' Evidence:
' - path/to/file1
' - path/to/file2
' Assumptions:
' - ...
```

### Abstraction consistency

Do not mix unrelated levels:
- class diagram: no Kubernetes nodes
- deployment diagram: no private helper methods
- use case diagram: no repository implementation details
- ERD: no controller/service call chains
- sequence diagram: no exhaustive field list

### Relationship semantics

Use correct relationship symbols:

```plantuml
BaseClass <|-- SubClass
Interface <|.. Implementation
Whole *-- Part
Whole o-- Part
ClassA --> ClassB : association
ClassA ..> ClassB : dependency
Producer --> Queue : publishes
Queue --> Consumer : consumes
Service --> Database : reads/writes
```

## Output format requirements

PlantUML files must:
- start with `@startuml`
- include `title`
- include scope/evidence comments
- end with `@enduml`

Markdown index should include:
- diagram list
- purpose
- generated file path
- evidence summary
- render instructions

## When approximation is acceptable

Some UML diagrams have incomplete or awkward support in PlantUML/Mermaid.

When approximating:
- state what is approximated
- keep logic and relationships correct
- prefer understandable architecture diagrams over strict notation
- preserve source evidence

Examples:
- communication diagram can be approximated with object/component diagram plus numbered messages
- interaction overview can be approximated with activity diagram referencing sequence diagrams
- composite structure can be approximated using components, ports, and connectors
- C4 can be approximated using component diagrams when C4 library is not installed
