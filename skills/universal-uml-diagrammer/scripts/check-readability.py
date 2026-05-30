#!/usr/bin/env python3
"""
Readability heuristic checker for PlantUML diagrams.

This is not a visual renderer. It flags common sources of clutter before or after render:
- too many connector labels
- long connector labels
- too many visible edges
- too many nodes
- missing shared presentation style
- likely "everything graph" diagrams

Usage:
  python scripts/check-readability.py docs/uml
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

EDGE_RE = re.compile(r"^\s*[\w\"<>{}\[\].:/ -]+\s+[-.=]+(?:left|right|up|down)?[-.=]*[ox*<>]?\s+[\w\"<>{}\[\].:/ -]+(?:\s*:\s*(.+))?$")
NODE_RE = re.compile(r"^\s*(class|interface|enum|entity|component|database|queue|cloud|node|actor|participant|rectangle|package|object|usecase|state)\b", re.I)

MAX_NODES = 22
MAX_EDGES = 30
MAX_EDGE_LABELS = 12
MAX_LABEL_CHARS = 34


def analyze(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8", errors="replace")
    warnings: list[str] = []

    nodes = 0
    edges = 0
    edge_labels = 0

    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("'"):
            continue

        if NODE_RE.search(stripped):
            nodes += 1

        if "--" in stripped or ".." in stripped or "->" in stripped or ".>" in stripped:
            match = EDGE_RE.search(stripped)
            if match:
                edges += 1
                label = (match.group(1) or "").strip()
                if label:
                    edge_labels += 1
                    if len(label.replace("\\n", " ")) > MAX_LABEL_CHARS:
                        warnings.append(f"long connector label ({len(label)} chars): {label[:80]}")

    lower = text.lower()

    if "presentation-style.puml" not in lower and "skinparam defaultfontsize" not in lower:
        warnings.append("missing presentation style preset or explicit large-font skinparams")

    if nodes > MAX_NODES:
        warnings.append(f"high node count: {nodes} > {MAX_NODES}; split overview/detail diagrams")

    if edges > MAX_EDGES:
        warnings.append(f"high edge count: {edges} > {MAX_EDGES}; summarize secondary dependencies")

    if edge_labels > MAX_EDGE_LABELS:
        warnings.append(f"too many connector labels: {edge_labels} > {MAX_EDGE_LABELS}; move details to notes/legend")

    if "linetype ortho" in lower and edge_labels > 6:
        warnings.append("ortho line style with many labels may produce label placement issues; inspect rendered output or use polyline")

    return warnings


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: check-readability.py <path>", file=sys.stderr)
        return 2

    root = Path(sys.argv[1])
    files = list(root.rglob("*.puml")) if root.is_dir() else [root]

    if not files:
        print(f"No .puml files found under {root}")
        return 0

    failed = False
    for file in sorted(files):
        warnings = analyze(file)
        if warnings:
            failed = True
            print(f"\n{file}")
            for warning in warnings:
                print(f"  - {warning}")

    if failed:
        print("\nReadability check produced warnings. Review and revise before using the diagram as a documentation image.")
        return 1

    print(f"Readability check passed for {len(files)} file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
