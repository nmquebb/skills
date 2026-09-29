#!/bin/sh
# Builds one review case in the trial workspace: the shared baseline tagged `baseline`, then the
# case's change as a single candidate commit.
set -eu
cp -R "$SUITE_DIR/fixture/." .
git add -A
git commit -q --no-gpg-sign -m "Add money helpers"
git tag baseline
cp -R "$CASE_DIR/change/." .
git add -A
git commit -q --no-gpg-sign -F "$CASE_DIR/message.txt"
