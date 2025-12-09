#!/bin/bash
cd /home/kavia/workspace/code-generation/strategic-growth-platform-221425-221435/saas_backend
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

