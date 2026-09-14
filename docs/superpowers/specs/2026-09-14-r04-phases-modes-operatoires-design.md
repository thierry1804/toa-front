# R-04 — Phases / modes opératoires dans le plan de prévention

**Date :** 2026-09-14  
**Repo :** `toa-front`  
**Statut :** design validé  
**Lié :** R-08 (UI risques sous modes opératoires — déjà partiellement en place)

## Objectifs

1. Retirer la saisie des sections/tâches de la **planification** (réduite à en-tête projet + dates).
2. Permettre au **prestataire** de saisir/ordonner les **phases** et **modes opératoires** dans le **plan de prévention**.
3. Renommer UI : Section → **Phase**, Tâche → **Mode opératoire**.
4. Conserver la hiérarchie : Phase → Mode opératoire → Risques.

## Décisions

| Point | Choix |
|---|---|
| Approche UI | Réutiliser `PlanningSectionManager` + `PlanningTaskTable` dans le wizard prévention |
| Planification | Plus de bloc sections ; plus de `sections` dans le payload create/update planning |
| Plan prévention | Éditeur phases/MO en étape 1 (create/edit, si `canEdit`) |
| Risques | Toujours gérés sous chaque mode opératoire via `AnalyseRisquesPlanning` |
| Payload API plan | `sections[{ libelle, ordre, taches[{ ordre, tache, materiel?, qui? }] }]` (champ technique `tache` conservé) |
| i18n | FR + MG : Phase / Mode opératoire ; titres mis à jour |
| Back | API sera prête à accepter `sections` sur create/update plan |

## Structure cible (UI)

```
Phase 1
  Mode opératoire 1 → risque 1, risque 2, …
  Mode opératoire 2 → risque 1, risque 3, …
Phase 2
  …
```

## Fichiers concernés (aperçu)

| Fichier | Action |
|---|---|
| `src/pages/planning/PlanningFormPage.tsx` | Retirer Card + state + `sectionsPayload` |
| `src/pages/planPrevention/PlanPreventionCreatePage.tsx` | Brancher éditeur ; inclure `sections` au submit |
| `src/types/planPrevention.ts` | Étendre `PlanPreventionInput` avec `sections?` |
| `src/features/planning/components/PlanningSectionManager.tsx` | Libellés via i18n (réutilisé) |
| `src/features/planning/components/PlanningTaskTable.tsx` | Libellés via i18n |
| `src/components/planPrevention/AnalyseRisquesPlanning.tsx` | Remplacer hardcodes « tâche » |
| `src/lib/locales/fr.json` / `mg.json` | Rename clés `planning.sections.*` (+ messages prévention) |
| Detail / récap | Afficher « Phase » / « Mode opératoire » en lecture seule |

## Flux

1. Chef de projet : crée une planification (sans phases/MO).
2. Prestataire : crée/édite un plan lié à une planif → saisit phases + modes opératoires + risques.
3. Detail / examen : lecture seule de la même structure.

## Hors scope

- Migration des `sections` déjà stockées sur d’anciennes planifications (responsabilité back / éventuelle copie).
- R-05 (restriction droits création) — mécanisme RBAC déjà présent.
- Rename technique API `tache` → `modeOperatoire`.
- R-09 / R-10 (APN/API).

## Critères d’acceptation

- [ ] Formulaire planification sans bloc phases/MO et sans `sections` dans le payload.
- [ ] Prestataire peut ajouter/réordonner/supprimer phases et modes opératoires dans le plan.
- [ ] Risques restent saisis sous chaque mode opératoire.
- [ ] Libellés UI FR/MG : Phase, Mode opératoire (plus de « Section » / « Tâche » dans ce flux).
- [ ] Detail / récap en lecture seule avec les nouveaux libellés.
