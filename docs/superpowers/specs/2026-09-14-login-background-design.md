# Login — fond vectoriel pylônes/paysage + inputs blancs

**Date :** 2026-09-14  
**Repo :** `toa-front`  
**Statut :** design validé (silhouette discrète)

## Objectifs

1. Remplacer le fond blanc de la page de connexion par une scène vectorielle discrète (ciel clair, collines, pylônes).
2. Forcer le fond blanc des champs email / mot de passe sur la page login.

## Décisions

| Point | Choix |
|---|---|
| Style | Vector réaliste (pylônes treillis, collines, arbres, lignes) |
| Haut de page | Blanc (`#ffffff`), paysage concentré en bas |
| Asset | `login-bg.svg` (source) + `login-bg.webp` (rendu page) |
| Page root | `bg-white` |
| Inputs | `className="bg-white"` sur les deux `Input` de `LoginPage.tsx` uniquement |
| Composant `Input` global | Non modifié |

## Palette (alignée logo TOA)

- Ciel : `#f1fafe` (blue-50)
- Collines : `#dff3fc` / `#bae6f8` à faible saturation
- Traits pylônes : `#107198` / `#94959a`, traits fins

## Hors scope

- Animation, photo, dark mode
- Changement de style de la `Card` grise
- Modification du composant `Input` partagé

## Implémentation (aperçu)

1. Créer `public/images/login-bg.svg`.
2. Dans `LoginPage.tsx` : retirer `bg-white` du root, ajouter la couche fond SVG.
3. Ajouter `bg-white` aux inputs email et password.
4. Vérifier desktop + mobile : logos et carte restent lisibles.
