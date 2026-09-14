# R-04 Phases / Modes opératoires Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Déplacer la saisie Phase → Mode opératoire de la planification vers le plan de prévention, et renommer les libellés UI.

**Architecture:** Retirer sections du formulaire/payload planification. Réutiliser `PlanningSectionManager` + `PlanningTaskTable` dans l’étape 1 du wizard prévention ; persister via `updatePlan({ sections })` puis sauver les risques (IDs tâches). Champ technique API `tache` inchangé ; UI = Phase / Mode opératoire.

**Tech Stack:** React 19, react-i18next, types existants `SectionPayload` / `SectionRow` / `TaskRow`

**Spec:** `docs/superpowers/specs/2026-09-14-r04-phases-modes-operatoires-design.md`

## Global Constraints

- Section → Phase, Tâche → Mode opératoire (FR + MG)
- Payload plan : `sections[{ libelle, ordre, taches[{ ordre, tache, materiel?, qui? }] }]`
- Champ JSON `tache` conservé (pas de rename technique API)
- Planification = en-tête + dates uniquement (plus de `sections` en write)
- API back sera prête à accepter `sections` sur le plan
- Commits : auteur repo existant, **sans** mention Cursor dans message/body

## File map

| Fichier | Rôle |
|---|---|
| `src/lib/locales/fr.json` / `mg.json` | Libellés Phase / Mode opératoire |
| `src/pages/planning/PlanningFormPage.tsx` | Retirer UI + payload sections |
| `src/types/planPrevention.ts` | `sections?` sur `PlanPreventionInput` |
| `src/pages/planPrevention/PlanPreventionCreatePage.tsx` | State local + editor + save sections |
| `src/components/planPrevention/AnalyseRisquesPlanning.tsx` | Textes hardcodés |
| `src/features/planning/components/*` | Inchangés structurellement (i18n only) |

---

### Task 1: i18n Phase / Mode opératoire

**Files:**
- Modify: `src/lib/locales/fr.json` (`planning.sections.*`)
- Modify: `src/lib/locales/mg.json` (`planning.sections.*`)

**Interfaces:**
- Consumes: clés existantes `planning.sections.*`
- Produces: mêmes clés, nouvelles valeurs

- [ ] **Step 1: Mettre à jour FR**

Remplacer le bloc `planning.sections` par :

```json
"sections": {
  "ajouter_section": "Ajouter une phase",
  "supprimer_section": "Supprimer la phase",
  "nom_section": "Nom de la phase",
  "nom_section_mg": "Nom (Malagasy)",
  "col_tache": "Mode opératoire",
  "col_materiel": "Matériel/Outillage",
  "col_qui": "Qui ?",
  "ajouter_ligne": "Ajouter une ligne",
  "aucune_section": "Aucune phase",
  "aucune_tache": "Aucun mode opératoire",
  "tache_requise": "Le mode opératoire est obligatoire",
  "title": "Phases et modes opératoires"
}
```

- [ ] **Step 2: Mettre à jour MG**

```json
"sections": {
  "ajouter_section": "Manampy dingana",
  "supprimer_section": "Fafao ny dingana",
  "nom_section": "Anaran'ny dingana",
  "nom_section_mg": "Anarana (Malagasy)",
  "col_tache": "Fomba fiasa",
  "col_materiel": "Fitaovana",
  "col_qui": "Iza ?",
  "ajouter_ligne": "Manampy andalana",
  "aucune_section": "Tsy misy dingana",
  "aucune_tache": "Tsy misy fomba fiasa",
  "tache_requise": "Tsy maintsy fenoina ny fomba fiasa",
  "title": "Dingana sy fomba fiasa"
}
```

- [ ] **Step 3: Valider JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/lib/locales/fr.json','utf8')); JSON.parse(require('fs').readFileSync('src/lib/locales/mg.json','utf8')); console.log('json-ok')"
```

Expected: `json-ok`

- [ ] **Step 4: Commit** (sans trailer Cursor — utiliser `mingw64/bin/git.exe commit-tree` si le wrapper injecte Co-authored-by)

Message: `feat(i18n): rename section/task labels to phase/mode operatoire`

---

### Task 2: Retirer sections de la planification

**Files:**
- Modify: `src/pages/planning/PlanningFormPage.tsx`

**Interfaces:**
- Consumes: — 
- Produces: create/update planning **sans** `sections`

- [ ] **Step 1: Retirer imports / state inutiles**

Supprimer :
- import `PlanningSectionManager`
- import `ListChecks` si plus utilisé ailleurs
- import types `SectionRow` / `TaskRow` si plus utilisés
- `const [sections, setSections] = useState...`
- le `useEffect` qui hydrate `setSections` depuis `existing.sections` (garder l’hydratation des autres champs)

- [ ] **Step 2: Retirer `sectionsPayload` du submit**

Dans `handleSubmit`, supprimer le bloc `sectionsPayload` (l.207–216) et la propriété `sections: sectionsPayload` du `payload`.

- [ ] **Step 3: Retirer la Card UI**

Supprimer entièrement la Card lignes ~421–435 (`planning.sections.title` + `PlanningSectionManager`).

- [ ] **Step 4: Vérifier TypeScript**

```bash
npx tsc -p tsconfig.app.json --noEmit
```

Expected: exit 0 (ou aucune erreur dans `PlanningFormPage`)

- [ ] **Step 5: Commit**

Message: `feat(planning): drop sections/tasks from planning form`

---

### Task 3: Types — `sections` sur PlanPreventionInput

**Files:**
- Modify: `src/types/planPrevention.ts`

**Interfaces:**
- Consumes: `SectionPayload` depuis `@/types` (ou `src/types/index.ts`)
- Produces: `PlanPreventionInput.sections?: SectionPayload[]`

- [ ] **Step 1: Étendre l’input**

En haut du fichier, ajouter si besoin :

```ts
import type { SectionPayload } from '@/types'
```

(ou chemin relatif équivalent utilisé dans le projet)

Puis :

```ts
export interface PlanPreventionInput {
  codeSite: string
  localite: string
  activitePlanifiee: string
  dateDebut: string
  dateFin: string
  chefProjet?: string | null
  installations?: InstallationRow[]
  equipements?: EquipementRow[]
  planificationId?: number | null
  sections?: SectionPayload[]
}
```

- [ ] **Step 2: Commit**

Message: `feat(types): allow sections payload on plan prevention input`

---

### Task 4: Éditeur phases/MO + save dans PlanPreventionCreatePage

**Files:**
- Modify: `src/pages/planPrevention/PlanPreventionCreatePage.tsx`

**Interfaces:**
- Consumes: `PlanningSectionManager`, `SectionRow`, `TaskRow`, `SectionPayload`, `updatePlan`
- Produces: state `localSections` ; `activeSections` dérivé pour risques ; persist `sections` avant risques

- [ ] **Step 1: Imports + state**

Ajouter :

```ts
import PlanningSectionManager from '@/features/planning/components/PlanningSectionManager'
import type { SectionRow, TaskRow, SectionPayload } from '@/types'
```

State :

```ts
const [localSections, setLocalSections] = useState<SectionRow[]>([])
```

Helper de conversion (près des autres helpers) :

```ts
function sectionsToPayload(sections: SectionRow[]): SectionPayload[] {
  return sections.map((s, si) => ({
    libelle: s.libelle,
    ordre: si,
    taches: s.taches.map((tk, ti) => ({
      ordre: ti,
      tache: tk.tache,
      materiel: tk.materiel || undefined,
      qui: tk.qui || undefined,
    })),
  }))
}

function apiSectionsToRows(sections: { id?: string; libelle: string; ordre: number; taches: { id?: string; ordre: number; tache: string; materiel?: string | null; qui?: string | null }[] }[]): SectionRow[] {
  return [...sections]
    .sort((a, b) => a.ordre - b.ordre)
    .map((s) => ({
      localId: s.id ?? crypto.randomUUID(),
      libelle: s.libelle,
      taches: [...(s.taches ?? [])]
        .sort((a, b) => a.ordre - b.ordre)
        .map((tk) => ({
          localId: tk.id ?? crypto.randomUUID(),
          tache: tk.tache,
          materiel: tk.materiel ?? '',
          qui: tk.qui ?? '',
        })),
    }))
}
```

- [ ] **Step 2: Hydratation edit + source d’affichage**

Dans le `useEffect` qui charge `editPlan`, après set risques :

```ts
setLocalSections(apiSectionsToRows(editPlan.planificationSections ?? []))
```

Remplacer :

```ts
const activeSections = activePlanif?.sections ?? []
```

par une source **locale** pour l’édition, et snapshot plan pour le récap :

```ts
const activeSectionsForRisques = useMemo(() => {
  // AnalyseRisquesPlanning attend SectionPlanifieeItem[] (id sur section/tache)
  return localSections.map((s) => ({
    id: s.localId,
    libelle: s.libelle,
    ordre: 0,
    taches: s.taches.map((tk, i) => ({
      id: tk.localId,
      ordre: i,
      tache: tk.tache,
      materiel: tk.materiel || undefined,
      qui: tk.qui || undefined,
    })),
  }))
}, [localSections])
```

Utiliser `activeSectionsForRisques` dans step 1.  
Pour le récap (disabled), préférer `activePlan?.planificationSections ?? activeSectionsForRisques`.

- [ ] **Step 3: UI étape 1 — manager au-dessus des risques**

Dans `case 1`, avant `AnalyseRisquesPlanning` :

```tsx
{canEdit && (
  <div className="space-y-2">
    <h3 className="text-sm font-semibold text-gray-800">
      {t('planning.sections.title')}
    </h3>
    <PlanningSectionManager
      value={localSections}
      onChange={setLocalSections}
      lang={i18n.language?.startsWith('mg') ? 'mg' : 'fr'}
    />
  </div>
)}
<AnalyseRisquesPlanning
  sections={activeSectionsForRisques}
  rows={localRisques}
  onChange={setLocalRisques}
  categories={allCategories}
  disabled={!canEdit}
/>
```

(Importer `useTranslation` / `i18n` si pas déjà présents.)

- [ ] **Step 4: Persister sections dans `handleStep1Next`**

Au début de `handleStep1Next`, après `if (!activePlan) return` :

```ts
const sectionsPayload = sectionsToPayload(localSections)
const updated = await updatePlan(activePlan.id, { sections: sectionsPayload })
// Remapper localId → id API pour les risques
if (updated?.planificationSections?.length) {
  const idMap = new Map<string, string>()
  const rows = apiSectionsToRows(updated.planificationSections)
  // Si le back renvoie dans le même ordre, mappar par index :
  localSections.forEach((s, si) => {
    const apiS = updated.planificationSections![si]
    if (!apiS) return
    s.taches.forEach((tk, ti) => {
      const apiT = apiS.taches?.[ti]
      if (apiT?.id) idMap.set(tk.localId, apiT.id)
    })
  })
  setLocalRisques((prev) =>
    prev.map((r) => ({
      ...r,
      tachePlanifieeId: r.tachePlanifieeId
        ? idMap.get(r.tachePlanifieeId) ?? r.tachePlanifieeId
        : r.tachePlanifieeId,
    })),
  )
  setLocalSections(rows)
}
```

Puis enchaîner la logique risques existante (en utilisant l’état risques **après** remap — idéalement calculer `risquesToSave` localement après remap pour éviter le stale state React).

Pattern sûr :

```ts
let risquesForSave = localRisques
// ... après idMap :
risquesForSave = localRisques.map(...)
setLocalRisques(risquesForSave)
// loop addRisque/updateRisque on risquesForSave
```

Si `updatePlan` ne renvoie pas le plan complet, appeler le refetch existant (`invalidate` / `refetch` du hook détail) puis relire `planificationSections`.

- [ ] **Step 5: Vérifier TypeScript + smoke manuel**

```bash
npx tsc -p tsconfig.app.json --noEmit
```

Manuel :
1. Planning new : pas de bloc phases
2. Plan prévention create : étape 1 = phases/MO éditables + risques
3. Libellés Phase / Mode opératoire

- [ ] **Step 6: Commit**

Message: `feat(prevention): edit phases and modes operatoires on plan form`

---

### Task 5: Hardcodes AnalyseRisquesPlanning + polish

**Files:**
- Modify: `src/components/planPrevention/AnalyseRisquesPlanning.tsx`

**Interfaces:**
- Consumes: `t('planning.sections.*')` ou clés dédiées
- Produces: empty states sans « tâche » hardcodé

- [ ] **Step 1: Remplacer textes hardcodés**

Lignes ~104–112 et ~146 : utiliser `useTranslation` + `t('planning.sections.aucune_section')` / `aucune_tache` / titre mode opératoire si besoin.

- [ ] **Step 2: Commit**

Message: `fix(prevention): use i18n for phase/mode operatoire empty states`

---

## Self-review (plan vs spec)

| Spec | Task |
|---|---|
| Retirer bloc planif + payload | Task 2 |
| Éditeur dans plan prévention | Task 4 |
| Rename Phase / Mode opératoire | Task 1 (+ 5) |
| Payload `sections` sur plan | Task 3 + 4 |
| Risques sous MO | Task 4 (AnalyseRisquesPlanning inchangé structurellement) |
| Hors scope migration / rename API `tache` | respecté |
