#!/bin/bash
set -e

echo "🔨 Building Docker image..."
docker build -t finances-categorizer:latest .

echo "📦 Saving image to tar..."
docker save finances-categorizer:latest -o /tmp/finances-categorizer.tar

echo "📤 Copying image to Sequoia..."
scp /tmp/finances-categorizer.tar em@192.168.1.2:/tmp/

echo "📥 Loading image on Sequoia..."
ssh -t em@192.168.1.2 "sudo k3s ctr images import /tmp/finances-categorizer.tar"

echo "🔐 Applying secret..."
cat k8s/apps/finances/secret.yaml | ssh -t em@192.168.1.2 "sudo k3s kubectl apply -f -"

echo "🚀 Deploying to k8s..."
cat k8s/apps/finances/deployment.yaml | ssh -t em@192.168.1.2 "sudo k3s kubectl apply -f -"
cat k8s/apps/finances/service.yaml | ssh -t em@192.168.1.2 "sudo k3s kubectl apply -f -"
cat k8s/ingress/finances-ingress.yaml | ssh -t em@192.168.1.2 "sudo k3s kubectl apply -f -"

echo "⏳ Waiting for deployment..."
ssh -t em@192.168.1.2 "sudo k3s kubectl rollout status deployment/finances"

echo ""
echo "✅ Deployment complete!"
echo "🌐 Access at: http://finances.grove"
echo ""
echo "Check status:"
echo "  ssh em@192.168.1.2 'sudo k3s kubectl get pods -l app=finances'"
echo "  ssh em@192.168.1.2 'sudo k3s kubectl logs -l app=finances'"
