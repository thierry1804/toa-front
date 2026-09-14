# Login Page ISO Logos + Title (R-01 / R-02) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher les logos ISO 45001/14001 en WebP sous la carte de connexion, et renommer le titre via i18n.

**Architecture:** Assets sources hors repo convertis en WebP dans `public/images/`. UI limitée à `LoginPage.tsx` + clés `auth.title` dans `fr.json` / `mg.json`. Aucun nouveau composant.

**Tech Stack:** React 19, Vite, react-i18next, sharp (conversion WebP one-shot via Node)

**Spec:** `docs/superpowers/specs/2026-09-14-login-iso-logos-design.md`

## Global Constraints

- Logos livrés uniquement en `.webp` dans `public/images/` (pas de JPG/PNG ISO)
- Emplacement logos : sous la `Card`, conteneur `max-w-md`
- Titre FR exact : `Gestion de plan de prévention et permis`
- Clé i18n : `auth.title`
- Ne pas toucher R-03+ ni le logo TOA

## File map

| Fichier | Rôle |
|---|---|
| `public/images/logo-iso-45001.webp` | Asset ISO 45001 (créé) |
| `public/images/logo-iso-14001.webp` | Asset ISO 14001 (créé) |
| `src/pages/auth/LoginPage.tsx` | Titre i18n + bloc logos |
| `src/lib/locales/fr.json` | `auth.title` FR |
| `src/lib/locales/mg.json` | `auth.title` MG |

---

### Task 1: Convertir les logos en WebP

**Files:**
- Create: `public/images/logo-iso-45001.webp`
- Create: `public/images/logo-iso-14001.webp`
- Sources (lecture seule, hors repo) :
  - `D:\TOA\retours\LOGO ISO 45001.jpg`
  - `D:\TOA\retours\LOGOISO 14001.png`

**Interfaces:**
- Consumes: fichiers source JPG/PNG
- Produces: chemins publics `/images/logo-iso-45001.webp` et `/images/logo-iso-14001.webp`

- [x] **Step 1: Convertir avec sharp (one-shot Node)**

Run from repo root (`D:\TOA\toa-front`) :

```bash
node -e "const sharp=require('sharp'); const path=require('path'); Promise.all([sharp('D:/TOA/retours/LOGO ISO 45001.jpg').webp({quality:85}).toFile('public/images/logo-iso-45001.webp'), sharp('D:/TOA/retours/LOGOISO 14001.png').webp({quality:85}).toFile('public/images/logo-iso-14001.webp')]).then(()=>console.log('webp-ok')).catch(e=>{console.error(e); process.exit(1)})"
```

Expected: `webp-ok` and two files under `public/images/`.

- [x] **Step 2: Vérifier présence et taille**

```powershell
Get-ChildItem public/images/logo-iso-*.webp | Format-Table Name, Length
```

Expected: `logo-iso-45001.webp` and `logo-iso-14001.webp`, each Length > 0. No `.jpg`/`.png` ISO copies in `public/images/`.

- [x] **Step 3: Commit**

```bash
git add public/images/logo-iso-45001.webp public/images/logo-iso-14001.webp
git commit -m "$(cat <<'EOF'
feat(auth): add ISO logos as WebP assets

EOF
)"
```

---

### Task 2: i18n du titre (R-02)

**Files:**
- Modify: `src/lib/locales/fr.json` (bloc `auth`)
- Modify: `src/lib/locales/mg.json` (bloc `auth`)

**Interfaces:**
- Consumes: structure existante `auth.*`
- Produces: `auth.title` string in FR and MG

- [x] **Step 1: Ajouter `auth.title` en français**

Dans `src/lib/locales/fr.json`, dans l’objet `"auth"`, ajouter immédiatement après `"login"` :

```json
"title": "Gestion de plan de prévention et permis",
```

Le début du bloc doit ressembler à :

```json
"auth": {
  "login": "Connexion",
  "title": "Gestion de plan de prévention et permis",
  "logout": "Déconnexion",
```

- [ ] **Step 2: Ajouter `auth.title` en malgache**

Dans `src/lib/locales/mg.json`, même emplacement :

```json
"title": "Fitantanana ny drafitra fisorohana sy ny fahazoan-dàlana",
```

- [ ] **Step 3: Valider le JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/lib/locales/fr.json','utf8')); JSON.parse(require('fs').readFileSync('src/lib/locales/mg.json','utf8')); console.log('json-ok')"
```

Expected: `json-ok`

- [ ] **Step 4: Commit**

```bash
git add src/lib/locales/fr.json src/lib/locales/mg.json
git commit -m "$(cat <<'EOF'
feat(auth): add i18n key for login page title

EOF
)"
```

---

### Task 3: Mettre à jour LoginPage (titre + logos)

**Files:**
- Modify: `src/pages/auth/LoginPage.tsx`

**Interfaces:**
- Consumes: `t('auth.title')`, `/images/logo-iso-45001.webp`, `/images/logo-iso-14001.webp`
- Produces: UI login avec titre traduit et logos sous la Card

- [ ] **Step 1: Remplacer le titre hardcodé**

Remplacer :

```tsx
<CardDescription className="text-2xl font-semibold leading-none tracking-tight text-gray-900">
  Plateforme de gestion HSE
</CardDescription>
```

par :

```tsx
<CardDescription className="text-2xl font-semibold leading-none tracking-tight text-gray-900">
  {t("auth.title")}
</CardDescription>
```

- [ ] **Step 2: Ajouter le bloc logos sous la Card**

Juste après `</Card>` (toujours dans le `div` `w-full max-w-md`), ajouter :

```tsx
<div className="mt-6 flex flex-wrap items-center justify-center gap-6">
  <img
    src="/images/logo-iso-45001.webp"
    alt="ISO 45001"
    className="h-14 w-auto object-contain"
  />
  <img
    src="/images/logo-iso-14001.webp"
    alt="ISO 14001"
    className="h-14 w-auto object-contain"
  />
</div>
```

Ne pas modifier le logo TOA ni le reste du formulaire.

- [ ] **Step 3: Vérifier manuellement**

Run: `npm run dev`  
Ouvrir `/login` (ou la route d’entrée).

Expected:
- Titre = « Gestion de plan de prévention et permis »
- Toggle FR/MG change le titre
- Deux logos visibles sous la carte, côte à côte
- Pas d’erreur 404 sur les `.webp`

- [ ] **Step 4: Commit**

```bash
git add src/pages/auth/LoginPage.tsx
git commit -m "$(cat <<'EOF'
feat(auth): show ISO logos and renamed login title

EOF
)"
```

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|---|---|
| Logos sous la Card, max-w-md | Task 3 |
| WebP only in public/ | Task 1 |
| Fichiers `logo-iso-45001.webp` / `logo-iso-14001.webp` | Task 1 |
| alt ISO 45001 / 14001, h-14 | Task 3 |
| Titre FR exact + `auth.title` FR/MG | Task 2 + 3 |
| Hors scope TOA / R-03+ | respecté |
