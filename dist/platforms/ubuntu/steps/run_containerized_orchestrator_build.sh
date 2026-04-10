#!/usr/bin/env bash

set +e

builder_path="$1"
log_file="$2"
builder_dist_dir="$(dirname "$builder_path")"
ubuntu_platforms_dir="$builder_dist_dir/platforms/ubuntu"
default_build_script_dir="$builder_dist_dir/default-build-script"
project_build_dir="$GITHUB_WORKSPACE/$BUILD_PATH/build"
project_path="$GITHUB_WORKSPACE/$PROJECT_PATH"

mkdir -p "$project_build_dir"
cd "$project_path"
cp -r "$default_build_script_dir" "/UnityBuilderAction"
cp -r "$ubuntu_platforms_dir/entrypoint.sh" "/entrypoint.sh"
mkdir -p "/steps"
cp -r "$ubuntu_platforms_dir/steps/." "/steps"
chmod -R +x "/entrypoint.sh"
chmod -R +x "/steps"

/steps/run_build_with_timeout.sh "$builder_path" "$log_file"
build_exit_code=$?

if [ -f "$builder_path" ]; then
  node "$builder_path" -m remote-cli-post-build 2>&1 | tee -a "$log_file" || echo "Post-build command completed with warnings" | tee -a "$log_file"
else
  echo "Builder path not found, skipping post-build" | tee -a "$log_file"
fi

echo "Collected Logs" | tee -a "$log_file" /data/job-log.txt 2>/dev/null || echo "Collected Logs" | tee -a "$log_file"
echo "end of orchestrator job" | tee -a "$log_file"
echo "---${LOG_ID}" | tee -a "$log_file"

exit "$build_exit_code"