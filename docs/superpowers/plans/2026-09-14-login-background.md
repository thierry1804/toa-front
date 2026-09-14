# Login Background + White Inputs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un fond SVG discret (ciel, collines, pylônes) sur la page login et forcer les champs texte en blanc.

**Architecture:** Asset SVG statique dans `public/images/`, couche décorative absolue dans `LoginPage.tsx`. Fond blanc des inputs via `className` local uniquement.

**Tech Stack:** React, Tailwind, SVG

**Spec:** `docs/superpowers/specs/2026-09-14-login-background-design.md`

## Global Constraints

- Style silhouette discrète, opacité ~0.4–0.5
- Palette bleu TOA (`#f1fafe`, `#dff3fc`, `#bae6f8`, `#107198`) + gris `#94959a`
- Ne pas modifier le composant `Input` partagé
- `pointer-events-none` + `aria-hidden` sur le fond
- Ne pas toucher aux logos / titre déjà en place

## File map

| Fichier | Rôle |
|---|---|
| `public/images/login-bg.svg` | Scène vectorielle (créé) |
| `src/pages/auth/LoginPage.tsx` | Couche fond + `bg-white` sur inputs |

---

### Task 1: Créer le SVG de fond

**Files:**
- Create: `public/images/login-bg.svg`

**Interfaces:**
- Consumes: — 
- Produces: URL publique `/images/login-bg.svg`

- [ ] **Step 1: Écrire le SVG**

Créer `public/images/login-bg.svg` avec ce contenu exact :

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f1fafe"/>
      <stop offset="100%" stop-color="#dff3fc"/>
    </linearGradient>
  </defs>
  <rect width="1440" height="900" fill="url(#sky)"/>
  <!-- Collines arrière -->
  <path fill="#bae6f8" fill-opacity="0.55" d="M0 620 C180 560 320 580 480 600 C700 630 860 540 1080 580 C1240 610 1360 590 1440 570 L1440 900 L0 900 Z"/>
  <!-- Collines avant -->
  <path fill="#87d3f3" fill-opacity="0.35" d="M0 700 C200 650 360 680 520 710 C740 750 920 660 1140 700 C1280 725 1380 710 1440 700 L1440 900 L0 900 Z"/>
  <!-- Pylône gauche -->
  <g stroke="#107198" stroke-width="2" fill="none" stroke-opacity="0.45">
    <path d="M220 720 L220 480"/>
    <path d="M200 520 L240 520 M190 560 L250 560 M185 600 L255 600 M180 640 L260 640"/>
    <path d="M200 520 L180 480 M240 520 L260 480"/>
    <path d="M180 480 L260 480"/>
    <path d="M195 720 L220 640 M245 720 L220 640"/>
  </g>
  <g stroke="#94959a" stroke-width="1.5" fill="none" stroke-opacity="0.5">
    <path d="M180 480 C120 500 80 540 40 580"/>
    <path d="M260 480 C340 510 400 560 460 620"/>
  </g>
  <!-- Pylône centre-droit -->
  <g stroke="#107198" stroke-width="2" fill="none" stroke-opacity="0.4">
    <path d="M980 740 L980 420"/>
    <path d="M955 470 L1005 470 M945 520 L1015 520 M940 570 L1020 570 M935 620 L1025 620 M930 670 L1030 670"/>
    <path d="M955 470 L930 420 M1005 470 L1030 420"/>
    <path d="M930 420 L1030 420"/>
    <path d="M950 740 L980 670 M1010 740 L980 670"/>
  </g>
  <g stroke="#94959a" stroke-width="1.5" fill="none" stroke-opacity="0.45">
    <path d="M930 420 C820 460 740 540 680 620"/>
    <path d="M1030 420 C1140 470 1240 540 1340 600"/>
  </g>
  <!-- Petit pylône loin -->
  <g stroke="#107198" stroke-width="1.5" fill="none" stroke-opacity="0.3">
    <path d="M620 680 L620 540"/>
    <path d="M605 570 L635 570 M600 610 L640 610 M595 650 L645 650"/>
    <path d="M605 570 L590 540 M635 570 L650 540"/>
    <path d="M590 540 L650 540"/>
  </g>
</svg>
```

- [ ] **Step 2: Vérifier l’accès HTTP**

```powershell
Invoke-WebRequest -Uri "http://localhost:5173/images/login-bg.svg" -Method Head | Select-Object StatusCode
```

Expected: `200` (si le dev server tourne). Sinon vérifier que le fichier existe sous `public/images/`.

- [ ] **Step 3: Commit**

```bash
git add public/images/login-bg.svg
git commit -m "feat(auth): add discreet login background SVG"
```

---

### Task 2: Intégrer le fond et blanchir les inputs

**Files:**
- Modify: `src/pages/auth/LoginPage.tsx`

**Interfaces:**
- Consumes: `/images/login-bg.svg`
- Produces: page login avec fond illustré + inputs blancs

- [ ] **Step 1: Remplacer le wrapper root et ajouter la couche fond**

Remplacer l’ouverture du return :

```tsx
    <div
      className="login-page min-h-screen flex flex-col bg-white"
      data-pwa={isPwa ? "true" : "false"}
    >
      <PwaReloadBanner />
      <div className="min-h-0 flex-1 flex items-center justify-center p-4">
```

par :

```tsx
    <div
      className="login-page relative min-h-screen flex flex-col bg-[#f1fafe]"
      data-pwa={isPwa ? "true" : "false"}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-bottom bg-no-repeat opacity-50"
        style={{ backgroundImage: "url(/images/login-bg.svg)" }}
        aria-hidden="true"
      />
      <PwaReloadBanner />
      <div className="relative z-10 min-h-0 flex-1 flex items-center justify-center p-4">
```

- [ ] **Step 2: Ajouter `bg-white` aux deux Input**

Sur l’email :

```tsx
                <Input
                  label={t("auth.email")}
                  type="email"
                  autoComplete="email"
                  placeholder="exemple@toa.mg"
                  error={errors.email?.message}
                  className="bg-white"
                  {...register("email")}
                />
```

Sur le password (garder le reste identique) :

```tsx
                  <Input
                    label={t("auth.password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    error={errors.password?.message}
                    className="bg-white"
                    {...register("password")}
```

- [ ] **Step 3: Vérifier manuellement**

Run: `npm run dev` → `/login`

Expected:
- Fond ciel/collines/pylônes visible derrière la carte
- Champs email/password blancs
- Logos + titre inchangés et lisibles

- [ ] **Step 4: Commit**

```bash
git add src/pages/auth/LoginPage.tsx
git commit -m "feat(auth): apply login SVG background and white inputs"
```

---

## Self-review (plan vs spec)

| Spec | Task |
|---|---|
| SVG login-bg silhouette | Task 1 |
| Couche absolue + opacités | Task 2 |
| Inputs bg-white locaux | Task 2 |
| Input global intact | respecté |
