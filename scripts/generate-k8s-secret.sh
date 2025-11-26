#!/bin/bash
# Generate Kubernetes secret from .env file

if [ ! -f .env ]; then
  echo "Error: .env file not found"
  exit 1
fi

cat > k8s/apps/finances/secret.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: finances-env
  namespace: default
type: Opaque
stringData:
  .env: |
$(cat .env | sed 's/^/    /')
EOF

echo "✅ Generated k8s/apps/finances/secret.yaml"
echo "⚠️  WARNING: This file contains sensitive credentials!"
echo "   Make sure it's in .gitignore"
