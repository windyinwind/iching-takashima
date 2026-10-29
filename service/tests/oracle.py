#!/usr/bin/env python3
"""Run zy.py for each argv in a JSON list on stdin; print one JSON result per case.

The Python CLI is the reference implementation: the TypeScript engine must produce the
same output for the same command line.
"""

import io
import json
import sys
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[2] / "skills/zhouyi-lookup/scripts"
sys.path.insert(0, str(SCRIPTS))
sys.dont_write_bytecode = True

import zy  # noqa: E402

results = []
for argv in json.load(sys.stdin):
    out, err = io.StringIO(), io.StringIO()
    sys.argv = ["zy.py", *argv]
    with redirect_stdout(out), redirect_stderr(err):
        try:
            code = zy.main()
        except SystemExit as e:
            code = e.code
    results.append({"code": code, "out": json.loads(out.getvalue()) if code == 0 else None,
                    "err": err.getvalue().strip() if code else None})
json.dump(results, sys.stdout, ensure_ascii=False)
