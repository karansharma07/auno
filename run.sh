#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PY="${PYTHON:-python3}"
if [ ! -d .venv ]; then "$PY" -m venv .venv; fi
source .venv/bin/activate
python -m pip install -r requirements.txt
printf '\nAUNO demo is starting at http://127.0.0.1:8000\n\n'
python -m uvicorn app:app --host 127.0.0.1 --port 8000
