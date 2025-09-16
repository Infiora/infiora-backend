# Django EC2 Deployment Guide

## Prerequisites
- AWS EC2 instance (Ubuntu 22.04)
- GitHub repository with Actions enabled
- Domain name (optional)

## 1. EC2 Setup

### Launch Instance
- **Type**: t3.medium or larger
- **AMI**: Ubuntu 22.04 LTS
- **Storage**: 20GB minimum
- **Security Group**: Ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 8000 (App)

### Install Dependencies
```bash
# Connect to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update and install Docker
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create project directory
sudo mkdir -p /home/ubuntu/infiora-backend
sudo chown ubuntu:ubuntu /home/ubuntu/infiora-backend

# Logout and login for Docker group
exit
```

## 2. GitHub Secrets

Add these secrets in **GitHub Repository → Settings → Secrets and variables → Actions**:

```
EC2_HOST=your-ec2-ip-or-domain
EC2_USERNAME=ubuntu
EC2_PRIVATE_KEY=your-private-key-content
SECRET_KEY=your-django-secret-key
ALLOWED_HOSTS=your-domain.com,your-ec2-ip
CSRF_TRUSTED_ORIGINS=https://your-domain.com,https://your-ec2-ip:8000
DB_PASSWORD=your-secure-database-password
```

**Optional:**
```
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_STORAGE_BUCKET_NAME=your-s3-bucket
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## 3. Deployment

### Automatic Deployment
Push to `main` branch - GitHub Actions will automatically deploy.

### Manual Deployment
Go to **GitHub → Actions → CD - Continuous Deployment → Run workflow**

## 4. Verify Deployment

```bash
# Check containers
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs

# Test endpoints
curl http://your-domain.com/health/
curl http://your-domain.com/metrics/
```

## 5. Install and Configure NGINX

Install NGINX and edit its configuration:

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/default
```

Add this to the server block:

```nginx
server_name yourdomain.com www.yourdomain.com;

location / {
    proxy_pass http://localhost:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

Validate and restart NGINX:

```bash
sudo nginx -t
sudo service nginx restart
```

Your app should now be accessible via your IP without specifying a port.

## 6. Domain Configuration

Configure your domain from your registrar.
Create the necessary DNS records.

## 7. Secure with SSL Using Let's Encrypt

Install and configure Let's Encrypt:

```bash
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get install python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
certbot renew --dry-run # Test the renewal process
```

Your Django application should now be accessible at https://yourdomain.com.

## 8. Monitoring

- **Health Check**: `GET /health/`
- **Metrics**: `GET /metrics/`
- **Admin Panel**: `GET /admin/`

## 9. Troubleshooting

### Common Issues
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs web

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Test health endpoint
curl -f http://localhost:8000/health/
```

### Secrets Issues
- Verify all GitHub secrets are set correctly
- Check SSH key has proper permissions
- Ensure SECRET_KEY is properly generated

### Database Issues
```bash
# Connect to database
docker-compose -f docker-compose.prod.yml exec db psql -U infiora -d infiora

# Run migrations
docker-compose -f docker-compose.prod.yml exec web python src/manage.py migrate
```

## 10. Features Included

- **Security**: Rate limiting, CORS, security headers
- **Monitoring**: Health checks, system metrics
- **Reliability**: Container health checks, auto-restart
- **Performance**: Database connection pooling, S3 storage