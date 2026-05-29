# UML Diagram Index

This directory contains generated architecture and UML diagrams.

## Conventions

- PlantUML source files are stored under `docs/uml/<diagram-type>/`.
- Each `.puml` file must include scope and evidence comments.
- Generated images, if any, should be stored under `docs/uml/rendered/`.
- Diagrams should be small enough to review in pull requests.

## Diagram list

| Diagram | Type | Scope | Source |
|---|---|---|---|
| _Add generated diagrams here_ |  |  |  |

## Render

```bash
python .agents/skills/universal-uml-diagrammer/scripts/lint-puml.py docs/uml
python .agents/skills/universal-uml-diagrammer/scripts/check-readability.py docs/uml
bash .agents/skills/universal-uml-diagrammer/scripts/render-plantuml.sh .
```
