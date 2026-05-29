# Diagram Catalog

This catalog defines what each diagram type is for, what evidence to inspect, and what not to include.

## Standard UML

### Class diagram

Purpose:
- static type structure

Inspect:
- classes
- interfaces
- enums
- DTOs
- services
- repositories
- dependency injection
- inheritance/implementation declarations

Avoid:
- runtime infrastructure
- every utility/helper class
- private implementation details not relevant to the scope

### Object diagram

Purpose:
- runtime snapshot of concrete instances

Inspect:
- tests
- fixtures
- sample payloads
- seed data
- debug examples

Avoid:
- invented attribute values
- broad system architecture

### Package diagram

Purpose:
- source/module dependencies

Inspect:
- import statements
- package manifests
- module configs
- build files
- monorepo workspace config

Avoid:
- individual method calls
- runtime infrastructure unless package boundaries map to services

### Component diagram

Purpose:
- service/module architecture

Inspect:
- service definitions
- module wiring
- deployment configs
- API clients
- queues
- databases
- external integrations

Avoid:
- fields and private methods
- database columns unless central to the component relationship

### Deployment diagram

Purpose:
- runtime topology

Inspect:
- Dockerfile
- docker-compose
- Kubernetes
- Helm
- Terraform
- Pulumi
- CI/CD deployment config
- cloud docs

Avoid:
- source-level class relationships
- business process details

### Composite structure diagram

Purpose:
- internals of one class/component/subsystem

Inspect:
- ports/adapters
- internal collaborators
- dependency injection
- module providers
- component wiring

Avoid:
- whole-system architecture

### Profile diagram

Purpose:
- modeling extensions and stereotypes

Inspect:
- architecture standards
- existing diagram conventions
- documentation rules

Avoid:
- using profile diagrams when no modeling standard exists

### Use case diagram

Purpose:
- actor-goal view

Inspect:
- product docs
- route permissions
- RBAC definitions
- user roles
- feature flags
- API capabilities

Avoid:
- internal implementation steps

### Activity diagram

Purpose:
- business/process flow

Inspect:
- workflow code
- service methods
- state changes
- job handlers
- approval logic
- tests

Avoid:
- service dependency maps

### State machine diagram

Purpose:
- lifecycle and transitions

Inspect:
- status enums
- transition methods
- guards
- validation logic
- tests
- event handlers

Avoid:
- unrelated service calls
- data schema details

### Sequence diagram

Purpose:
- ordered runtime interaction

Inspect:
- controllers
- handlers
- service calls
- repositories
- clients
- events
- tests

Avoid:
- every private helper
- unrelated branches

### Communication diagram

Purpose:
- collaboration topology with numbered messages

Inspect:
- same as sequence diagram

Avoid:
- excessive time-order detail; use sequence diagram if time is central

### Interaction overview diagram

Purpose:
- overview of multiple interactions

Inspect:
- workflows
- orchestration code
- sagas
- multiple sequence diagrams

Avoid:
- low-level method calls

### Timing diagram

Purpose:
- state/value over time

Inspect:
- timeout logic
- retry logic
- protocol handlers
- state transitions
- scheduled jobs
- event timestamps in tests

Avoid:
- general architecture

## Engineering extensions

### ERD / Database schema diagram

Purpose:
- table/entity relationships

Inspect:
- migrations
- schema files
- ORM models
- database docs

Avoid:
- application service call chains

### C4 diagram

Purpose:
- architecture communication across levels

Inspect:
- docs
- services
- deployables
- containers
- modules
- dependencies

Avoid:
- strict UML semantics where C4 vocabulary is clearer

### DFD

Purpose:
- data movement and trust boundaries

Inspect:
- APIs
- ETL jobs
- events
- storage
- external entities
- security/privacy docs

Avoid:
- class-level implementation details

### Flowchart

Purpose:
- simple process or algorithm

Inspect:
- code paths
- scripts
- runbooks

Avoid:
- using it where a UML activity diagram is more precise

### API dependency diagram

Purpose:
- endpoint to handler/service/client map

Inspect:
- routes
- controllers
- middleware
- service calls
- OpenAPI specs
- auth config

Avoid:
- database column-level modeling unless needed

### Event flow diagram

Purpose:
- asynchronous communication

Inspect:
- producers
- consumers
- topics
- queues
- event schemas
- saga/process managers

Avoid:
- pretending async behavior is sync sequence

### DDD context map

Purpose:
- bounded context relationships

Inspect:
- domain modules
- service boundaries
- integration adapters
- anti-corruption layers
- shared models

Avoid:
- low-level class internals
