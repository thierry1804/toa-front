# R-01 + R-02 — Page de connexion (logos ISO + titre)

**Date :** 2026-09-14  
**Repo :** `toa-front`  
**Statut :** design validé

## Objectifs

1. **R-01** — Afficher les logos ISO 45001 et ISO 14001 à droite du logo TOA.
2. **R-02** — Remplacer le titre « Plateforme de gestion HSE » par « Gestion de plan de prévention et permis », via i18n.

## Contexte actuel

- `src/pages/auth/LoginPage.tsx` : logo TOA au-dessus de la `Card` ; titre hardcodé FR à la ligne ~67.
- `public/images/` : uniquement `TOA.png`.
- Assets clients (hors repo) :
  - `D:\TOA\retours\LOGO ISO 45001.jpg`
  - `D:\TOA\retours\LOGOISO 14001.png`
- Source titre : `Retours_Consolides_2026-09-08.md` §2.1 — R-02.

## Décisions

### R-01 — Logos

| Point | Choix |
|---|---|
| Emplacement | Haut du bloc connexion : à gauche du sélecteur de langue (dans le `CardHeader`) |
| Layout | Titre à gauche ; groupe `[ISO 45001] [ISO 14001] [langue]` à droite |
| Logo TOA | Centré au-dessus de la carte, seul |
| Format | Convertir les assets clients en **WebP** (pas de JPG/PNG livrés dans `public/`) |
| Fichiers publics | `logo-iso-45001.webp`, `logo-iso-14001.webp` |
| Conversion | Depuis `retours/LOGO ISO 45001.jpg` et `retours/LOGOISO 14001.png` (qualité visuelle équivalente, compression raisonnable) |
| Taille affichée | ISO ~`h-20` (TOA reste `h-40`), `w-auto`, `object-contain` |
| Accessibilité | `alt="ISO 45001"` / `alt="ISO 14001"` |

### R-02 — Titre

| Point | Choix |
|---|---|
| Ancien texte | `Plateforme de gestion HSE` |
| Nouveau texte (FR) | `Gestion de plan de prévention et permis` |
| Clé i18n | `auth.title` |
| Fichiers | `src/lib/locales/fr.json` + `mg.json` |
| Usage | `t('auth.title')` dans `LoginPage.tsx` |

Traduction MG : équivalent fidèle du nouveau titre FR (même sens métier).

## Hors scope

- Texte décoratif autour des logos
- Modification du logo TOA ou du style de la carte
- Autres retours (R-03+)

## Implémentation (aperçu)

1. Convertir les assets clients en WebP → `public/images/logo-iso-45001.webp` et `logo-iso-14001.webp`.
2. Placer les logos à droite du logo TOA dans `LoginPage.tsx` (src `.webp`).
3. Ajouter `auth.title` en FR/MG ; remplacer le hardcode par `t('auth.title')`.
4. Vérifier desktop + mobile étroit.
