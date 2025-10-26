# 🚀 GUIDE DE DÉPLOIEMENT OVH - ÉTAPE PAR ÉTAPE

## 📋 Guide Complet avec Toutes les Commandes

Ce guide vous accompagne du début à la fin pour déployer votre plateforme SaaS sur OVH.

---

## ÉTAPE 1: COMMANDER LE SERVEUR VPS OVH

### 1.1 Choisir le Bon VPS

Aller sur: **https://www.ovhcloud.com/fr/vps/**

**Recommandation pour pré-production**:
- **VPS SSD 2** (ou supérieur)
- 4 vCores
- 8 GB RAM
- 160 GB SSD NVMe
- Budget: ~20€/mois HT

**Configuration à sélectionner**:
```
✅ Distribution: Ubuntu 22.04 LTS
✅ Datacenter: Gravelines (GRA) ou Roubaix (RBX) - France
✅ Options additionnelles: Snapshot automatique (optionnel, +3€/mois)
```

### 1.2 Compléter la Commande

1. Cliquer sur "Commander"
2. Choisir la durée (mensuel recommandé pour commencer)
3. Payer et attendre l'email de livraison (5-10 minutes)

### 1.3 Récupérer les Identifiants

Vous recevrez un email avec:
```
Nom du serveur: vpsXXXXX.ovh.net
IP publique: 51.210.XXX.XXX
Login: ubuntu (ou root selon config)
Mot de passe: [généré automatiquement]
```

**⚠️ IMPORTANT**: Notez bien l'IP publique, vous en aurez besoin!

---

## ÉTAPE 2: CONFIGURER LE DNS POUR VOTRE DOMAINE

### 2.1 Si vous avez déjà un domaine

Aller dans l'interface de gestion DNS de votre registrar (OVH, Gandi, Cloudflare, etc.)

### 2.2 Ajouter les Enregistrements DNS

**Ajouter ces 2 enregistrements A**:

```bash
# Enregistrement 1: API Backend
Type: A
Nom: preprod-api
Valeur: 51.210.XXX.XXX  # ← Votre IP OVH
TTL: 300 (5 minutes)

# Enregistrement 2: Grafana Monitoring
Type: A
Nom: grafana.preprod
Valeur: 51.210.XXX.XXX  # ← Même IP OVH
TTL: 300
```

**Exemple chez OVH**:
```bash
# Se connecter à l'espace client OVH
https://www.ovh.com/manager/

# Web Cloud → Domaines → votredomaine.com → Zone DNS → Ajouter une entrée
```

### 2.3 Vérifier la Propagation DNS

Attendre 5-10 minutes puis tester:

```bash
# Sur votre machine locale
dig preprod-api.votredomaine.com +short
# Doit retourner: 51.210.XXX.XXX

dig grafana.preprod.votredomaine.com +short
# Doit retourner: 51.210.XXX.XXX
```

**Si pas d'IP retournée**: Attendre encore 5-10 minutes (propagation DNS).

---

## ÉTAPE 3: PREMIÈRE CONNEXION AU SERVEUR OVH

### 3.1 Se Connecter en SSH (première fois)

```bash
# Sur votre machine locale (Mac/Linux)
ssh ubuntu@51.210.XXX.XXX
# OU si c'est root:
ssh root@51.210.XXX.XXX

# Entrer le mot de passe reçu par email
# ⚠️ Le mot de passe ne s'affiche pas quand vous tapez (normal)
```

**Si erreur "Connection refused"**:
- Attendre 5 minutes (le serveur démarre)
- Vérifier l'IP dans l'email OVH
- Vérifier que votre firewall local autorise SSH

### 3.2 Changer le Mot de Passe Root (IMPORTANT)

```bash
# Une fois connecté au serveur
sudo passwd ubuntu
# OU:
passwd

# Entrer un nouveau mot de passe FORT
# Exemple: Généré avec: openssl rand -base64 24
```

### 3.3 Mettre à Jour le Système

```bash
# Toujours sur le serveur OVH
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get dist-upgrade -y

# Installer les outils de base
sudo apt-get install -y curl wget git vim htop net-tools ufw fail2ban jq

# Redémarrer si nécessaire
sudo reboot
# ⚠️ Attendre 2 minutes avant de reconnecter
```

### 3.4 Créer un Utilisateur de Déploiement

```bash
# Reconnecter après reboot
ssh ubuntu@51.210.XXX.XXX

# Créer l'utilisateur 'deploy'
sudo adduser deploy
# Entrer un mot de passe
# Laisser les autres champs vides (appuyer sur Entrée)

# Ajouter au groupe sudo
sudo usermod -aG sudo deploy
sudo usermod -aG docker deploy

# Vérifier
groups deploy
# Doit afficher: deploy sudo docker
```

---

## ÉTAPE 4: SÉCURISER L'ACCÈS SSH AVEC CLÉ PUBLIQUE

### 4.1 Générer une Clé SSH sur Votre Machine Locale

```bash
# Sur VOTRE machine locale (pas le serveur!)
cd ~/.ssh

# Générer une nouvelle clé SSH
ssh-keygen -t ed25519 -C "deploy-saas-preprod" -f saas_preprod_key

# Appuyer sur Entrée pour ne pas mettre de passphrase
# (ou entrer une passphrase si vous préférez plus de sécurité)

# Vérifier que les fichiers sont créés
ls -la ~/.ssh/saas_preprod_key*
# Doit afficher:
# saas_preprod_key      (clé privée - NE JAMAIS PARTAGER!)
# saas_preprod_key.pub  (clé publique)
```

### 4.2 Copier la Clé Publique sur le Serveur

```bash
# Sur votre machine locale
ssh-copy-id -i ~/.ssh/saas_preprod_key.pub deploy@51.210.XXX.XXX

# Entrer le mot de passe de l'utilisateur 'deploy'
```

**Si `ssh-copy-id` n'existe pas (Windows)**:
```bash
# Afficher la clé publique
cat ~/.ssh/saas_preprod_key.pub

# Copier le contenu (commence par "ssh-ed25519 AAAA...")

# Se connecter au serveur
ssh deploy@51.210.XXX.XXX

# Créer le fichier authorized_keys
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys

# Coller la clé publique copiée
# Sauvegarder: Ctrl+O, Entrée, Ctrl+X

# Définir les permissions
chmod 600 ~/.ssh/authorized_keys
exit
```

### 4.3 Tester la Connexion avec la Clé

```bash
# Sur votre machine locale
ssh -i ~/.ssh/saas_preprod_key deploy@51.210.XXX.XXX

# ✅ Si ça fonctionne SANS demander de mot de passe, c'est bon!
```

### 4.4 Configurer SSH sur Votre Machine Locale (optionnel mais recommandé)

```bash
# Sur votre machine locale
nano ~/.ssh/config

# Ajouter cette configuration:
Host ovh-preprod
    HostName 51.210.XXX.XXX
    User deploy
    IdentityFile ~/.ssh/saas_preprod_key
    ServerAliveInterval 60
    ServerAliveCountMax 3

# Sauvegarder: Ctrl+O, Entrée, Ctrl+X

# Maintenant vous pouvez vous connecter avec:
ssh ovh-preprod
# Au lieu de: ssh -i ~/.ssh/saas_preprod_key deploy@51.210.XXX.XXX
```

### 4.5 Désactiver l'Authentification par Mot de Passe (SÉCURITÉ)

```bash
# Se connecter au serveur
ssh ovh-preprod

# Modifier la config SSH
sudo nano /etc/ssh/sshd_config

# Trouver et modifier ces lignes:
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
ChallengeResponseAuthentication no

# Sauvegarder: Ctrl+O, Entrée, Ctrl+X

# Redémarrer SSH
sudo systemctl restart sshd

# ⚠️ NE PAS FERMER cette session SSH!
# Ouvrir une NOUVELLE fenêtre terminal et tester:
ssh ovh-preprod
# Si ça fonctionne, c'est bon. Sinon, revenir à la première session pour corriger.
```

---

## ÉTAPE 5: GÉNÉRER LES SECRETS DE PRODUCTION

### 5.1 Générer tous les Secrets Nécessaires

```bash
# Sur votre machine locale
cd ~/projects/SaaS-Boilerplate

# Créer un fichier pour stocker les secrets temporairement
touch secrets.txt
chmod 600 secrets.txt  # Sécuriser le fichier

# Générer JWT Secret (64 caractères)
echo "JWT_SECRET=$(openssl rand -base64 64)" >> secrets.txt

# Générer PostgreSQL Password (32 caractères)
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> secrets.txt

# Générer Redis Password (24 caractères)
echo "REDIS_PASSWORD=$(openssl rand -base64 24)" >> secrets.txt

# Générer Grafana Admin Password (16 caractères)
echo "GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 16)" >> secrets.txt

# Afficher les secrets générés
cat secrets.txt
```

**Résultat attendu**:
```
JWT_SECRET=abcd1234...xyz890== (64+ caractères)
POSTGRES_PASSWORD=efgh5678...abc123==
REDIS_PASSWORD=ijkl9012...def456==
GRAFANA_ADMIN_PASSWORD=mnop3456...ghi789==
```

**⚠️ IMPORTANT**:
- Sauvegardez ces secrets dans un gestionnaire de mots de passe (1Password, LastPass, Bitwarden)
- NE JAMAIS committer `secrets.txt` dans Git!

---

## ÉTAPE 6: CONFIGURER LE FICHIER .env.preprod

### 6.1 Copier le Template

```bash
# Sur votre machine locale
cd ~/projects/SaaS-Boilerplate

# Copier le fichier exemple
cp .env.preprod.example .env.preprod
```

### 6.2 Éditer avec vos Vraies Valeurs

```bash
# Ouvrir l'éditeur
nano .env.preprod
# OU avec VSCode:
code .env.preprod
```

### 6.3 Remplir les Variables CRITIQUES

**Remplacer ces valeurs** (minimum requis):

```bash
# ==============================================
# SERVEUR OVH
# ==============================================
OVH_SERVER_IP=51.210.XXX.XXX           # ← VOTRE IP OVH
OVH_SSH_USER=deploy
OVH_SSH_PORT=22

# ==============================================
# DOMAINE & SSL
# ==============================================
DOMAIN_NAME=preprod-api.votredomaine.com    # ← VOTRE DOMAINE
LETSENCRYPT_EMAIL=admin@votredomaine.com    # ← VOTRE EMAIL

# ==============================================
# DATABASE
# ==============================================
POSTGRES_DB=saas_boilerplate_preprod
POSTGRES_USER=saas_user
POSTGRES_PASSWORD=<coller depuis secrets.txt>    # ← SECRET GÉNÉRÉ

# ==============================================
# REDIS
# ==============================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<coller depuis secrets.txt>       # ← SECRET GÉNÉRÉ

# ==============================================
# SECURITY - JWT
# ==============================================
JWT_SECRET=<coller depuis secrets.txt>           # ← SECRET GÉNÉRÉ (64 chars)
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# ==============================================
# CORS
# ==============================================
CORS_ORIGIN=https://preprod.votredomaine.com,https://preprod-api.votredomaine.com

# ==============================================
# MONITORING
# ==============================================
SENTRY_DSN=                                      # ← Optionnel (laisser vide pour l'instant)
GRAFANA_ADMIN_PASSWORD=<coller depuis secrets.txt>    # ← SECRET GÉNÉRÉ

# ==============================================
# DOCKER
# ==============================================
DOCKER_REGISTRY=ghcr.io
DOCKER_IMAGE=votre-username/saas-boilerplate    # ← VOTRE USERNAME GITHUB

# ==============================================
# SERVICES EXTERNES (Optionnel pour l'instant)
# ==============================================
SENDGRID_API_KEY=                               # ← Laisser vide
SENDGRID_FROM_EMAIL=
STRIPE_SECRET_KEY=
```

**Sauvegarder**: Ctrl+O, Entrée, Ctrl+X (nano) ou Ctrl+S (VSCode)

### 6.4 Vérifier le Fichier

```bash
# Vérifier que les variables critiques sont bien remplies
grep -E "OVH_SERVER_IP|DOMAIN_NAME|POSTGRES_PASSWORD|JWT_SECRET" .env.preprod

# Doit afficher vos vraies valeurs (pas de "CHANGE_ME")
```

---

## ÉTAPE 7: LANCER LE DÉPLOIEMENT INITIAL

### 7.1 Vérifier les Prérequis Locaux

```bash
# Vérifier que vous êtes dans le bon répertoire
pwd
# Doit afficher: /Users/votre-nom/projects/SaaS-Boilerplate (ou similaire)

# Vérifier que le script existe
ls -la scripts/deploy-preprod.sh
# Doit afficher: -rwxr-xr-x (exécutable)

# Si pas exécutable:
chmod +x scripts/deploy-preprod.sh

# Vérifier que .env.preprod existe
ls -la .env.preprod
```

### 7.2 Tester la Connexion SSH

```bash
# Test rapide
ssh -i ~/.ssh/saas_preprod_key deploy@51.210.XXX.XXX "echo 'SSH OK'"
# Doit afficher: SSH OK

# Si erreur, retourner à l'étape 4
```

### 7.3 Lancer le Déploiement Initial 🚀

```bash
# LANCEMENT DU DÉPLOIEMENT COMPLET
./scripts/deploy-preprod.sh --initial
```

**Ce qui va se passer** (durée: 10-15 minutes):

```
[INFO] Testing SSH connection to 51.210.XXX.XXX...
[SUCCESS] SSH connection successful

[INFO] Installing Docker and Docker Compose on server...
  → Installation de Docker
  → Installation de Docker Compose v2.24.0
  → Ajout de l'utilisateur au groupe docker
[SUCCESS] Docker installed successfully

[INFO] Configuring UFW firewall...
  → Allow SSH (port 22)
  → Allow HTTP (port 80)
  → Allow HTTPS (port 443)
  → Enable firewall
[SUCCESS] Firewall configured

[INFO] Creating project directories on server...
[SUCCESS] Directories created

[INFO] Uploading files to server...
  → Creating tar archive
  → Uploading via SCP
  → Extracting on server
[SUCCESS] Files uploaded

[INFO] Pulling Docker images...
  → postgres:15-alpine
  → redis:7-alpine
  → nginx:alpine
  → prom/prometheus:latest
  → grafana/grafana:latest
[SUCCESS] Docker images pulled

[INFO] Starting Docker services...
  → Starting postgres...
  → Starting redis...
  → Starting backend...
  → Starting nginx...
  → Starting prometheus...
  → Starting grafana...
[SUCCESS] Services started

[INFO] Setting up SSL certificates with Let's Encrypt...
  → Requesting certificate for preprod-api.votredomaine.com
  → Requesting certificate for grafana.preprod.votredomaine.com
[SUCCESS] SSL certificates obtained

[INFO] Running database migrations...
  → npx prisma migrate deploy
[SUCCESS] Migrations completed

[INFO] Checking application health...
  → Health check attempt 1/10...
  → Health check attempt 2/10...
[SUCCESS] Application is healthy!

==============================================
Initial deployment completed successfully!
==============================================
Application URL: https://preprod-api.votredomaine.com
Grafana URL: https://grafana.preprod.votredomaine.com

Next steps:
1. Test the application: curl https://preprod-api.votredomaine.com/health
2. Access Grafana: https://grafana.preprod.votredomaine.com
3. Monitor logs: ssh deploy@51.210.XXX.XXX 'cd /opt/saas-boilerplate && sudo docker-compose logs -f'
```

### 7.4 En Cas d'Erreur Pendant le Déploiement

**Si erreur SSL**:
```bash
# Vérifier que les DNS pointent bien vers le serveur
dig preprod-api.votredomaine.com +short
# Doit retourner l'IP OVH

# Si pas d'IP, attendre 5-10 minutes (propagation DNS)
# Puis relancer:
./scripts/deploy-preprod.sh --initial
```

**Si erreur Docker**:
```bash
# Se connecter au serveur
ssh ovh-preprod

# Vérifier que Docker fonctionne
sudo docker ps
sudo systemctl status docker

# Si Docker n'est pas démarré:
sudo systemctl start docker
sudo systemctl enable docker
```

**Si erreur de permissions**:
```bash
# Sur le serveur
sudo chown -R deploy:deploy /opt/saas-boilerplate
```

---

## ÉTAPE 8: VÉRIFIER QUE TOUT FONCTIONNE

### 8.1 Tester l'API Backend

```bash
# Sur votre machine locale
curl https://preprod-api.votredomaine.com/health
```

**Résultat attendu**:
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up",
      "message": "PostgreSQL is healthy"
    },
    "memory_heap": {
      "status": "up"
    },
    "disk": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

### 8.2 Tester Swagger API

```bash
# Ouvrir dans le navigateur
open https://preprod-api.votredomaine.com/api/docs
# OU sur Linux:
xdg-open https://preprod-api.votredomaine.com/api/docs
```

**Vous devez voir**: L'interface Swagger avec la documentation de l'API

### 8.3 Tester Grafana

```bash
# Ouvrir dans le navigateur
open https://grafana.preprod.votredomaine.com
```

**Credentials**:
- Username: `admin`
- Password: `<GRAFANA_ADMIN_PASSWORD>` (dans .env.preprod)

**Vous devez voir**: Le dashboard Grafana avec des métriques

### 8.4 Vérifier les Certificats SSL

```bash
# Tester le certificat SSL
echo | openssl s_client -servername preprod-api.votredomaine.com -connect preprod-api.votredomaine.com:443 2>/dev/null | openssl x509 -noout -dates
```

**Résultat attendu**:
```
notBefore=Jan 26 10:00:00 2025 GMT
notAfter=Apr 26 10:00:00 2025 GMT
```

### 8.5 Vérifier les Services Docker sur le Serveur

```bash
# Se connecter au serveur
ssh ovh-preprod

# Voir tous les conteneurs qui tournent
cd /opt/saas-boilerplate
sudo docker-compose ps
```

**Résultat attendu**:
```
NAME                           STATUS              PORTS
saas-backend-preprod           Up (healthy)        127.0.0.1:3000->3000/tcp
saas-postgres-preprod          Up (healthy)        127.0.0.1:5432->5432/tcp
saas-redis-preprod             Up (healthy)        127.0.0.1:6379->6379/tcp
saas-nginx-preprod             Up (healthy)        0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
saas-prometheus-preprod        Up                  127.0.0.1:9090->9090/tcp
saas-grafana-preprod           Up                  127.0.0.1:3001->3000/tcp
saas-certbot-preprod           Up
saas-postgres-backup-preprod   Up (healthy)
```

**Tous doivent être "Up" ou "Up (healthy)"**

### 8.6 Vérifier les Logs

```bash
# Toujours sur le serveur
sudo docker-compose logs --tail=50 backend
```

**Vous devez voir**:
```
saas-backend-preprod  | [INFO] 🚀 Application is running on: http://localhost:3000
saas-backend-preprod  | [INFO] 📊 GraphQL Playground: http://localhost:3000/graphql
saas-backend-preprod  | [INFO] 💓 Health check: http://localhost:3000/health
saas-backend-preprod  | [INFO] 🌍 Environment: production
```

---

## ÉTAPE 9: CONFIGURER GITHUB ACTIONS POUR CI/CD

### 9.1 Préparer la Clé SSH Privée

```bash
# Sur votre machine locale
cat ~/.ssh/saas_preprod_key

# Copier TOUT le contenu (y compris les lignes BEGIN et END)
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...
...
-----END OPENSSH PRIVATE KEY-----
```

### 9.2 Ajouter les Secrets dans GitHub

Aller sur: **https://github.com/votre-username/SaaS-Boilerplate/settings/secrets/actions**

Cliquer sur **"New repository secret"**

**Ajouter ces secrets un par un**:

| Nom du Secret | Valeur |
|---------------|--------|
| `OVH_SERVER_IP` | `51.210.XXX.XXX` |
| `OVH_SSH_USER` | `deploy` |
| `OVH_SSH_PRIVATE_KEY` | Coller le contenu de `~/.ssh/saas_preprod_key` |
| `DOMAIN_NAME` | `preprod-api.votredomaine.com` |
| `LETSENCRYPT_EMAIL` | `admin@votredomaine.com` |
| `POSTGRES_DB` | `saas_boilerplate_preprod` |
| `POSTGRES_USER` | `saas_user` |
| `POSTGRES_PASSWORD` | Coller depuis secrets.txt |
| `REDIS_PASSWORD` | Coller depuis secrets.txt |
| `JWT_SECRET` | Coller depuis secrets.txt |
| `CORS_ORIGIN` | `https://preprod.votredomaine.com` |
| `GRAFANA_ADMIN_PASSWORD` | Coller depuis secrets.txt |

**Secrets optionnels** (laisser vides pour l'instant):
- `SENTRY_DSN`
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SLACK_WEBHOOK_URL`

### 9.3 Tester le Workflow GitHub Actions

```bash
# Sur votre machine locale
cd ~/projects/SaaS-Boilerplate

# Créer une petite modification
echo "# Test CI/CD" >> README.md

# Commit et push sur develop
git add README.md
git commit -m "test: trigger CI/CD deployment"
git push origin develop
```

**Suivre le déploiement**:
1. Aller sur GitHub → Actions
2. Cliquer sur le workflow "Deploy to Pre-Production (OVH)"
3. Regarder les logs en temps réel

**Durée**: 5-8 minutes

### 9.4 Déclencher un Déploiement Manuel

**Via GitHub UI**:
1. Aller sur: **GitHub → Actions**
2. Sélectionner **"Deploy to Pre-Production (OVH)"**
3. Cliquer sur **"Run workflow"**
4. Choisir la branche: `develop`
5. Choisir l'action: `update`
6. Cliquer sur **"Run workflow"**

---

## ÉTAPE 10: MAINTENANCE & OPÉRATIONS COURANTES

### 10.1 Voir les Logs en Direct

```bash
# Se connecter au serveur
ssh ovh-preprod
cd /opt/saas-boilerplate

# Logs backend en temps réel
sudo docker-compose logs -f backend

# Logs de tous les services
sudo docker-compose logs -f

# Logs uniquement erreurs
sudo docker-compose logs --tail=100 | grep -i error
```

### 10.2 Redémarrer un Service

```bash
# Sur le serveur
cd /opt/saas-boilerplate

# Redémarrer le backend
sudo docker-compose restart backend

# Redémarrer tous les services
sudo docker-compose restart
```

### 10.3 Mettre à Jour l'Application

**Option A - Via Git (recommandé)**:
```bash
# Sur votre machine locale
git checkout develop
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin develop
# → GitHub Actions déploie automatiquement
```

**Option B - Via Script Manuel**:
```bash
# Sur votre machine locale
./scripts/deploy-preprod.sh --update
```

### 10.4 Rollback en Cas de Problème

```bash
# Sur votre machine locale
./scripts/deploy-preprod.sh --rollback
```

### 10.5 Créer un Backup Manuel

```bash
# Se connecter au serveur
ssh ovh-preprod
cd /opt/saas-boilerplate

# Créer un backup de la base de données
sudo docker-compose exec -T postgres pg_dump -U saas_user saas_boilerplate_preprod | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Vérifier
ls -lh backup-*.sql.gz
```

### 10.6 Restaurer un Backup

```bash
# Sur le serveur
cd /opt/saas-boilerplate

# Lister les backups disponibles
ls -lt backups/

# Restaurer (remplacer la date par le backup voulu)
gunzip -c backups/20250126_120000_saas_boilerplate_preprod.sql.gz | \
  sudo docker-compose exec -T postgres psql -U saas_user saas_boilerplate_preprod
```

### 10.7 Vérifier les Ressources Système

```bash
# Sur le serveur
ssh ovh-preprod

# Utilisation CPU/RAM en temps réel
htop

# Espace disque
df -h

# Utilisation Docker
docker stats

# Voir les processus
ps aux | grep node
```

---

## ✅ CHECKLIST FINALE

Cocher au fur et à mesure:

### Serveur OVH
- [ ] VPS commandé et accessible
- [ ] Connexion SSH fonctionne avec clé publique
- [ ] Utilisateur 'deploy' créé et configuré
- [ ] Firewall UFW activé (ports 22, 80, 443)
- [ ] Docker et Docker Compose installés

### DNS & Domaine
- [ ] Enregistrement A pour preprod-api.votredomaine.com
- [ ] Enregistrement A pour grafana.preprod.votredomaine.com
- [ ] DNS propagés (dig retourne l'IP)

### Secrets & Configuration
- [ ] Tous les secrets générés (JWT, passwords)
- [ ] Fichier .env.preprod configuré localement
- [ ] Secrets sauvegardés dans un gestionnaire de mots de passe

### Déploiement
- [ ] Script deploy-preprod.sh exécuté avec succès
- [ ] Tous les conteneurs Docker sont "Up (healthy)"
- [ ] Certificats SSL obtenus et valides
- [ ] Migrations de base de données appliquées

### Vérifications
- [ ] https://preprod-api.votredomaine.com/health retourne "ok"
- [ ] https://preprod-api.votredomaine.com/api/docs accessible
- [ ] https://grafana.preprod.votredomaine.com accessible
- [ ] Cadenas vert SSL dans le navigateur

### CI/CD
- [ ] Secrets GitHub Actions configurés
- [ ] Push sur develop déclenche le déploiement
- [ ] Workflow GitHub Actions fonctionne

### Monitoring
- [ ] Grafana affiche des métriques
- [ ] Prometheus collecte les données
- [ ] Logs accessibles et compréhensibles

---

## 🎉 FÉLICITATIONS!

Votre plateforme SaaS est maintenant **déployée en production** sur OVH!

### Prochaines Étapes Recommandées

1. **Configurer les alertes Grafana** pour être notifié des problèmes
2. **Tester les performances** avec un outil de load testing
3. **Configurer Sentry** pour le monitoring des erreurs
4. **Ajouter des tests E2E** pour valider les déploiements
5. **Documenter** pour votre équipe

### Ressources Utiles

- 📚 Documentation complète: `DEPLOYMENT_OVH.md`
- 🔧 Troubleshooting: Voir section dans DEPLOYMENT_OVH.md
- 💬 Support OVH: https://help.ovhcloud.com/

---

**Besoin d'aide?** N'hésitez pas à demander! 🚀
