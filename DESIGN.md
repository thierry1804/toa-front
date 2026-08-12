---
name: TOA Platform
description: Console opérationnelle HSE pour TowerCo of Africa Madagascar — permis de travail, plans de prévention, interventions terrain
colors:
  primary: "#2563eb"
  primary-hover: "#1d4ed8"
  primary-tint: "#eff6ff"
  primary-tint-strong: "#dbeafe"
  success: "#16a34a"
  success-tint: "#dcfce7"
  success-text: "#15803d"
  warning: "#ca8a04"
  warning-tint: "#fef9c3"
  warning-text: "#a16207"
  danger: "#dc2626"
  danger-tint: "#fee2e2"
  danger-text: "#b91c1c"
  neutral-bg: "#f9fafb"
  neutral-surface: "#ffffff"
  neutral-border: "#e5e7eb"
  neutral-border-strong: "#d1d5db"
  neutral-text: "#171717"
  neutral-text-muted: "#4b5563"
  neutral-text-faint: "#9ca3af"
typography:
  body:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
  title:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "#e5e7eb"
    textColor: "#111827"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  input-field:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: TOA Platform

## 1. Overview

**Creative North Star: "Le Poste de Contrôle"**

TOA Platform n'est pas un produit de marque, c'est une console opérationnelle : chaque écran doit répondre en premier à "où en est ce dossier, qui peut agir dessus, que faire ensuite". Le système visuel emprunte au poste de contrôle industriel : statuts codés par couleur immédiatement lisibles, densité assumée pour ne pas cacher l'information sous du confort esthétique, zéro décoration qui ne porte pas de sens fonctionnel. Il rejette explicitement le vocabulaire SaaS générique : pas de dégradés d'accent, pas de grilles de cartes icône+titre+texte répétées, pas de glassmorphism, pas de "hero metric" avec gros chiffre et halo dégradé.

La densité est un choix assumé, pas une contrainte technique : les utilisateurs (HSE, CPE, prestataires) travaillent sous obligation réglementaire, souvent dans l'urgence ou sur le terrain avec une connectivité intermittente. Le système doit rester lisible aussi bien sur un écran de bureau chargé de tableaux que sur une tablette en extérieur.

**Key Characteristics:**
- Statuts et permissions toujours visibles avant l'action (badge de statut, pas de couleur seule)
- Surfaces plates au repos ; l'ombre signale exclusivement une interruption (modale, overlay)
- Un seul accent (bleu) porté par les actions primaires et l'état actif de navigation, jamais en décoration
- Composants compacts et denses : le padding sert la quantité d'information visible, pas le confort visuel

## 2. Colors

Palette restreinte : neutres tintés + un accent bleu unique porté par les actions et l'état actif, plus une triade sémantique (succès/avertissement/danger) réservée exclusivement aux statuts métier.

### Primary
- **Bleu Contrôle** (#2563eb): actions primaires (boutons, liens actifs), état actif de navigation (fond `#eff6ff`, texte `#1d4ed8`). Jamais utilisé en décoration ou en fond de section.

### Neutral
- **Brume** (#f9fafb): fond d'application, derrière les surfaces de contenu.
- **Blanc Dossier** (#ffffff): surfaces de contenu — cartes, modales, barre latérale, en-têtes.
- **Trait Discret** (#e5e7eb): bordures par défaut (séparateurs, contours de carte, sidebar).
- **Trait Actif** (#d1d5db): bordures d'input au repos, contours interactifs.
- **Encre** (#171717 / #111827): texte principal.
- **Encre Atténuée** (#4b5563): texte secondaire, labels de formulaire.
- **Encre Fantôme** (#9ca3af): texte désactivé, icônes inactives, placeholders.

### Sémantique statut (rôle, pas décoration)
- **Succès** (#16a34a, fond #dcfce7, texte #15803d): permis validé, plan approuvé, intervention clôturée.
- **Avertissement** (#ca8a04, fond #fef9c3, texte #a16207): en attente de validation, expiration proche.
- **Danger** (#dc2626, fond #fee2e2, texte #b91c1c): refusé, expiré, action destructive.

### Named Rules
**La Règle du Statut Visible.** Un statut métier (validé/en attente/refusé/expiré) ne s'exprime jamais par la couleur seule : toujours badge texte + couleur. La couleur accélère la lecture, elle ne la remplace pas.

**La Règle de l'Accent Unique.** Le bleu est réservé à l'action primaire et à l'état actif de navigation. Aucune autre couleur d'accent, aucun dégradé.

## 3. Typography

**Body Font:** Geist Variable (avec fallback ui-sans-serif, system-ui, sans-serif)

**Character:** Une seule famille sans-serif technique, portée par le poids plutôt que par la taille — la hiérarchie vient du gras et du gris du texte, pas d'une échelle de tailles étendue.

### Hierarchy
- **Title** (600, 18px, 1.3): titres de page, titres de modale.
- **Body** (400, 14px, 1.5): texte courant, contenu de formulaire, cellules de tableau.
- **Label** (500, 12px, 1.4): labels de champ, badges de statut, méta-information (dates, compteurs).

### Named Rules
**La Règle du Gras Fonctionnel.** Le poids 600 est réservé aux titres et aux valeurs qu'on doit repérer en un coup d'œil (montants, statuts). Le poids 400 partout ailleurs.

## 4. Elevation

Système plat par défaut : les surfaces de contenu (cartes, sidebar, en-têtes) reposent sur une bordure fine (`#e5e7eb`), jamais une ombre, pour rester nettes et imprimables. L'ombre est réservée aux couches qui interrompent le flux (modale, drawer) — elle signale "ceci flotte au-dessus du reste", pas "ceci est important".

### Shadow Vocabulary
- **Overlay** (`box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`): modales, drawers, menus contextuels flottants.
- **Flat** (aucune ombre, bordure `1px solid #e5e7eb`): cartes, panneaux, sidebar, en-têtes de page.

### Named Rules
**La Règle du Repos Plat.** Aucune surface au repos ne porte d'ombre. Si un élément a besoin de se détacher visuellement, la réponse est une bordure ou un fond contrasté, pas une ombre décorative.

## 5. Components

Composants compacts et denses : priorité à la quantité d'information visible sur la générosité d'espacement. Aucune animation décorative, seules les transitions d'état (couleur, ouverture/fermeture) sont autorisées.

### Buttons
- **Shape:** coins modérément arrondis (8px, `rounded-lg`)
- **Primary:** fond `#2563eb`, texte blanc, padding compact `8px 16px` (`px-4 py-2`), hover `#1d4ed8`
- **Secondary:** fond `#e5e7eb`, texte `#111827`, même gabarit que primary
- **Danger:** fond `#dc2626`, texte blanc — réservé aux actions destructives (refuser, supprimer, clôturer)
- **Ghost / Outline:** transparent ou bordure `#d1d5db`, texte `#374151` — actions secondaires de faible priorité
- **Hover / Focus:** transition de couleur uniquement (`transition-colors`), anneau de focus 2px décalé (`focus:ring-2 focus:ring-offset-2`)

### Badges (statut)
- **Style:** fond teinté + texte de la même famille sémantique (ex. succès `bg-green-100 text-green-700`), coins arrondis complets ou 6px, jamais de bordure seule comme porteur de sens.
- **State:** un badge = un statut métier explicite en texte, jamais une pastille de couleur nue.

### Cards / Containers
- **Corner Style:** 8-12px (`rounded-lg` / `rounded-xl`)
- **Background:** blanc (#ffffff) sur fond brume (#f9fafb)
- **Shadow Strategy:** aucune au repos (voir Elevation) — bordure `1px solid #e5e7eb`
- **Internal Padding:** compact, 12-16px selon densité de contenu — jamais au-delà de 24px pour un conteneur de données

### Inputs / Fields
- **Style:** fond blanc, bordure `#d1d5db`, coins 8px, padding `8px 12px`
- **Focus:** bordure bleue + anneau `focus:ring-2 focus:ring-blue-500`, pas de glow ni d'ombre portée
- **Error:** bordure et anneau rouges (`#ef4444`), message d'erreur en texte rouge au-dessus du champ, jamais uniquement la bordure

### Navigation (Sidebar)
- **Style:** fond blanc, bordure droite fine, items compacts (`py-2.5`), coins 8px sur l'état actif
- **Active:** fond `#eff6ff`, texte `#1d4ed8` — jamais de barre latérale colorée comme indicateur d'état actif
- **Hover:** fond `#f3f4f6` (gray-100)
- **Mobile:** tiroir plein écran avec overlay `rgb(0 0 0 / 0.5)`, pas de rétrécissement de layout

## 6. Do's and Don'ts

### Do:
- **Do** exprimer chaque statut métier (validé, en attente, refusé, expiré) en badge texte + couleur, jamais couleur seule.
- **Do** garder les surfaces au repos plates, bordure fine `#e5e7eb`, aucune ombre.
- **Do** réserver le bleu `#2563eb` à l'action primaire et à l'état actif de navigation.
- **Do** garder les composants compacts : padding 8-16px, pas d'espacement généreux qui réduit la densité d'information.
- **Do** utiliser l'ombre uniquement pour les couches flottantes (modale, drawer, menu contextuel).

### Don't:
- **Don't** utiliser de dégradé, même subtil, sur un fond, un bouton ou un texte (gradient text interdit).
- **Don't** empiler des cartes identiques icône+titre+texte en grille répétée — préférer un tableau ou une liste structurée quand les données sont homogènes.
- **Don't** utiliser une bordure colorée latérale (`border-left`/`border-right`) comme indicateur de statut ou d'alerte — utiliser un badge ou un fond teinté.
- **Don't** faire du glassmorphism décoratif (blur + transparence sur cartes) — ce système est net et opaque.
- **Don't** introduire un "hero metric" (gros chiffre + halo dégradé + petite légende) — les KPI du dashboard restent des valeurs denses en contexte, pas des vignettes marketing.
- **Don't** ouvrir une modale comme premier réflexe pour un formulaire simple — préférer un panneau inline ou un drawer quand le contexte de la page reste pertinent.
