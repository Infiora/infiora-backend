# EC2 Deployment Guide for Infiora Backend

This guide covers deploying the Infiora Django backend to an AWS EC2 instance using Docker and GitHub Actions for CI/CD.

## Table of Contents
- [Prerequisites](#prerequisites)
- [EC2 Setup](#ec2-setup)
- [GitHub Actions Setup](#github-actions-setup)
- [Manual Deployment](#manual-deployment)
- [SSL/HTTPS Setup](#sslhttps-setup-optional)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- AWS account with EC2 access
- GitHub repository with Actions enabled
- Domain name (optional but recommended)
- Basic knowledge of Linux commands

## EC2 Setup

### 1. Launch EC2 Instance

1. **Instance Type**: t3.medium or larger (recommended for production)
2. **AMI**: Ubuntu 22.04 LTS
3. **Storage**: At least 20GB
4. **Security Group**: Configure the following ports:
   - SSH (22) - Your IP only
   - HTTP (80) - 0.0.0.0/0
   - HTTPS (443) - 0.0.0.0/0
   - Custom (8000) - 0.0.0.0/0 (for direct access during setup)

### 2. Initial Server Setup

Connect to your EC2 instance:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

Update the system and install dependencies:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y

# Logout and login again for Docker group changes
exit
```

### 3. Create Project Directory

```bash
# SSH back into the instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Create directory for the application (GitHub Actions will clone here)
sudo mkdir -p /home/ubuntu/infiora-backend
sudo chown ubuntu:ubuntu /home/ubuntu/infiora-backend
cd /home/ubuntu/infiora-backend
```

**Note**: The repository will be automatically cloned and updated by GitHub Actions. No manual git setup is required on the server.

## GitHub Actions Setup

### 1. Repository Secrets

Add the following secrets to your GitHub repository (Settings � Secrets and variables � Actions):

```
EC2_HOST=your-ec2-public-ip-or-domain
EC2_USERNAME=ubuntu
EC2_PRIVATE_KEY=your-private-key-content
SECRET_KEY=your-django-secret-key-here
ALLOWED_HOSTS=your-domain.com,your-ec2-ip
```

**How to get your private key content:**
1. On your local machine, display the private key:
   ```bash
   cat your-key.pem
   ```
2. Copy the entire content including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`
3. Paste it as the value for `EC2_PRIVATE_KEY` secret

**How to generate a Django SECRET_KEY:**
```python
# Run this in Python to generate a secure secret key
import secrets
print(secrets.token_urlsafe(50))
```

### 2. GitHub Actions Workflow

The workflow is already configured in `.github/workflows/deploy-prod.yml`. Here's what it does:

**Automatic Deployment Process:**
1. **Triggers**: Deploys on every push to `main` branch (or manual trigger)
2. **Connects to EC2**: Uses SSH with your private key
3. **Clones/Updates Code**: Pulls latest changes from GitHub
4. **Environment Setup**: Creates production environment file from secrets
5. **Docker Deployment**: Builds and deploys containers
6. **Health Check**: Verifies deployment success

**Deployment Steps:**
- Stops existing containers
- Pulls latest code from GitHub
- Creates `.env.prod` with your secrets
- Builds and starts new containers
- Cleans up unused Docker resources
- Reports deployment status

## Environment Configuration

### 1. Production Environment Variables

The GitHub Actions workflow automatically creates `.env.prod` on your EC2 instance using the secrets. You can also create it manually:

```bash
# Create production environment file
cat > .env.prod << EOF
SECRET_KEY=your-super-secret-django-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,your-ec2-ip,localhost
DB_ENGINE=django.db.backends.postgresql
DB_NAME=infiora
DB_USER=infiora
DB_PASSWORD=infiora
DB_HOST=db
DB_PORT=5432
EOF
```

### 2. Production Docker Compose

Ensure you have `docker-compose.prod.yml` in your repository. If not, create it:

```yaml
version: "3.8"

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  web:
    build: .
    env_file:
      - .env.prod
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

## Manual Deployment (Optional)

**Note**: Manual deployment is only needed for testing or troubleshooting. GitHub Actions handles all deployments automatically.

For manual deployment if needed:

```bash
# Navigate to project directory
cd /home/ubuntu/infiora-backend

# Stop existing containers
docker-compose -f docker-compose.prod.yml down

# Build and start containers (code is already updated by GitHub Actions)
docker-compose -f docker-compose.prod.yml up --build -d

# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

**Triggering Deployment:**
- **Automatic**: Push code to `main` branch
- **Manual**: Go to GitHub → Actions → Deploy to EC2 → Run workflow

## SSL/HTTPS Setup (Optional)

### Using Nginx and Let's Encrypt

1. **Install Nginx**:
```bash
sudo apt install nginx -y
```

2. **Configure Nginx** (`/etc/nginx/sites-available/infiora`):
```bash
sudo tee /etc/nginx/sites-available/infiora << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /static/ {
        alias /home/ubuntu/infiora-backend/staticfiles/;
    }
}
EOF
```

3. **Enable site and get SSL**:
```bash
sudo ln -s /etc/nginx/sites-available/infiora /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Monitoring and Maintenance

### 1. Logs

View application logs:
```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs web

# Database logs
docker-compose -f docker-compose.prod.yml logs db

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f

# Check specific container logs
docker logs <container_name>
```

### 2. Database Operations

```bash
# Access database container
docker-compose -f docker-compose.prod.yml exec db psql -U infiora -d infiora

# Create backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U infiora infiora > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T db psql -U infiora -d infiora < backup_file.sql

# Run Django migrations
docker-compose -f docker-compose.prod.yml exec web python src/manage.py migrate

# Create superuser
docker-compose -f docker-compose.prod.yml exec web python src/manage.py createsuperuser
```

### 3. System Maintenance

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean Docker resources
docker system prune -f

# Remove unused images
docker image prune -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Check disk usage
df -h
du -sh ~/infiora-backend/
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   ```bash
   # Check if database container is running
   docker-compose -f docker-compose.prod.yml ps

   # Check database logs
   docker-compose -f docker-compose.prod.yml logs db

   # Test database connection
   docker-compose -f docker-compose.prod.yml exec db psql -U infiora -d infiora -c "SELECT 1;"
   ```

2. **Permission Denied**:
   ```bash
   # Ensure user is in docker group
   sudo usermod -aG docker ubuntu

   # Logout and login again
   exit
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Port Already in Use**:
   ```bash
   # Check what's using port 8000
   sudo netstat -tulpn | grep :8000
   sudo lsof -i :8000

   # Kill process if needed
   sudo kill -9 <process_id>
   ```

4. **GitHub Actions Deployment Fails**:
   - Verify SSH connection: `ssh -i your-key.pem ubuntu@your-ec2-ip`
   - Check repository secrets are correctly set
   - Ensure SSH key has proper permissions
   - Check GitHub Actions logs for specific errors

5. **Container Build Failures**:
   ```bash
   # Check build logs
   docker-compose -f docker-compose.prod.yml build --no-cache

   # Check Dockerfile and requirements.txt
   cat Dockerfile
   cat requirements.txt
   ```

### Debugging Commands

```bash
# Check container status
docker ps -a

# Check container logs
docker logs <container_id>

# Access container shell
docker exec -it <container_id> /bin/bash

# Check Django migrations
docker-compose -f docker-compose.prod.yml exec web python src/manage.py showmigrations

# Run Django shell
docker-compose -f docker-compose.prod.yml exec web python src/manage.py shell

# Check static files
docker-compose -f docker-compose.prod.yml exec web python src/manage.py collectstatic --dry-run

# Test database connectivity
docker-compose -f docker-compose.prod.yml exec web python src/manage.py dbshell
```

### Health Checks

```bash
# Check if application is responding
curl http://localhost:8000/

# Check database health
docker-compose -f docker-compose.prod.yml exec db pg_isready -U infiora

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
top
```

## Security Considerations

1. **Firewall Configuration**:
   ```bash
   # Enable UFW
   sudo ufw enable

   # Allow SSH (adjust port if needed)
   sudo ufw allow 22/tcp

   # Allow HTTP/HTTPS
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp

   # Allow app port (remove after setting up nginx)
   sudo ufw allow 8000/tcp

   # Check status
   sudo ufw status
   ```

2. **SSH Security**:
   ```bash
   # Disable password authentication
   sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
   sudo systemctl restart ssh
   ```

3. **Environment Variables**: Never commit sensitive data to repository
4. **Database**: Use strong passwords, restrict access
5. **Updates**: Keep system and Docker images updated regularly
6. **Monitoring**: Set up log monitoring and alerts

## Performance Optimization

1. **Database Performance**:
   ```bash
   # Tune PostgreSQL settings in docker-compose.prod.yml
   # Add under db service environment:
   # POSTGRES_INITDB_ARGS: "--encoding=UTF8 --lc-collate=C --lc-ctype=C"
   ```

2. **Application Performance**:
   - Use Gunicorn with multiple workers
   - Enable Django's cache framework
   - Optimize database queries
   - Use CDN for static files

3. **Server Monitoring**:
   ```bash
   # Install htop for better process monitoring
   sudo apt install htop -y

   # Monitor containers
   docker stats
   ```

---

For additional support or questions, please refer to the project documentation or create an issue in the repository.