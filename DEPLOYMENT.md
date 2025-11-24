# Ubuntu Server Deployment Guide

This guide will help you deploy the Error Logger App to an Ubuntu server.

## Prerequisites

- Ubuntu 20.04 LTS or later
- Root or sudo access
- Domain name (optional, for production)
- Basic knowledge of Linux commands

## Step 1: Update System

```bash
sudo apt update
sudo apt upgrade -y
```

## Step 2: Install Node.js

Your app requires Node.js 18.17.0 or higher. Install using NodeSource:

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v20.x.x or higher
npm --version    # Should be v9.x.x or higher
```

## Step 3: Install Additional Dependencies

```bash
# Install build tools (required for native modules)
sudo apt install -y build-essential

# Install SQLite (if not already installed)
sudo apt install -y sqlite3
```

## Step 4: Clone and Setup Application

```bash
# Navigate to your preferred directory
cd /var/www  # or /opt, or /home/your-user

# Clone your repository (replace with your repo URL)
git clone <your-repo-url> error-logger-app
cd error-logger-app

# Install dependencies
npm install
```

## Step 5: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add the following configuration:

```env
# Database
DATABASE_URL="file:./prisma/production.db"

# Authentication (generate a secure secret)
AUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# Application URL (replace with your domain or IP)
NEXTAUTH_URL="http://your-domain.com"
# Or if using IP:
# NEXTAUTH_URL="http://your-server-ip:3000"

# Optional: Default user credentials (for seeding)
DEFAULT_USER_EMAIL="admin@example.com"
DEFAULT_USER_PASSWORD="admin123"
```

**Generate AUTH_SECRET:**

```bash
openssl rand -base64 32
```

## Step 6: Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with default user (optional)
npm run db:seed
```

## Step 7: Build for Production

```bash
# Build the Next.js application
npm run build
```

## Step 8: Install PM2 (Process Manager)

PM2 keeps your application running and restarts it if it crashes:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application with PM2
pm2 start npm --name "error-logger" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions it provides (usually involves running a sudo command)
```

**PM2 Useful Commands:**

```bash
pm2 list              # View running processes
pm2 logs error-logger # View logs
pm2 restart error-logger # Restart app
pm2 stop error-logger    # Stop app
pm2 delete error-logger  # Remove from PM2
```

## Step 9: Configure Nginx (Reverse Proxy)

Install and configure Nginx to serve your app:

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/error-logger
```

Add the following configuration (replace `your-domain.com` with your domain or IP):

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/error-logger /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

## Step 10: Configure Firewall

```bash
# Allow HTTP and HTTPS traffic
sudo ufw allow 'Nginx Full'
# Or if you only want HTTP:
# sudo ufw allow 'Nginx HTTP'

# If you need SSH access (usually already enabled)
sudo ufw allow OpenSSH

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 11: SSL Certificate (Optional but Recommended)

For production, use Let's Encrypt for free SSL:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Certbot will automatically configure Nginx and set up auto-renewal
```

After SSL setup, update your `.env` file:

```env
NEXTAUTH_URL="https://your-domain.com"
```

Then restart the app:

```bash
pm2 restart error-logger
```

## Step 12: Update Nginx Config for HTTPS (if using SSL)

If you set up SSL, Certbot should have updated your config. If not, update it manually:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Considerations

### SQLite (Current Setup)

- ✅ Simple, no additional setup needed
- ✅ Good for small to medium deployments
- ⚠️ Not ideal for high-traffic or concurrent write scenarios
- ⚠️ Backup the database file regularly

**Backup SQLite:**

```bash
# Create backup script
nano /var/www/error-logger-app/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/www/error-logger-app/backups"
mkdir -p $BACKUP_DIR
cp prisma/production.db "$BACKUP_DIR/production-$(date +%Y%m%d-%H%M%S).db"
# Keep only last 7 days
find $BACKUP_DIR -name "production-*.db" -mtime +7 -delete
```

```bash
chmod +x backup-db.sh

# Add to crontab for daily backups at 2 AM
crontab -e
# Add: 0 2 * * * /var/www/error-logger-app/backup-db.sh
```

### Alternative: PostgreSQL (Recommended for Production)

If you need better performance and concurrent access:

1. Install PostgreSQL:

```bash
sudo apt install -y postgresql postgresql-contrib
```

2. Create database and user:

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE error_logger;
CREATE USER error_logger_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE error_logger TO error_logger_user;
\q
```

3. Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

4. Update `.env`:

```env
DATABASE_URL="postgresql://error_logger_user:your-secure-password@localhost:5432/error_logger"
```

5. Run migrations:

```bash
npm run db:migrate
npm run db:seed
npm run build
pm2 restart error-logger
```

## Monitoring and Maintenance

### View Application Logs

```bash
# PM2 logs
pm2 logs error-logger

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Update Application

```bash
cd /var/www/error-logger-app
git pull
npm install
npm run db:generate
npm run db:migrate
npm run build
pm2 restart error-logger
```

### Check Application Status

```bash
pm2 status
pm2 monit  # Real-time monitoring
```

## Security Checklist

- [ ] Change default admin password after first login
- [ ] Use strong AUTH_SECRET (32+ characters)
- [ ] Enable firewall (UFW)
- [ ] Use HTTPS/SSL certificate
- [ ] Keep system and dependencies updated
- [ ] Set up regular database backups
- [ ] Restrict file permissions:
  ```bash
  sudo chown -R $USER:$USER /var/www/error-logger-app
  chmod -R 755 /var/www/error-logger-app
  chmod 600 /var/www/error-logger-app/.env
  ```
- [ ] Consider using a non-root user for running the app
- [ ] Review and update CORS settings in `next.config.ts` if needed

## Troubleshooting

### Application won't start

```bash
# Check PM2 logs
pm2 logs error-logger

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart PM2
pm2 restart error-logger
```

### Nginx 502 Bad Gateway

- Check if the app is running: `pm2 list`
- Check app logs: `pm2 logs error-logger`
- Verify Nginx config: `sudo nginx -t`
- Check if port 3000 is accessible: `curl http://localhost:3000`

### Database issues

```bash
# Check database file permissions
ls -la prisma/production.db

# Verify database
sqlite3 prisma/production.db ".tables"

# Reset database (WARNING: deletes all data)
npm run db:reset
npm run db:seed
```

### Permission issues

```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/error-logger-app

# Fix permissions
chmod -R 755 /var/www/error-logger-app
```

## Quick Reference

```bash
# Start app
pm2 start npm --name "error-logger" -- start

# Stop app
pm2 stop error-logger

# Restart app
pm2 restart error-logger

# View logs
pm2 logs error-logger

# Update app
cd /var/www/error-logger-app
git pull && npm install && npm run build && pm2 restart error-logger

# Backup database
cp prisma/production.db backups/production-$(date +%Y%m%d).db
```

## Support

For issues or questions, refer to:

- Next.js Documentation: https://nextjs.org/docs
- Prisma Documentation: https://www.prisma.io/docs
- PM2 Documentation: https://pm2.keymetrics.io/docs/
