# universal-uml-diagrammer skill

This package contains a complete agent skill for generating standard UML diagrams and practical architecture diagrams from a software repository.

## Install

Copy the `universal-uml-diagrammer` directory into your repository-local skills folder:

```text
.agents/
  skills/
    universal-uml-diagrammer/
      SKILL.md
      references/
      scripts/
      templates/
      examples/
```

Add this to `AGENTS.md`:

```markdown
When asked to generate UML or architecture diagrams, use the `universal-uml-diagrammer` skill.

Rules:
- Prefer PlantUML for formal diagrams.
- Inspect source code/configuration before drawing.
- Keep every diagram scoped and evidence-backed.
- Do not invent classes, methods, services, tables, queues, events, or infrastructure.
- Store generated diagrams under `docs/uml/<diagram-type>/`.
- Update `docs/uml/index.md`.
- Run the UML lint/render scripts when possible.
```

## Supported diagrams

Standard UML:
- class
- object
- package
- component
- deployment
- composite structure
- profile
- use case
- activity
- state machine
- sequence
- communication
- interaction overview
- timing

Engineering extensions:
- ERD / database schema
- C4
- data flow diagram
- flowchart
- API dependency diagram
- event flow diagram
- DDD domain model
- DDD context map

## Validation

```bash
python .agents/skills/universal-uml-diagrammer/scripts/lint-puml.py docs/uml
python .agents/skills/universal-uml-diagrammer/scripts/check-readability.py docs/uml
bash .agents/skills/universal-uml-diagrammer/scripts/render-plantuml.sh .
```


## V2 readability upgrade

This version adds a stricter visual-quality mode for diagrams that must be used as documentation images.

New files:
- `references/readability-and-layout-guide.md`
- `templates/presentation-style.puml`
- `templates/frontend-component-overview-readable.puml`
- `scripts/check-readability.py`

Recommended validation:

```bash
python .agents/skills/universal-uml-diagrammer/scripts/lint-puml.py docs/uml
python .agents/skills/universal-uml-diagrammer/scripts/check-readability.py docs/uml
bash .agents/skills/universal-uml-diagrammer/scripts/render-plantuml.sh .
```
