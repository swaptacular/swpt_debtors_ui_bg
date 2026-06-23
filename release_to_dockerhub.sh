#!/bin/sh
set -e

./check_service_worker.sh "$@"

swpt_debtors_ui_bg="epandurski/swpt_debtors_ui_bg:$1"
docker build -t "$swpt_debtors_ui_bg" --target app-image .
git tag "v$1"
git push origin "v$1"
docker login
docker push "$swpt_debtors_ui_bg"
