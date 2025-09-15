#!/bin/bash

# EC2 Initial Setup Script for Infiora Backend
# Run this once on your EC2 instance to prepare for deployments

set -e

echo "🚀 Setting up EC2 instance for Infiora Backend deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
echo "📋 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
echo "👤 Adding user to docker group..."
sudo usermod -aG docker $USER

# Install Git
echo "📚 Installing Git..."
sudo apt install -y git

# Clone repository
echo "📥 Cloning repository..."
cd /home/$USER
if [ ! -d "infiora-backend" ]; then
    git clone https://github.com/YOUR_USERNAME/infiora-backend.git
    cd infiora-backend
else
    cd infiora-backend
    git pull origin main
fi

# Create production environment file
echo "🔧 Creating production environment file..."
cat > .env.prod << EOF
DEBUG=False
SECRET_KEY=your-super-secret-production-key-change-this
DB_ENGINE=django.db.backends.postgresql
DB_NAME=infiora
DB_USER=infiora
DB_PASSWORD=your-secure-password-change-this
DB_PORT=5432
ALLOWED_HOSTS=your-domain.com,your-ec2-ip,localhost,127.0.0.1
EOF

echo "⚠️  IMPORTANT: Edit .env.prod file with your actual values!"
echo "   - Update SECRET_KEY with a secure random key"
echo "   - Update DB_PASSWORD with a secure password"
echo "   - Update ALLOWED_HOSTS with your domain/IP"

# Set up firewall
echo "🔥 Setting up firewall..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 8000/tcp  # Django app
sudo ufw allow 80/tcp    # HTTP (for future nginx setup)
sudo ufw allow 443/tcp   # HTTPS (for future nginx setup)
sudo ufw --force enable

echo "✅ EC2 setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env.prod file with your actual values"
echo "2. Set up GitHub secrets in your repository:"
echo "   - EC2_HOST: Your EC2 public IP or domain"
echo "   - EC2_USERNAME: Your EC2 username (usually ubuntu)"
echo "   - EC2_PRIVATE_KEY: Your EC2 private key content"
echo "3. Log out and log back in (for docker group changes)"
echo "4. Push to main branch to trigger deployment"
echo ""
echo "Your app will be available at: http://YOUR_EC2_IP:8000"