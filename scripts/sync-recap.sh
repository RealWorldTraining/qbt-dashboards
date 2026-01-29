#!/bin/bash
# One command to refresh recap: triggers n8n, syncs data, commits to git

echo "🚀 Triggering n8n workflow..."
curl -s -X POST https://n8n.srv1266620.hstgr.cloud/webhook/recap-refresh > /dev/null

echo "⏳ Waiting for n8n to finish..."
sleep 5

echo "📥 Fetching fresh data from live server..."
curl -s "https://qbtraining.com/api/recap" | python3 -c "import sys,json; d=json.load(sys.stdin); d.pop('_source',None); print(json.dumps(d,indent=2))" > .recap-data/recap-data.json

MONTH=$(python3 -c "import json; print(json.load(open('.recap-data/recap-data.json'))['displayMonth'])")
echo "✅ Synced: $MONTH"

echo "📤 Committing and pushing to git..."
git add .recap-data/recap-data.json
git commit -m "Sync recap data: $MONTH"
git push

echo "🎉 Done! Recap updated and backed up to git."
