#!/bin/bash
# Forward AskUserQuestion hook events to Electric Agent studio.
# Blocks until the user answers in the web UI.
BODY="$(cat)"
RESPONSE=$(curl -s -X POST "http://host.docker.internal:4400/api/sessions/930f2eab-5842-4442-9942-54631fd0f678/hook-event" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer d4311bd9d3a5cfee9aaed854d0e6b5595ee8a4d6af11869bb2c8fd4c46e8f921" \
  -d "${BODY}" \
  --max-time 360 \
  --connect-timeout 5 \
  2>/dev/null)
if echo "${RESPONSE}" | grep -q '"hookSpecificOutput"'; then
  echo "${RESPONSE}"
fi
exit 0