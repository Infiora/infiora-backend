# Deployment Guide

This guide provides instructions for deploying the Infiora Backend application to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [GitHub Actions Deployment](#github-actions-deployment)
- [Manual Deployment](#manual-deployment)
- [Environment Variables](#environment-variables)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- **EC2 Instance**: Ubuntu/Amazon Linux server with Docker and Docker Compose installed
- **Domain/IP**: Public IP or domain name for your server
- **GitHub Repository**: Code pushed to GitHub with proper secrets configured
- **Database**: PostgreSQL (configured via Docker Compose)

### Server Requirements

- **OS**: Ubuntu 20.04+ or Amazon Linux 2
- **RAM**: Minimum 2GB, recommended 4GB+
- **Storage**: Minimum 20GB free space
- **Ports**: 22 (SSH), 8000 (Application), 5432 (Database - internal)

## Environment Setup

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Create application directory
mkdir -p /home/$USER/infiora-backend
```

### 2. SSH Key Setup

```bash
# Generate SSH key pair on your local machine
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy public key to server
ssh-copy-id user@your-server-ip

# Test connection
ssh user@your-server-ip
```

## GitHub Actions Deployment

### 1. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

#### Required Secrets:
- `EC2_HOST`: Your server's IP address or domain
- `EC2_USERNAME`: SSH username (usually `ubuntu` or `ec2-user`)
- `EC2_PRIVATE_KEY`: Private SSH key content

#### Optional Secrets:
- `SECRET_KEY`: Django secret key (auto-generated if not provided)
- `CSRF_TRUSTED_ORIGINS`: Trusted origins for CSRF (JSON array format)
- `EMAIL_HOST`: SMTP server hostname
- `EMAIL_PORT`: SMTP port (default: 587)
- `EMAIL_HOST_USER`: SMTP username
- `EMAIL_HOST_PASSWORD`: SMTP password
- `EMAIL_FROM`: From email address
- `AWS_ACCESS_KEY_ID`: AWS access key for S3
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for S3
- `AWS_STORAGE_BUCKET_NAME`: S3 bucket name
- `CLIENT_URL`: Frontend application URL

### 2. Trigger Deployment

Deployment automatically triggers when you push to the `main` branch:

```bash
git push origin main
```

The workflow will:
1. Run quality assurance checks (linting, testing)
2. Copy files to your EC2 server
3. Deploy using Docker Compose
4. Run health checks

## Manual Deployment

### 1. Clone Repository

```bash
cd /home/$USER
git clone https://github.com/your-username/infiora-backend.git
cd infiora-backend
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

### 3. Deploy Application

```bash
# Stop existing containers
docker-compose down

# Build and start services
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## Environment Variables

### Required Variables

```bash
# Django Settings
INFIORA_DEBUG=False
INFIORA_SECRET_KEY=your-secret-key
INFIORA_CSRF_TRUSTED_ORIGINS=[https://yourdomain.com,https://www.yourdomain.com]
```

### Optional Variables

```bash
# Email Configuration
INFIORA_EMAIL_HOST=smtp.gmail.com
INFIORA_EMAIL_PORT=587
INFIORA_EMAIL_HOST_USER=your-email@gmail.com
INFIORA_EMAIL_HOST_PASSWORD=your-app-password
INFIORA_EMAIL_FROM=your-email@gmail.com

# AWS S3 Configuration
INFIORA_AWS_ACCESS_KEY_ID=your-access-key
INFIORA_AWS_SECRET_ACCESS_KEY=your-secret-key
INFIORA_AWS_STORAGE_BUCKET_NAME=your-bucket-name

# Client Configuration
INFIORA_CLIENT_URL=https://your-frontend-domain.com
```

## Health Checks

### Application Health

```bash
# Check Django application
docker-compose exec app poetry run python -m core.manage check

# Check database connectivity
docker-compose exec app poetry run python -m core.manage check --database default

# Test HTTP endpoint
curl http://localhost:8000/
```

### Container Status

```bash
# View running containers
docker-compose ps

# View container logs
docker-compose logs app
docker-compose logs db

# Check resource usage
docker stats
```

## Database Management

### Running Migrations

```bash
# Run database migrations
docker-compose exec app poetry run python -m core.manage migrate

# Create superuser
docker-compose exec app poetry run python -m core.manage createsuperuser
```

### Database Backup

```bash
# Create backup
docker-compose exec db pg_dump -U postgres infiora > backup.sql

# Restore backup
docker-compose exec -T db psql -U postgres infiora < backup.sql
```

## SSL/HTTPS Configuration

### Using Nginx Reverse Proxy

1. Install Nginx on your server
2. Configure SSL certificates (Let's Encrypt recommended)
3. Set up reverse proxy to application port 8000

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### Common Issues

#### 1. Docker Permission Denied
```bash
# Add user to docker group and relogin
sudo usermod -aG docker $USER
newgrp docker
```

#### 2. Port Already in Use
```bash
# Find process using port 8000
sudo lsof -i :8000

# Kill process
sudo kill -9 <PID>
```

#### 3. Database Connection Issues
```bash
# Check database container
docker-compose logs db

# Verify database credentials in .env file
# Ensure database service is running
docker-compose ps db
```

#### 4. Application Won't Start
```bash
# Check application logs
docker-compose logs app

# Verify environment variables
docker-compose exec app env | grep INFIORA

# Run Django check
docker-compose exec app poetry run python -m core.manage check
```

### Log Locations

- **Application logs**: `docker-compose logs app`
- **Database logs**: `docker-compose logs db`
- **System logs**: `/var/log/syslog` or `journalctl -u docker`

### Monitoring

Consider setting up monitoring tools:
- **Application Performance**: New Relic, DataDog, or Sentry
- **Server Monitoring**: CloudWatch, Prometheus, or Grafana
- **Log Management**: ELK Stack or CloudWatch Logs

## Security Considerations

1. **Firewall**: Configure firewall to only allow necessary ports
2. **SSH**: Disable password authentication, use key-based authentication only
3. **Updates**: Keep system and Docker images updated
4. **Secrets**: Never commit secrets to version control
5. **Database**: Use strong passwords and limit database access
6. **SSL**: Always use HTTPS in production
7. **Backup**: Implement regular backup strategy

## Scaling

For high-traffic applications, consider:

1. **Load Balancer**: Use ALB or Nginx for load balancing
2. **Database**: Use managed database service (RDS)
3. **Container Orchestration**: Migrate to ECS, EKS, or Kubernetes
4. **CDN**: Use CloudFront for static assets
5. **Caching**: Implement Redis for session and cache storage

## Support

For deployment issues:
1. Check application logs: `docker-compose logs app`
2. Verify environment configuration
3. Ensure all required secrets are configured
4. Test database connectivity
5. Check server resources (CPU, memory, disk)

For additional help, refer to the main [README.md](../README.md) or create an issue in the GitHub repository.