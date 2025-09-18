#!/bin/bash

# Budget-Friendly Deployment Script for QuantInsight AI
# Total Cost: ~$10-15/month

set -e

echo "🚀 QuantInsight AI Budget Deployment Script"
echo "==========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << EOL
# Database
POSTGRES_USER=quantinsight
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_DB=quantinsight_db

# Backend
SECRET_KEY=$(openssl rand -base64 32)
DATABASE_URL=postgresql://quantinsight:password@localhost:5432/quantinsight_db

# API Keys (fill these in)
FINNHUB_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
SENDGRID_API_KEY=your_key_here

# Frontend
REACT_APP_API_URL=http://your-domain.com:8000
EOL
    echo -e "${GREEN}✓ Created .env file - Please fill in your API keys${NC}"
    exit 1
fi

# Function to deploy on EC2
deploy_to_ec2() {
    SERVER_IP=$1
    KEY_PATH=$2
    
    echo -e "${YELLOW}Deploying to EC2 instance...${NC}"
    
    # Copy files to server
    scp -i $KEY_PATH -r ./* ec2-user@$SERVER_IP:~/quantinsight/
    
    # SSH and run deployment
    ssh -i $KEY_PATH ec2-user@$SERVER_IP << 'ENDSSH'
        cd ~/quantinsight
        
        # Stop existing containers
        docker-compose down || true
        
        # Pull latest changes
        git pull origin main || true
        
        # Build and start containers
        docker-compose up -d --build
        
        # Setup Nginx reverse proxy
        sudo tee /etc/nginx/conf.d/quantinsight.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        rewrite ^/api(/.*)$ $1 break;
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:8000/health;
    }
}
EOF
        
        # Restart Nginx
        sudo systemctl restart nginx
        
        # Check if containers are running
        docker-compose ps
ENDSSH
    
    echo -e "${GREEN}✓ Deployment complete!${NC}"
}

# Main menu
echo "Choose deployment option:"
echo "1) Deploy to existing EC2 instance"
echo "2) Create new EC2 instance with Terraform"
echo "3) Deploy locally with Docker Compose"

read -p "Enter choice (1-3): " choice

case $choice in
    1)
        read -p "Enter EC2 instance IP: " SERVER_IP
        read -p "Enter path to SSH key (.pem file): " KEY_PATH
        deploy_to_ec2 $SERVER_IP $KEY_PATH
        ;;
    2)
        echo -e "${YELLOW}Creating infrastructure with Terraform...${NC}"
        cd terraform
        terraform init
        terraform plan -out=tfplan
        terraform apply tfplan
        cd ..
        echo -e "${GREEN}✓ Infrastructure created! Check output for IP address${NC}"
        ;;
    3)
        echo -e "${YELLOW}Starting local deployment...${NC}"
        docker-compose up -d --build
        echo -e "${GREEN}✓ Local deployment complete!${NC}"
        echo "Frontend: http://localhost:3000"
        echo "Backend: http://localhost:8000"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📝 Next Steps:"
echo "1. Point your domain to the server IP"
echo "2. Set up SSL with: sudo certbot --nginx"
echo "3. Monitor logs with: docker-compose logs -f"
echo "4. Check health at: http://your-domain/health"