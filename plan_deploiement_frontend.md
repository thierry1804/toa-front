# Plan de Déploiement - Frontend TOA Platform

Ce document est destiné à l'équipe DevOps. Il décrit l'architecture, la conteneurisation et les recommandations de déploiement pour l'application Frontend React (Vite) du projet TOA Platform.

---

## 1. Vue d'ensemble de l'architecture

Le frontend est une **Single Page Application (SPA)** développée avec **React 19** et **Vite**. 
L'application doit être servie par un serveur web statique. Nous utilisons **Nginx** pour servir les fichiers compilés et rediriger toutes les requêtes vers `index.html` afin que le routeur frontend (React Router) gère la navigation.

### Processus de build (Multi-stage Docker)
1. **Étape de Build (`node:22-alpine`)** : Installation des dépendances (`npm ci`) et compilation de l'application (`npm run build`). Les variables d'environnement sont injectées à cette étape.
2. **Étape d'Exécution (`nginx:stable-alpine`)** : Les assets statiques générés (dossier `dist/`) sont copiés vers le serveur Nginx configuré pour une SPA.

---

## 2. Variables d'Environnement (Build-Time)

Contrairement à un backend, les variables d'environnement dans une application Vite sont **injectées au moment du build**. Elles doivent être passées via des `build-args` lors de la création de l'image Docker.

| Variable | Description | Obligatoire | Exemple de valeur |
| :--- | :--- | :---: | :--- |
| `VITE_API_URL` | URL de base de l'API Backend (Symfony) | Oui | `https://api.toa.example.com` |
| `VITE_MERCURE_URL` | URL du hub Mercure pour les WebSockets/SSE | Oui | `https://mercure.toa.example.com/.well-known/mercure` |
| `VITE_APP_NAME` | Nom de l'application affiché | Non | `TOA Platform` |

> **Attention :** Toute modification d'une variable d'environnement nécessite un **rebuild complet** de l'image Docker, car les variables sont inscrites en dur dans les fichiers JS minifiés par Vite.

---

## 3. Configuration Docker

Les fichiers nécessaires (`Dockerfile`, `.dockerignore`, `docker-compose.yml`, `nginx.conf`) ont été vérifiés et sont présents à la racine du projet frontend.

### Fichier `.dockerignore`
Évite de copier les dossiers volumineux ou inutiles (comme `node_modules/` ou `.git/`) afin d'optimiser le contexte de build Docker.

### Configuration Nginx (`nginx.conf`)
Le fichier de configuration embarqué optimise la livraison du frontend :
- **Routage SPA** : `try_files $uri $uri/ /index.html;` (redirige les erreurs 404 vers `index.html`).
- **Compression** : Gzip est activé pour les CSS, JS, JSON et SVG afin de réduire le temps de chargement.
- **Mise en cache** : Les ressources statiques sous `/assets/` (fichiers avec hash générés par Vite) sont mises en cache côté navigateur pour 1 an (`Cache-Control "public, immutable"`).

---

## 4. Déploiement Local / Staging (Docker Compose)

Pour un déploiement sur un serveur de pre-production, voici l'extrait `docker-compose.yml` utilisé :

```yaml
services:
  frontend:
    build:
      context: .
      args:
        VITE_API_URL: ${VITE_API_URL:-http://localhost:8000}
        VITE_MERCURE_URL: ${VITE_MERCURE_URL:-http://localhost:3001/.well-known/mercure}
        VITE_APP_NAME: ${VITE_APP_NAME:-TOA Platform}
    ports:
      - "8080:80"
    restart: unless-stopped
```

---

## 5. Recommandations de Déploiement Kubernetes (Production)

Pour un environnement hautement disponible, voici les recommandations de ressources :

### Allocation des Ressources

| Métrique | Request | Limit |
| :--- | :--- | :--- |
| **CPU** | 50m | 200m |
| **Mémoire** | 64Mi | 256Mi |

*(Nginx servant des fichiers statiques est très peu gourmand en ressources).*

### Extrait de Manifest Kubernetes (`Deployment` et `Service`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: toa-frontend
  namespace: toa
spec:
  replicas: 2 # Minimum 2 pour la haute disponibilité
  selector:
    matchLabels:
      app: toa-frontend
  template:
    metadata:
      labels:
        app: toa-frontend
    spec:
      containers:
        - name: frontend
          image: registry.toa.example.com/toa-frontend:<TAG>
          ports:
            - containerPort: 80
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "256Mi"
              cpu: "200m"
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 15
---
apiVersion: v1
kind: Service
metadata:
  name: toa-frontend
  namespace: toa
spec:
  selector:
    app: toa-frontend
  ports:
    - port: 80
      targetPort: 80
```

---

## 6. Checklist de Déploiement DevOps

- [ ] S'assurer que le pipeline CI/CD injecte correctement les variables `VITE_*` lors de l'exécution de `docker build --build-arg ...`.
- [ ] Pousser l'image compilée sur le registre de conteneurs (`registry.toa.example.com`).
- [ ] Vérifier la configuration du **Load Balancer / Ingress Controller** :
  - Il doit gérer le certificat TLS (HTTPS).
  - Il doit pointer vers le service `toa-frontend` sur le port 80.
- [ ] Confirmer que l'URL pointée par `VITE_API_URL` ne causera pas d'erreur **CORS** (le backend Symfony doit avoir l'URL du frontend ajoutée à ses origines autorisées).
