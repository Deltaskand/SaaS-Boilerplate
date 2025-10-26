# 🚀 Guide de Déploiement OVH - Pré-Production

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Configuration du serveur OVH](#configuration-du-serveur-ovh)
4. [Déploiement initial](#déploiement-initial)
5. [Déploiement continu (CI/CD)](#déploiement-continu-cicd)
6. [Monitoring et Maintenance](#monitoring-et-maintenance)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

Cette plateforme SaaS est déployée sur **OVH** en pré-production avec:

### Architecture
```
┌─────────────────────────────────────────────┐
│         Internet (HTTPS/SSL)                │
└──────────────┬──────────────────────────────┘
               │
        ┌──────▼──────┐
        │   Nginx     │ ← SSL/TLS, Rate Limiting, Proxy
        │  (Port 443) │
        └──────┬──────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐  ┌──▼───┐  ┌──▼────┐
│Backend│  │Grafana│  │Metrics│
│ :3000 │  │ :3001 │  │ :9090 │
└───┬───┘  └───────┘  └───────┘
    │
    ├──────┬──────────┐
    │      │          │
┌───▼───┐ ┌▼────┐  ┌─▼─────┐
│PostgreSQL│Redis│  │Backup │
│  :5432 │ :6379│  │Service│
└────────┘ └─────┘  └───────┘
```

### Services Déployés
- ✅ **Backend API** (NestJS) - Port 3000
- ✅ **PostgreSQL 15** - Port 5432 (localhost only)
- ✅ **Redis 7** - Port 6379 (localhost only)
- ✅ **Nginx** - Ports 80/443 (reverse proxy + SSL)
- ✅ **Prometheus** - Port 9090 (metrics)
- ✅ **Grafana** - Port 3001 (dashboards)
- ✅ **Certbot** - SSL auto-renewal
- ✅ **Backup Service** - Daily PostgreSQL backups

---

## 💻 Prérequis

### 1. Serveur OVH

**Recommandations minimales**:
- **VPS SSD 2** ou supérieur
- 4 vCores
- 8 GB RAM
- 80 GB SSD NVMe
- Ubuntu 22.04 LTS
- IP publique

**Budget**: ~15-25€/mois

### 2. Nom de Domaine

Configuré avec les DNS suivants:
```
Type  | Nom                  | Valeur
------|----------------------|------------------
A     | preprod-api          | XXX.XXX.XXX.XXX (IP OVH)
A     | grafana.preprod      | XXX.XXX.XXX.XXX (IP OVH)
```

### 3. Secrets & Credentials

Générer les secrets sécurisés:
```bash
# JWT Secret (64 caractères)
openssl rand -base64 64

# PostgreSQL Password
openssl rand -base64 32

# Redis Password
openssl rand -base64 24

# Grafana Admin Password
openssl rand -base64 16
```

### 4. Outils Locaux

```bash
# Installer sur votre machine
- Git
- SSH client
- jq (pour parser JSON)
- curl
```

---

## 🔧 Configuration du Serveur OVH

### Étape 1: Connexion Initiale

```bash
# Se connecter au serveur OVH
ssh root@votre-ip-ovh

# Créer un utilisateur non-root
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### Étape 2: Sécurisation SSH

```bash
# Configurer SSH avec clé publique
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Sur votre machine locale, générer une clé SSH
ssh-keygen -t ed25519 -C "deploy@saas-preprod"

# Copier la clé publique vers le serveur
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@votre-ip-ovh

# Sur le serveur, désactiver l'authentification par mot de passe
sudo nano /etc/ssh/sshd_config

# Modifier ces lignes:
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes

# Redémarrer SSH
sudo systemctl restart sshd
```

### Étape 3: Mettre à Jour le Système

```bash
# Update système
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get dist-upgrade -y

# Installer outils essentiels
sudo apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    net-tools \
    ufw \
    fail2ban \
    jq
```

### Étape 4: Configuration Swap (recommandé)

```bash
# Créer 4GB de swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Rendre permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 🚀 Déploiement Initial

### Étape 1: Cloner le Projet

```bash
# Sur votre machine locale
cd ~/projects
git clone https://github.com/Deltaskand/SaaS-Boilerplate.git
cd SaaS-Boilerplate
git checkout develop  # ou votre branche de preprod
```

### Étape 2: Configurer les Variables d'Environnement

```bash
# Copier l'exemple
cp .env.preprod.example .env.preprod

# Éditer avec vos vraies valeurs
nano .env.preprod
```

**Variables critiques à configurer**:
```env
# Serveur OVH
OVH_SERVER_IP=51.210.XXX.XXX
OVH_SSH_USER=deploy

# Domaine
DOMAIN_NAME=preprod-api.votredomaine.com
LETSENCRYPT_EMAIL=admin@votredomaine.com

# Database
POSTGRES_PASSWORD=<généré avec openssl>

# Redis
REDIS_PASSWORD=<généré avec openssl>

# JWT
JWT_SECRET=<généré avec openssl 64 chars>

# CORS
CORS_ORIGIN=https://preprod.votredomaine.com

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
GRAFANA_ADMIN_PASSWORD=<généré avec openssl>

# Services externes (optionnel)
SENDGRID_API_KEY=SG.xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

### Étape 3: Déploiement Automatique

```bash
# Rendre le script exécutable
chmod +x scripts/deploy-preprod.sh

# Lancer le déploiement initial
./scripts/deploy-preprod.sh --initial
```

**Le script va**:
1. ✅ Installer Docker & Docker Compose
2. ✅ Configurer le firewall UFW
3. ✅ Créer les répertoires
4. ✅ Uploader les fichiers
5. ✅ Obtenir les certificats SSL
6. ✅ Démarrer tous les services
7. ✅ Exécuter les migrations DB
8. ✅ Vérifier la santé de l'application

**Durée**: ~10-15 minutes

### Étape 4: Vérification Post-Déploiement

```bash
# Vérifier que tous les conteneurs tournent
ssh deploy@votre-ip-ovh "cd /opt/saas-boilerplate && sudo docker-compose ps"

# Tester le health check
curl https://preprod-api.votredomaine.com/health

# Accéder à Swagger API
open https://preprod-api.votredomaine.com/api/docs

# Accéder à Grafana
open https://grafana.preprod.votredomaine.com
# Login: admin / <votre GRAFANA_ADMIN_PASSWORD>
```

---

## 🔄 Déploiement Continu (CI/CD)

### Configuration GitHub Actions

#### Étape 1: Ajouter les Secrets GitHub

Aller sur: **GitHub → Settings → Secrets and variables → Actions**

Ajouter ces secrets:

```yaml
# Serveur OVH
OVH_SERVER_IP: 51.210.XXX.XXX
OVH_SSH_USER: deploy
OVH_SSH_PRIVATE_KEY: <contenu de ~/.ssh/id_ed25519>

# Domaine
DOMAIN_NAME: preprod-api.votredomaine.com
LETSENCRYPT_EMAIL: admin@votredomaine.com

# Database
POSTGRES_DB: saas_boilerplate_preprod
POSTGRES_USER: saas_user
POSTGRES_PASSWORD: <votre password>

# Redis
REDIS_PASSWORD: <votre password>

# Security
JWT_SECRET: <votre secret 64 chars>

# CORS
CORS_ORIGIN: https://preprod.votredomaine.com

# Monitoring
SENTRY_DSN: https://xxx@sentry.io/xxx
GRAFANA_ADMIN_PASSWORD: <votre password>

# Services externes
SENDGRID_API_KEY: SG.xxx
SENDGRID_FROM_EMAIL: noreply@votredomaine.com
STRIPE_SECRET_KEY: sk_test_xxx
STRIPE_WEBHOOK_SECRET: whsec_xxx

# Notifications (optionnel)
SLACK_WEBHOOK_URL: https://hooks.slack.com/services/xxx
```

#### Étape 2: Activer le Workflow

Le workflow `.github/workflows/deploy-preprod.yml` se déclenche automatiquement:

**Déclencheurs**:
- ✅ Push sur la branche `develop`
- ✅ Déploiement manuel via GitHub Actions UI

**Pipeline**:
```
1. Build & Test
   ├─ Lint code
   ├─ Run tests
   └─ Build TypeScript

2. Build Docker Image
   ├─ Build image
   └─ Push to GHCR

3. Deploy to OVH
   ├─ SSH to server
   ├─ Pull latest image
   ├─ Run migrations
   ├─ Restart services (zero-downtime)
   └─ Health check

4. Smoke Tests
   ├─ Test /health
   ├─ Test /api/docs
   └─ Test /metrics

5. Notify (Slack)
```

#### Étape 3: Déclencher un Déploiement

**Automatique** (à chaque push sur `develop`):
```bash
git checkout develop
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin develop
# → Le déploiement se lance automatiquement
```

**Manuel** (via GitHub UI):
```
1. Aller sur GitHub → Actions
2. Sélectionner "Deploy to Pre-Production (OVH)"
3. Cliquer "Run workflow"
4. Choisir l'action: update ou rollback
5. Cliquer "Run workflow"
```

---

## 📊 Monitoring et Maintenance

### Accès Grafana

**URL**: https://grafana.preprod.votredomaine.com
**Login**: admin
**Password**: `<GRAFANA_ADMIN_PASSWORD>`

**Dashboards disponibles**:
- 📊 Application Metrics (API, latence, throughput)
- 💾 Database Metrics (PostgreSQL connections, queries)
- 🔴 Redis Metrics (cache hit rate, memory)
- 🌐 Nginx Metrics (requests/sec, response times)
- 💻 System Metrics (CPU, RAM, Disk, Network)

### Logs en Temps Réel

```bash
# Logs de l'API backend
ssh deploy@votre-ip-ovh "cd /opt/saas-boilerplate && sudo docker-compose logs -f backend"

# Logs de tous les services
ssh deploy@votre-ip-ovh "cd /opt/saas-boilerplate && sudo docker-compose logs -f"

# Logs Nginx
ssh deploy@votre-ip-ovh "cd /opt/saas-boilerplate && sudo docker-compose logs -f nginx"

# Logs PostgreSQL
ssh deploy@votre-ip-ovh "cd /opt/saas-boilerplate && sudo docker-compose logs -f postgres"
```

### Backups

**Automatiques** (configurés dans docker-compose):
- 📅 **Daily**: Sauvegarde quotidienne à minuit
- 📅 **Retention**: 7 jours + 4 semaines + 6 mois

**Emplacement des backups**:
```bash
ssh deploy@votre-ip-ovh "ls -lh /opt/saas-boilerplate/backups/"
```

**Restaurer un backup**:
```bash
# Lister les backups disponibles
ssh deploy@votre-ip-ovh "ls /opt/saas-boilerplate/backups/"

# Restaurer (exemple)
ssh deploy@votre-ip-ovh << 'EOF'
cd /opt/saas-boilerplate
gunzip -c backups/20250126_000000_saas_boilerplate_preprod.sql.gz | \
  sudo docker-compose exec -T postgres psql -U saas_user saas_boilerplate_preprod
EOF
```

### Mise à Jour de l'Application

```bash
# Méthode 1: Via script (recommandé)
./scripts/deploy-preprod.sh --update

# Méthode 2: Via GitHub Actions
# → Push sur develop ou déclenchement manuel

# Méthode 3: Manuelle SSH
ssh deploy@votre-ip-ovh << 'EOF'
cd /opt/saas-boilerplate
sudo docker-compose pull
sudo docker-compose up -d --no-deps --build backend
EOF
```

### Rollback en Cas de Problème

```bash
# Méthode 1: Via script (recommandé)
./scripts/deploy-preprod.sh --rollback

# Méthode 2: Via GitHub Actions
# → Run workflow avec action "rollback"
```

---

## 🛠️ Troubleshooting

### Problème: Services ne démarrent pas

```bash
# Vérifier les logs
ssh deploy@votre-ip-ovh "cd /opt/saas-boilerplate && sudo docker-compose logs"

# Vérifier l'état des conteneurs
ssh deploy@votre-ip-ovh "cd /opt/saas-boilerplate && sudo docker-compose ps"

# Redémarrer tous les services
ssh deploy@votre-ip-ovh "cd /opt/saas-boilerplate && sudo docker-compose restart"
```

### Problème: Certificat SSL expiré

```bash
# Forcer le renouvellement
ssh deploy@votre-ip-ovh << 'EOF'
cd /opt/saas-boilerplate
sudo docker-compose run --rm certbot renew --force-renewal
sudo docker-compose restart nginx
EOF
```

### Problème: Base de données pleine

```bash
# Vérifier l'utilisation disque
ssh deploy@votre-ip-ovh "df -h"

# Nettoyer les vieux backups
ssh deploy@votre-ip-ovh "cd /opt/saas-boilerplate/backups && ls -lt | tail -n +20 | awk '{print \$9}' | xargs rm -f"

# Nettoyer les logs Docker
ssh deploy@votre-ip-ovh "sudo docker system prune -af --volumes"
```

### Problème: Performances dégradées

```bash
# Vérifier les ressources
ssh deploy@votre-ip-ovh "htop"

# Vérifier les connexions DB
ssh deploy@votre-ip-ovh "cd /opt/saas-boilerplate && sudo docker-compose exec postgres psql -U saas_user -d saas_boilerplate_preprod -c 'SELECT count(*) FROM pg_stat_activity;'"

# Redémarrer Redis (cache flush)
ssh deploy@votre-ip-ovh "cd /opt/saas-boilerplate && sudo docker-compose restart redis"
```

### Problème: Cannot connect to server

```bash
# Vérifier que le firewall autorise le port 22
ssh deploy@votre-ip-ovh "sudo ufw status"

# Vérifier que SSH est actif
ssh deploy@votre-ip-ovh "sudo systemctl status sshd"
```

---

## 📞 Support & Ressources

### Documentation OVH
- VPS: https://docs.ovh.com/fr/vps/
- Firewall: https://docs.ovh.com/fr/dedicated/firewall-network/

### Commandes Utiles

```bash
# Status de tous les services
ssh deploy@votre-ip-ovh "cd /opt/saas-boilerplate && sudo docker-compose ps"

# Utilisation des ressources
ssh deploy@votre-ip-ovh "htop"

# Espace disque
ssh deploy@votre-ip-ovh "df -h"

# Logs nginx access
ssh deploy@votre-ip-ovh "sudo docker-compose exec nginx tail -f /var/log/nginx/access.log"

# Connexions actives
ssh deploy@votre-ip-ovh "ss -tunap | grep ESTABLISHED"
```

---

## ✅ Checklist Post-Déploiement

- [ ] ✅ Application accessible via HTTPS
- [ ] ✅ Certificat SSL valide (cadenas vert)
- [ ] ✅ Health check retourne `{"status":"ok"}`
- [ ] ✅ Swagger API accessible
- [ ] ✅ Grafana accessible et dashboards configurés
- [ ] ✅ Prometheus collecte les métriques
- [ ] ✅ Backups automatiques fonctionnent
- [ ] ✅ Logs accessibles et structurés
- [ ] ✅ CI/CD GitHub Actions fonctionne
- [ ] ✅ Rollback testé et fonctionnel
- [ ] ✅ Alertes Slack/email configurées
- [ ] ✅ Documentation à jour

---

## 🎉 Prochaines Étapes

1. **Configurer le monitoring avancé**
   - Alertes Prometheus
   - Dashboard Grafana personnalisé

2. **Optimiser les performances**
   - CDN pour les assets statiques
   - Read replicas PostgreSQL

3. **Sécurité avancée**
   - Fail2ban configuré
   - WAF (Web Application Firewall)

4. **Haute disponibilité**
   - Load balancer
   - Multi-region deployment

---

**Déploiement créé avec ❤️ par Claude Code**
