# Diagram Quality Guide

## Good diagram checklist

A good diagram should satisfy:

- It answers a specific question.
- Its scope is explicit.
- Its source evidence is listed.
- Its abstraction level is consistent.
- Its relationships have correct direction.
- It avoids unnecessary implementation noise.
- It has a readable number of nodes.
- It can be rendered from source.
- It is stored in a stable path.
- It is linked from `docs/uml/index.md`.

## Anti-patterns

### Big ball of mud diagram

Symptom:
- one huge diagram with every class/service/table

Fix:
- split by bounded context
- add overview diagram
- link detailed child diagrams

### Unsupported relationship

Symptom:
- composition or inheritance used without evidence

Fix:
- downgrade to association/dependency
- add assumption comment if inferred

### Mixed abstraction levels

Symptom:
- a Kubernetes pod points to a private method

Fix:
- separate deployment diagram and sequence/class diagram

### Invented architecture

Symptom:
- unknown services/classes appear without evidence

Fix:
- remove invented nodes
- mark assumptions
- ask for or inspect more evidence

### Diagram as decoration

Symptom:
- diagram is pretty but does not answer a real engineering question

Fix:
- restate the question the diagram answers
