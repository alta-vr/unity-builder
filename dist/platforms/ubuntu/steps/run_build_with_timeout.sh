#!/usr/bin/env bash

set +e

builder_path="$1"
log_file="$2"
timeout_minutes="${ORCHESTRATOR_TIMEOUT_MINUTES:-0}"

{
  echo "game ci start"
  echo "CACHE_KEY=$CACHE_KEY"
  echo "$CACHE_KEY"

  if [ -n "$LOCKED_WORKSPACE" ]; then
    echo "Retained Workspace: true"
  fi

  if [ -n "$LOCKED_WORKSPACE" ] && [ -d "$GITHUB_WORKSPACE/.git" ]; then
    echo "Retained Workspace Already Exists!"
  fi

  if [ "$timeout_minutes" -gt 0 ]; then
    timeout "${timeout_minutes}m" /entrypoint.sh
  else
    /entrypoint.sh
  fi

  build_exit_code=$?
  if [ "$build_exit_code" -eq 124 ]; then
    echo "Orchestrator timeout reached after $timeout_minutes minute(s). Continuing with post-build cache and hooks."
  fi

  exit "$build_exit_code"
} | node "$builder_path" -m remote-cli-log-stream --logFile "$log_file"

exit "${PIPESTATUS[0]}"