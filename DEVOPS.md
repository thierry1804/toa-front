# TOA Platform — Plan de Déploiement Complet

## Architecture générale

```
                           ┌──────────────┐
                           │   Ingress /   │
                           │  Load Balancer│
                           │   (TLS/443)   │
                           └──────┬───────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
              ┌─────▼─────┐ ┌────▼────┐ ┌──────▼──────┐
              │ Frontend  │ │ Backend │ │  Mercure    │
              │  Nginx    │ │ Nginx   │ │   Hub       │
              │  (SPA)    │ │ PHP-FPM │ │  (WS/SSE)   │
              │  :80      │ │ :80     │ │  :3001      │
              └───────────┘ └────┬────┘ └─────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
              ┌─────▼─────┐ ┌───▼────┐ ┌─────▼──────┐
              │ PostgreSQL│ │ Redis  │ │   Volumes   │
              │   :5432   │ │ :6379  │ │ (logs, etc) │
              └───────────┘ └────────┘ └─────────────┘
```

---

## 1. Frontend (React SPA)

### Dockerfile

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG VITE_API_URL
ARG VITE_MERCURE_URL
ARG VITE_APP_NAME
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MERCURE_URL=$VITE_MERCURE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
RUN npm run build

FROM nginx:stable-alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf (embarqué)

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 256;

    location / {
        try_files $uri $uri/ /index.html;
    }
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Build-args

| Variable | Obligatoire | Exemple |
|---|---|---|
| `VITE_API_URL` | Oui | `https://api.toa.example.com` |
| `VITE_MERCURE_URL` | Oui | `https://mercure.toa.example.com/.well-known/mercure` |
| `VITE_APP_NAME` | Non | `TOA Platform` |

### Ressources conteneur

| Métrique | Request | Limit |
|---|---|---|
| CPU | 50m | 200m |
| Mémoire | 64Mi | 256Mi |

---

## 2. Backend (Symfony + API Platform)

### Dockerfile (à créer côté backend)

```dockerfile
# ---- Build ----
FROM php:8.3-fpm-alpine AS build

RUN apk add --no-cache $PHPIZE_DEPS \
    && pecl install apcu \
    && docker-php-ext-enable apcu

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY composer.json composer.lock symfony.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY . .
RUN mkdir -p var/cache var/log && chmod -R 777 var/

# ---- Prod ----
FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
        postgresql-dev \
        $PHPIZE_DEPS \
    && docker-php-ext-install pdo_pgsql opcache \
    && pecl install apcu redis \
    && docker-php-ext-enable apcu redis opcache

COPY --from=build /app /app
COPY php.ini /usr/local/etc/php/conf.d/app.ini

WORKDIR /app
EXPOSE 9000
CMD ["php-fpm"]
```

### Nginx backend (reverse proxy vers PHP-FPM)

```nginx
server {
    listen 80;
    server_name api.toa.example.com;
    root /app/public;

    location / {
        try_files $uri /index.php$is_args$args;
    }

    location ~ ^/index\.php(/|$) {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        internal;
    }

    location ~ \.php$ {
        return 404;
    }
}
```

### Extensions PHP requises

| Extension | Rôle |
|---|---|
| `pdo_pgsql` | Connexion PostgreSQL |
| `apcu` | Cache Symfony |
| `redis` | Sessions / Cache Redis |
| `opcache` | Accélération PHP |
| `intl` | ICU (requis par Symfony) |

### Variables d'environnement backend

| Variable | Obligatoire | Exemple |
|---|---|---|
| `DATABASE_URL` | Oui | `postgresql://toa:password@postgres:5432/toa?charset=utf8` |
| `REDIS_URL` | Oui (si Redis) | `redis://redis:6379` |
| `JWT_SECRET_KEY` | Oui | `%kernel.project_dir%/config/jwt/private.pem` |
| `JWT_PUBLIC_KEY` | Oui | `%kernel.project_dir%/config/jwt/public.pem` |
| `JWT_PASSPHRASE` | Oui | `your-passphrase` |
| `MERCURE_URL` | Oui | `http://mercure:3001/.well-known/mercure` |
| `MERCURE_JWT_TOKEN` | Oui | Token JWT pour publisher Mercure |
| `CORS_ALLOW_ORIGIN` | Oui | `^https?://app\.toa\.example\.com$` |
| `APP_ENV` | Oui | `prod` |
| `APP_SECRET` | Oui | Chaîne aléatoire (32+ chars) |
| `TRUSTED_PROXIES` | Oui | `127.0.0.1,10.0.0.0/8` |

### Ressources conteneur

| Métrique | Request | Limit |
|---|---|---|
| CPU | 200m | 500m |
| Mémoire | 256Mi | 512Mi |

---

## 3. PostgreSQL

### Configuration

| Paramètre | Valeur |
|---|---|
| Image | `postgres:16-alpine` |
| Port | 5432 |
| Volume | `pgdata:/var/lib/postgresql/data` |
| Auth | `POSTGRES_PASSWORD` via secret |

### Variables

| Variable | Description |
|---|---|
| `POSTGRES_DB` | `toa` |
| `POSTGRES_USER` | `toa` |
| `POSTGRES_PASSWORD` | Mot de passe (secret) |

### Ressources

| Métrique | Request | Limit |
|---|---|---|
| CPU | 200m | 1 |
| Mémoire | 256Mi | 1Gi |

### Persistance

- Volume PVC `pgdata` : 10Gi minimum
- Backup quotidien (pg_dump) vers un stockage externe (S3, etc.)
- Backup WAL pour PITR si nécessaire

---

## 4. Redis

| Paramètre | Valeur |
|---|---|
| Image | `redis:7-alpine` |
| Port | 6379 |
| Volume facultatif | `/data` (persistance AOF/RDB si activée) |
| Command | `redis-server --save 60 1000 --appendonly yes` |

### Ressources

| Métrique | Request | Limit |
|---|---|---|
| CPU | 50m | 200m |
| Mémoire | 64Mi | 256Mi |

---

## 5. Mercure Hub

| Paramètre | Valeur |
|---|---|
| Image | `dunglas/mercure:stable` |
| Port | 3001 (HTTP) / 443 (HTTPS) |
| Health | `/.well-known/mercure/health` |

### Variables

| Variable | Description |
|---|---|
| `MERCURE_PUBLISHER_JWT_KEY` | Clé secrète JWT (signer les publications) |
| `MERCURE_SUBSCRIBER_JWT_KEY` | Clé secrète JWT (signer les souscriptions) |
| `ALLOWED_ORIGINS` | `https://app.toa.example.com` |

### Ressources

| Métrique | Request | Limit |
|---|---|---|
| CPU | 50m | 100m |
| Mémoire | 32Mi | 128Mi |

---

## 6. docker-compose.yml (Stack complète)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: toa
      POSTGRES_USER: toa
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U toa"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --save 60 1000 --appendonly yes
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  mercure:
    image: dunglas/mercure:stable
    environment:
      MERCURE_PUBLISHER_JWT_KEY: ${MERCURE_JWT_SECRET}
      MERCURE_SUBSCRIBER_JWT_KEY: ${MERCURE_JWT_SECRET}
      ALLOWED_ORIGINS: https://app.toa.example.com
    ports:
      - "3001:3001"
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3001/.well-known/mercure/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  backend:
    build: ./api
    environment:
      APP_ENV: prod
      APP_SECRET: ${APP_SECRET}
      DATABASE_URL: postgresql://toa:${DB_PASSWORD}@postgres:5432/toa?charset=utf8
      REDIS_URL: redis://redis:6379
      JWT_SECRET_KEY: /app/config/jwt/private.pem
      JWT_PUBLIC_KEY: /app/config/jwt/public.pem
      JWT_PASSPHRASE: ${JWT_PASSPHRASE}
      MERCURE_URL: http://mercure:3001/.well-known/mercure
      MERCURE_JWT_TOKEN: ${MERCURE_JWT_TOKEN}
      CORS_ALLOW_ORIGIN: ^https?://app\.toa\.example\.com$
      TRUSTED_PROXIES: "127.0.0.1,10.0.0.0/8"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - backend_private:/app/config/jwt:ro
    restart: unless-stopped

  backend-nginx:
    image: nginx:stable-alpine
    volumes:
      - ./nginx-backend.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - backend
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: https://api.toa.example.com
        VITE_MERCURE_URL: https://mercure.toa.example.com/.well-known/mercure
        VITE_APP_NAME: TOA Platform
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
  backend_private:
```

---

## 7. Kubernetes (Déploiement complet)

### Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: toa
```

### Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: toa-env
  namespace: toa
type: Opaque
stringData:
  DB_PASSWORD: "your-strong-password"
  APP_SECRET: "your-32-char-app-secret"
  JWT_PASSPHRASE: "your-jwt-passphrase"
  MERCURE_JWT_SECRET: "your-mercure-jwt-secret"
  MERCURE_JWT_TOKEN: "your-mercure-publisher-token"
```

### Frontend

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: toa
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: registry.toa.example.com/toa-frontend:latest
          ports:
            - containerPort: 80
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "256Mi"
              cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: toa
spec:
  selector:
    app: frontend
  ports:
    - port: 80
```

### Backend

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: toa
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: php-fpm
          image: registry.toa.example.com/toa-backend:latest
          env:
            - name: APP_ENV
              value: "prod"
            - name: DATABASE_URL
              value: "postgresql://toa:$(DB_PASSWORD)@postgres:5432/toa?charset=utf8"
            - name: REDIS_URL
              value: "redis://redis:6379"
            - name: MERCURE_URL
              value: "http://mercure:3001/.well-known/mercure"
            - name: CORS_ALLOW_ORIGIN
              value: "^https?://app\\.toa\\.example\\.com$"
            - name: TRUSTED_PROXIES
              value: "127.0.0.1,10.0.0.0/8"
          envFrom:
            - secretRef:
                name: toa-env
          ports:
            - containerPort: 9000
          resources:
            requests:
              memory: "256Mi"
              cpu: "200m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          volumeMounts:
            - name: jwt-keys
              mountPath: /app/config/jwt
              readOnly: true
      volumes:
        - name: jwt-keys
          secret:
            secretName: toa-jwt-keys
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-nginx
  namespace: toa
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend-nginx
  template:
    metadata:
      labels:
        app: backend-nginx
    spec:
      containers:
        - name: nginx
          image: nginx:stable-alpine
          volumeMounts:
            - name: config
              mountPath: /etc/nginx/conf.d/default.conf
              subPath: default.conf
          ports:
            - containerPort: 80
      volumes:
        - name: config
          configMap:
            name: backend-nginx-conf
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: toa
spec:
  selector:
    app: backend-nginx
  ports:
    - port: 80
```

### PostgreSQL

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: toa
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          env:
            - name: POSTGRES_DB
              value: "toa"
            - name: POSTGRES_USER
              value: "toa"
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: toa-env
                  key: DB_PASSWORD
          ports:
            - containerPort: 5432
          resources:
            requests:
              memory: "256Mi"
              cpu: "200m"
            limits:
              memory: "1Gi"
              cpu: "1"
          volumeMounts:
            - name: pgdata
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: pgdata
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: toa
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
```

### Redis

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: toa
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          command: ["redis-server", "--save", "60", "1000", "--appendonly", "yes"]
          ports:
            - containerPort: 6379
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "256Mi"
              cpu: "200m"
          volumeMounts:
            - name: redisdata
              mountPath: /data
      volumes:
        - name: redisdata
          persistentVolumeClaim:
            claimName: redisdata
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: toa
spec:
  selector:
    app: redis
  ports:
    - port: 6379
```

### Mercure

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mercure
  namespace: toa
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mercure
  template:
    metadata:
      labels:
        app: mercure
    spec:
      containers:
        - name: mercure
          image: dunglas/mercure:stable
          env:
            - name: MERCURE_PUBLISHER_JWT_KEY
              valueFrom:
                secretKeyRef:
                  name: toa-env
                  key: MERCURE_JWT_SECRET
            - name: MERCURE_SUBSCRIBER_JWT_KEY
              valueFrom:
                secretKeyRef:
                  name: toa-env
                  key: MERCURE_JWT_SECRET
            - name: ALLOWED_ORIGINS
              value: "https://app.toa.example.com"
          ports:
            - containerPort: 3001
          resources:
            requests:
              memory: "32Mi"
              cpu: "50m"
            limits:
              memory: "128Mi"
              cpu: "100m"
---
apiVersion: v1
kind: Service
metadata:
  name: mercure
  namespace: toa
spec:
  selector:
    app: mercure
  ports:
    - port: 3001
```

### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: toa
  namespace: toa
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - app.toa.example.com
        - api.toa.example.com
        - mercure.toa.example.com
      secretName: toa-tls
  rules:
    - host: app.toa.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
    - host: api.toa.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 80
    - host: mercure.toa.example.com
      http:
        paths:
          - path: /.
            pathType: Prefix
            backend:
              service:
                name: mercure
                port:
                  number: 3001
```

---

## 8. CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy TOA Platform

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4

      - name: Build & push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: registry.toa.example.com/toa-frontend:${{ github.sha }}
          build-args: |
            VITE_API_URL=${{ vars.VITE_API_URL }}
            VITE_MERCURE_URL=${{ vars.VITE_MERCURE_URL }}
            VITE_APP_NAME=TOA Platform

      - name: Build & push backend
        uses: docker/build-push-action@v5
        with:
          context: ./api
          push: true
          tags: registry.toa.example.com/toa-backend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to K8s
        run: |
          kubectl set image deployment/frontend frontend=registry.toa.example.com/toa-frontend:${{ github.sha }} -n toa
          kubectl set image deployment/backend php-fpm=registry.toa.example.com/toa-backend:${{ github.sha }} -n toa
          kubectl rollout status deployment/frontend -n toa
          kubectl rollout status deployment/backend -n toa
```

---

## 9. Checklist pré-déploiement

- [ ] Générer les clés JWT (`openssl genrsa -out private.pem 4096` + `openssl rsa -pubout -in private.pem -out public.pem`)
- [ ] Créer le secret K8s contenant les clés JWT et les mots de passe
- [ ] Configurer les DNS : `app.toa.example.com` ➜ IP, `api.toa.example.com` ➜ IP, `mercure.toa.example.com` ➜ IP
- [ ] Installer cert-manager et l'issuer Let's Encrypt (pour TLS automatique)
- [ ] Vérifier que le Ingress Controller (nginx-ingress) est déployé
- [ ] Configurer le Stockage (StorageClass) pour les PVC PostgreSQL et Redis
- [ ] Exécuter les migrations Symfony (`kubectl exec deploy/backend -- php bin/console doctrine:migrations:migrate --no-interaction`)
- [ ] Charger les données initiales (fixtures) si nécessaire
- [ ] Vérifier les CORS backend (autoriser le domaine frontend)
- [ ] Configurer les healthchecks et readiness probes
- [ ] Tester le flux complet : login → CRUD → permissions → notifications temps réel

---

## 10. Maintenance

| Tâche | Fréquence | Commande |
|---|---|---|
| Backup PostgreSQL | Quotidien | `pg_dump -U toa toa > backup_$(date +%F).sql` |
| Backup Redis | Quotidien | `redis-cli SAVE && cp /data/dump.rdb backup.rdb` |
| Rotation logs | Hebdomadaire | Logrotate ou stdout du conteneur |
| Mise à jour Symfony | Mensuel | `composer update` + rebuild image |
| Mise à jour dépendances frontend | Mensuel | `npm update` + rebuild image |
| Rotations des clés JWT | 6 mois | Regénérer les paires de clés et redéployer |
