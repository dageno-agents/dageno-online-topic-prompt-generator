#!/usr/bin/env python3
"""Compatibility entry: V3 validation is implemented by the shared Node runtime."""
import subprocess
import sys
from pathlib import Path

if len(sys.argv) != 2:
    raise SystemExit("V3 usage: python3 scripts/prompt_qa.py panel.json; use the full V3 artifact")
raise SystemExit(subprocess.call(["node", str(Path(__file__).resolve().parents[1] / "runtime" / "cli.mjs"), "qa", sys.argv[1]]))
