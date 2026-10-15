# R-12 — Refus Chef de projet + statut « À corriger »

**Date :** 2026-10-05  
**Repos :** `toa-front` + `toa-back`  
**Statut :** design validé  
**Retour client :** R-12 — Plan de prévention — Rôle Chef de projet

## Objectifs

1. Permettre au **Chef de projet** de **refuser** un plan à l’étape d’examen (`SOUMIS` / `EN_COURS_DE_VALIDATION`).
2. Conserver le **refus HSE** sur statut `EXAMINE`.
3. Dans les deux cas : commentaire **obligatoire**, notification du prestataire, passage au statut **`A_CORRIGER`** (« À corriger »).
4. Depuis `A_CORRIGER`, le prestataire peut **modifier** puis **resoumettre** (comme un brouillon).

## Décisions validées

| Point | Choix |
|---|---|
| Qui refuse où | **C** — Chef sur `SOUMIS`/`EN_COURS_DE_VALIDATION` ; HSE sur `EXAMINE` |
| Après refus | Statut `A_CORRIGER` (plus `BROUILLON` pour le refus HSE) |
| Prestataire depuis `A_CORRIGER` | **A** — édition + resoumission → `SOUMIS` |
| Approche API | **1** — étendre `POST /plans-prevention/{id}/refuser` (pas de nouvel endpoint) |
| Traçabilité | Réutiliser `DecisionHse` `REFUSE` (nécessaire pour `resoumettre` / historique) |
| Consultation pièces (R-11) | Obligatoire avant tout refus (inchangé) |

## Workflow

```
SOUMIS / EN_COURS_DE_VALIDATION
  ├─ Examiner (Chef)     → EXAMINE
  └─ Refuser (Chef)      → A_CORRIGER  + notif prestataire

EXAMINE
  ├─ Valider (HSE)       → VALIDE_HSE  (inchangé)
  └─ Refuser (HSE)       → A_CORRIGER  + notif prestataire

A_CORRIGER
  └─ Modifier + Resoumettre (Prestataire) → SOUMIS
```

## Backend (`toa-back`)

### Enum

- Ajouter `StatutPlanPrevention::A_CORRIGER = 'A_CORRIGER'`.

### Sécurité

- Nouvel attribut voter `PLAN_PREVENTION_REFUSER`.
- `POST .../refuser` : `security: "is_granted('PLAN_PREVENTION_REFUSER', object)"`.
- Règles voter :
  - statut `SOUMIS` / `EN_COURS_DE_VALIDATION` → mêmes contrôles que `EXAMINE` (Chef assigné, bypass admin) ;
  - statut `EXAMINE` → mêmes contrôles que l’actuel `REFUSER_HSE` ;
  - autre statut → accès refusé.
- Conserver `PLAN_PREVENTION_REFUSER_HSE` pour compatibilité interne si encore référencé ; le endpoint public pointe vers `REFUSER`.

### Processor `PlanPreventionRefuserProcessor`

1. Valider le statut d’entrée (examinable **ou** `EXAMINE`).
2. Commentaire obligatoire.
3. `consultationGuard->assertAllConsulted`.
4. Persister `DecisionHsePlanPrevention` avec `DecisionHse::REFUSE`.
5. `setStatut(A_CORRIGER)`.
6. `notifierPrestataire`.

### Édition / resoumission

- `checkBrouillonStatut` / guards `EDIT` : accepter `BROUILLON` **ou** `A_CORRIGER`.
- `PlanPreventionResoumettreProcessor` : accepter `A_CORRIGER` (et `BROUILLON` pour l’historique des refus déjà en brouillon) ; conserver le contrôle « refus antérieur » via `DecisionHse::REFUSE`.

### Notifications

- Réutiliser le mail de refus existant ; s’assurer que le libellé / contexte mentionne le statut « À corriger » si le template l’expose.
- Lien deep-link inchangé (`FRONTEND_URL` + `/prevention/{id}`).

## Frontend (`toa-front`)

### Types / i18n

- Ajouter `A_CORRIGER` à `StatutPlanPrevention`.
- `StatutBadge` + clés FR/MG : « À corriger » / équivalent malgache.
- Optimistic refus → statut `A_CORRIGER`.

### Détail plan

- Si `canExamine` + statut examinable : boutons **Examiner** et **Refuser**.
- Refus Chef : ouvrir `RefuserModal` (commentaire obligatoire) → `refuserPlan`.
- Panneau HSE (`EXAMINE`) inchangé fonctionnellement ; cible statut `A_CORRIGER`.

### Édition

- Tout guard / filtre UI qui traite `BROUILLON` comme éditable / resoumettable inclut `A_CORRIGER`.
- Afficher le dernier commentaire de refus (mécanisme déjà en place via décisions HSE).

### API client

- Pas de nouvelle route : `planPreventionApi.refuser(id, commentaire)` réutilisé.

## Tests

| Zone | Cas |
|---|---|
| Back processor | Refus depuis `SOUMIS` → `A_CORRIGER` + décision + notif |
| Back processor | Refus depuis `EXAMINE` → `A_CORRIGER` |
| Back voter | Chef non assigné refusé ; HSE ne refuse pas un `SOUMIS` ; Chef ne refuse pas un `EXAMINE` |
| Back resoumettre | Depuis `A_CORRIGER` → `SOUMIS` |
| Front | Badge `A_CORRIGER` ; bouton Refuser visible pour Chef sur plan examinable ; optimistic update |

## Hors scope

- Changement du flux de validation HSE (hors refus).
- Nouveau endpoint dédié Chef.
- Mobile (`toa-apk`) sauf si les enums/statuts y sont dupliqués et cassent la compilation — alors alignement minimal des types/i18n.

## Fichiers concernés (aperçu)

| Fichier | Action |
|---|---|
| `toa-back/.../Enum/StatutPlanPrevention.php` | + `A_CORRIGER` |
| `toa-back/.../Voter/PlanPreventionVoter.php` | + `REFUSER`, règles statut |
| `toa-back/.../Entity/PlanPrevention.php` | security endpoint refuser |
| `toa-back/.../Processor/PlanPreventionRefuserProcessor.php` | statut cible + branches entrée |
| `toa-back/.../Processor/PlanPreventionResoumettreProcessor.php` | accepter `A_CORRIGER` |
| `toa-front/src/types/planPrevention.ts` | + statut |
| `toa-front/src/components/planPrevention/StatutBadge.tsx` | style badge |
| `toa-front/src/pages/planPrevention/PlanPreventionDetailPage.tsx` | bouton Refuser Chef |
| `toa-front/src/lib/locales/fr.json` / `mg.json` | libellés |
| Hooks / optimistic / guards édition | aligner `A_CORRIGER` |
