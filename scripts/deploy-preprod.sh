#!/bin/bash

# ================================================
# Deploy to Pre-Production OVH Server
# ================================================
# Usage: ./scripts/deploy-preprod.sh [options]
# Options:
#   --initial    : First time deployment (includes setup)
#   --update     : Update existing deployment
#   --rollback   : Rollback to previous version
# ================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ================================================
# Configuration
# ================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ ! -f "$PROJECT_ROOT/.env.preprod" ]; then
    echo -e "${RED}Error: .env.preprod file not found${NC}"
    echo "Copy .env.preprod.example to .env.preprod and configure it"
    exit 1
fi

source "$PROJECT_ROOT/.env.preprod"

# Server configuration
SERVER="${OVH_SERVER_IP}"
SSH_USER="${OVH_SSH_USER:-ubuntu}"
SSH_PORT="${OVH_SSH_PORT:-22}"
REMOTE_DIR="/opt/saas-boilerplate"

# ================================================
# Functions
# ================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_ssh_connection() {
    log_info "Testing SSH connection to $SERVER..."
    if ssh -p "$SSH_PORT" -o ConnectTimeout=5 "$SSH_USER@$SERVER" "echo 'SSH connection successful'" > /dev/null 2>&1; then
        log_success "SSH connection successful"
        return 0
    else
        log_error "Cannot connect to $SERVER via SSH"
        return 1
    fi
}

install_docker() {
    log_info "Installing Docker and Docker Compose on server..."

    ssh -p "$SSH_PORT" "$SSH_USER@$SERVER" << 'ENDSSH'
        # Update system
        sudo apt-get update
        sudo apt-get upgrade -y

        # Install Docker
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh

        # Add user to docker group
        sudo usermod -aG docker $USER

        # Install Docker Compose
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose

        # Enable Docker service
        sudo systemctl enable docker
        sudo systemctl start docker

        # Clean up
        rm get-docker.sh
ENDSSH

    log_success "Docker installed successfully"
}

setup_firewall() {
    log_info "Configuring UFW firewall..."

    ssh -p "$SSH_PORT" "$SSH_USER@$SERVER" << 'ENDSSH'
        # Install UFW if not present
        sudo apt-get install -y ufw

        # Default policies
        sudo ufw default deny incoming
        sudo ufw default allow outgoing

        # Allow SSH
        sudo ufw allow 22/tcp

        # Allow HTTP/HTTPS
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp

        # Enable firewall
        sudo ufw --force enable

        # Show status
        sudo ufw status verbose
ENDSSH

    log_success "Firewall configured"
}

create_directories() {
    log_info "Creating project directories on server..."

    ssh -p "$SSH_PORT" "$SSH_USER@$SERVER" << ENDSSH
        sudo mkdir -p $REMOTE_DIR
        sudo chown -R $SSH_USER:$SSH_USER $REMOTE_DIR
        mkdir -p $REMOTE_DIR/{backend,infra,monitoring,backups,logs}
        mkdir -p $REMOTE_DIR/infra/nginx/{conf.d,ssl}
        mkdir -p $REMOTE_DIR/monitoring/{prometheus,grafana}
ENDSSH

    log_success "Directories created"
}

upload_files() {
    log_info "Uploading files to server..."

    # Create tar archive locally
    tar -czf /tmp/saas-deploy.tar.gz \
        -C "$PROJECT_ROOT" \
        --exclude='node_modules' \
        --exclude='dist' \
        --exclude='.git' \
        --exclude='coverage' \
        --exclude='*.log' \
        docker-compose.preprod.yml \
        backend/ \
        infra/ \
        monitoring/ \
        .env.preprod

    # Upload to server
    scp -P "$SSH_PORT" /tmp/saas-deploy.tar.gz "$SSH_USER@$SERVER:$REMOTE_DIR/"

    # Extract on server
    ssh -p "$SSH_PORT" "$SSH_USER@$SERVER" << ENDSSH
        cd $REMOTE_DIR
        tar -xzf saas-deploy.tar.gz
        rm saas-deploy.tar.gz

        # Rename docker-compose file
        mv docker-compose.preprod.yml docker-compose.yml

        # Rename env file
        mv .env.preprod .env
ENDSSH

    # Cleanup
    rm /tmp/saas-deploy.tar.gz

    log_success "Files uploaded"
}

setup_ssl_certificates() {
    log_info "Setting up SSL certificates with Let's Encrypt..."

    ssh -p "$SSH_PORT" "$SSH_USER@$SERVER" << ENDSSH
        cd $REMOTE_DIR

        # Create initial certificate request
        sudo docker-compose run --rm certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email ${LETSENCRYPT_EMAIL} \
            --agree-tos \
            --no-eff-email \
            -d ${DOMAIN_NAME}
ENDSSH

    log_success "SSL certificates obtained"
}

pull_docker_images() {
    log_info "Pulling Docker images..."

    ssh -p "$SSH_PORT" "$SSH_USER@$SERVER" << ENDSSH
        cd $REMOTE_DIR
        sudo docker-compose pull
ENDSSH

    log_success "Docker images pulled"
}

run_migrations() {
    log_info "Running database migrations..."

    ssh -p "$SSH_PORT" "$SSH_USER@$SERVER" << ENDSSH
        cd $REMOTE_DIR

        # Wait for PostgreSQL to be ready
        echo "Waiting for PostgreSQL to be ready..."
        sleep 10

        # Run Prisma migrations
        sudo docker-compose exec -T backend npx prisma migrate deploy
ENDSSH

    log_success "Migrations completed"
}

start_services() {
    log_info "Starting Docker services..."

    ssh -p "$SSH_PORT" "$SSH_USER@$SERVER" << ENDSSH
        cd $REMOTE_DIR
        sudo docker-compose up -d

        # Show running containers
        echo ""
        echo "Running containers:"
        sudo docker-compose ps
ENDSSH

    log_success "Services started"
}

check_health() {
    log_info "Checking application health..."

    sleep 15  # Wait for services to start

    local health_url="https://${DOMAIN_NAME}/health"
    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts..."

        if curl -sf "$health_url" > /dev/null 2>&1; then
            log_success "Application is healthy!"
            curl -s "$health_url" | jq .
            return 0
        fi

        sleep 5
        ((attempt++))
    done

    log_error "Health check failed after $max_attempts attempts"
    return 1
}

backup_current_deployment() {
    log_info "Backing up current deployment..."

    ssh -p "$SSH_PORT" "$SSH_USER@$SERVER" << ENDSSH
        cd $REMOTE_DIR

        # Create backup directory with timestamp
        BACKUP_DIR="backups/deployment-\$(date +%Y%m%d-%H%M%S)"
        mkdir -p \$BACKUP_DIR

        # Backup database
        sudo docker-compose exec -T postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} | gzip > \$BACKUP_DIR/database.sql.gz

        # Backup current code
        tar -czf \$BACKUP_DIR/code.tar.gz backend/ infra/ monitoring/ docker-compose.yml .env

        echo "Backup saved to \$BACKUP_DIR"
ENDSSH

    log_success "Backup completed"
}

rollback_deployment() {
    log_info "Rolling back to previous deployment..."

    # Get latest backup directory
    LATEST_BACKUP=$(ssh -p "$SSH_PORT" "$SSH_USER@$SERVER" "ls -t $REMOTE_DIR/backups/ | head -1")

    if [ -z "$LATEST_BACKUP" ]; then
        log_error "No backup found to rollback"
        return 1
    fi

    log_info "Rolling back to: $LATEST_BACKUP"

    ssh -p "$SSH_PORT" "$SSH_USER@$SERVER" << ENDSSH
        cd $REMOTE_DIR

        # Stop services
        sudo docker-compose down

        # Restore code
        tar -xzf backups/$LATEST_BACKUP/code.tar.gz

        # Start services
        sudo docker-compose up -d
ENDSSH

    log_success "Rollback completed"
}

show_logs() {
    log_info "Showing recent logs..."

    ssh -p "$SSH_PORT" "$SSH_USER@$SERVER" << ENDSSH
        cd $REMOTE_DIR
        sudo docker-compose logs --tail=50 backend
ENDSSH
}

# ================================================
# Initial Deployment
# ================================================
initial_deployment() {
    log_info "Starting initial deployment to OVH pre-production..."

    check_ssh_connection || exit 1
    install_docker
    setup_firewall
    create_directories
    upload_files
    pull_docker_images
    start_services
    setup_ssl_certificates

    # Restart nginx to use new certificates
    ssh -p "$SSH_PORT" "$SSH_USER@$SERVER" "cd $REMOTE_DIR && sudo docker-compose restart nginx"

    run_migrations
    check_health || {
        log_error "Deployment failed health check"
        show_logs
        exit 1
    }

    log_success "=============================================="
    log_success "Initial deployment completed successfully!"
    log_success "=============================================="
    log_success "Application URL: https://${DOMAIN_NAME}"
    log_success "Grafana URL: https://grafana.${DOMAIN_NAME}"
    log_success ""
    log_info "Next steps:"
    log_info "1. Test the application: curl https://${DOMAIN_NAME}/health"
    log_info "2. Access Grafana: https://grafana.${DOMAIN_NAME}"
    log_info "3. Monitor logs: ssh $SSH_USER@$SERVER 'cd $REMOTE_DIR && sudo docker-compose logs -f'"
}

# ================================================
# Update Deployment
# ================================================
update_deployment() {
    log_info "Starting deployment update..."

    check_ssh_connection || exit 1
    backup_current_deployment
    upload_files
    pull_docker_images

    # Restart services with zero-downtime
    ssh -p "$SSH_PORT" "$SSH_USER@$SERVER" << ENDSSH
        cd $REMOTE_DIR
        sudo docker-compose up -d --no-deps --build backend
ENDSSH

    run_migrations
    check_health || {
        log_error "Update failed health check - initiating rollback"
        rollback_deployment
        exit 1
    }

    log_success "Update completed successfully!"
}

# ================================================
# Main Script Logic
# ================================================
main() {
    case "${1:-}" in
        --initial)
            initial_deployment
            ;;
        --update)
            update_deployment
            ;;
        --rollback)
            rollback_deployment
            ;;
        --logs)
            show_logs
            ;;
        --health)
            check_health
            ;;
        *)
            echo "Usage: $0 [--initial|--update|--rollback|--logs|--health]"
            echo ""
            echo "Options:"
            echo "  --initial    First time deployment (includes server setup)"
            echo "  --update     Update existing deployment"
            echo "  --rollback   Rollback to previous version"
            echo "  --logs       Show recent logs"
            echo "  --health     Check application health"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
