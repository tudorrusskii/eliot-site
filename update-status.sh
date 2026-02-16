#!/bin/bash
# Auto-update site status data and push to GitHub
# Run periodically via cron or manually

SITE_DIR="$HOME/.openclaw/workspace/projects/eliot-site"
DATA_DIR="$SITE_DIR/data"

mkdir -p "$DATA_DIR"

# Get system stats
TEMP=$(sensors 2>/dev/null | grep "Package id 0" | awk '{print $4}' | tr -d '+°C')
DISK=$(df -h / | awk '/nvme/ {print $5}')
MEM=$(free -h | awk '/Mem/ {printf "%s/%s", $3, $2}')
UPTIME=$(uptime -p)
NOW=$(date -Iseconds)

# Update status.json (keep existing actions, just update stats)
if [ -f "$DATA_DIR/status.json" ]; then
  python3 -c "
import json, sys
with open('$DATA_DIR/status.json') as f:
    data = json.load(f)
data['updated'] = '$NOW'
data['cpu_temp'] = '${TEMP:-unknown}'
data['disk_usage'] = '$DISK'
data['memory'] = '$MEM'
data['uptime'] = '$UPTIME'
data['last_heartbeat'] = '$NOW'
with open('$DATA_DIR/status.json', 'w') as f:
    json.dump(data, f, indent=2)
print('Status updated')
"
fi

# Git push
cd "$SITE_DIR"
git add -A
git diff --cached --quiet || {
  git commit -m "auto-update: $(date '+%Y-%m-%d %H:%M')"
  git push origin main 2>&1
  echo "Pushed to GitHub"
}
