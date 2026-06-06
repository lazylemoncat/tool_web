#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-.}"
OUT_DIR="${2:-${ROOT_DIR}/docs/uml/rendered}"

mkdir -p "${OUT_DIR}"

if ! command -v plantuml >/dev/null 2>&1; then
  echo "plantuml command not found."
  echo "Install PlantUML, or run with Docker:"
  echo "  docker run --rm -v \"$PWD:/workspace\" -w /workspace plantuml/plantuml -tpng docs/uml/**/*.puml"
  exit 127
fi

if [ ! -d "${ROOT_DIR}/docs/uml" ]; then
  echo "No docs/uml directory found."
  exit 0
fi

find "${ROOT_DIR}/docs/uml" -name "*.puml" -print0 | while IFS= read -r -d '' file; do
  echo "Rendering ${file}"
  plantuml -tpng -o "${OUT_DIR}" "${file}"
done

echo "Rendered diagrams to ${OUT_DIR}"
