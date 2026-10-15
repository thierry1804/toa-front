# R-12 Refus Chef + statut À corriger — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre au Chef de projet de refuser un plan soumis, et au HSE de refuser un plan examiné, avec statut `A_CORRIGER`, commentaire obligatoire, notif prestataire, puis édition/resoumission prestataire.

**Architecture:** Étendre `POST /plans-prevention/{id}/refuser` via un voter `PLAN_PREVENTION_REFUSER` (branche Chef sur `SOUMIS`/`EN_COURS_DE_VALIDATION`, branche HSE sur `EXAMINE`). Cible statut `A_CORRIGER` + `DecisionHse::REFUSE`. Front : bouton Refuser côté Chef, badge/i18n, guards édition/resoumission alignés.

**Tech Stack:** Symfony 6 / API Platform, PHPUnit ; React 19, TanStack Query, react-i18next, Vitest

**Spec:** `docs/superpowers/specs/2026-10-05-r12-refus-chef-a-corriger-design.md`

## Global Constraints

- Chef refuse uniquement sur `SOUMIS` / `EN_COURS_DE_VALIDATION`
- HSE refuse uniquement sur `EXAMINE`
- Les deux → `A_CORRIGER` + notif prestataire + commentaire obligatoire
- Prestataire : éditer + resoumettre depuis `A_CORRIGER` (comme brouillon après refus)
- Réutiliser `DecisionHse` `REFUSE` (pas de nouvel endpoint)
- Garde consultation pièces (R-11) avant refus
- Commits : **sans** mention Cursor ; repos séparés `toa-back` et `toa-front` (et `toa-apk` si touché)
- Ne pas committer sans demande explicite de l’utilisateur en session interactive — les steps « Commit » restent optionnels / à exécuter seulement si demandé

## File map

| Fichier | Rôle |
|---|---|
| `toa-back/src/Domain/PlanPrevention/Enum/StatutPlanPrevention.php` | + `A_CORRIGER` |
| `toa-back/src/Security/Voter/PlanPreventionVoter.php` | + `REFUSER`, EDIT/RESOUMETTRE acceptent `A_CORRIGER` |
| `toa-back/src/Domain/PlanPrevention/Entity/PlanPrevention.php` | security endpoint → `PLAN_PREVENTION_REFUSER` |
| `toa-back/src/Api/Processor/PlanPreventionRefuserProcessor.php` | statut cible + validation entrée |
| `toa-back/src/Api/Processor/PlanPreventionResoumettreProcessor.php` | accepter `A_CORRIGER` |
| `toa-back/tests/Unit/Api/Processor/PlanPreventionRefuserProcessorTest.php` | tests processor |
| `toa-back/tests/Unit/Api/Processor/PlanPreventionResoumettreProcessorTest.php` | tests resoumettre |
| `toa-front/src/types/planPrevention.ts` | + `A_CORRIGER` |
| `toa-front/src/components/planPrevention/StatutBadge.tsx` | style badge |
| `toa-front/src/lib/locales/fr.json` / `mg.json` | libellés |
| `toa-front/src/offline/optimisticPlan.ts` (+ test) | refus → `A_CORRIGER` |
| `toa-front/src/pages/planPrevention/PlanPreventionDetailPage.tsx` | bouton Refuser Chef |
| `toa-front/src/pages/prevention/PlanPreventionListPage.tsx` | filtre + actions corriger/éditer |
| `toa-apk/src/types/planPrevention.ts` | alignement enum/labels |
| `toa-apk/src/lib/statusTone.ts` | ton badge si présent |

---

### Task 1: Enum backend `A_CORRIGER`

**Files:**
- Modify: `toa-back/src/Domain/PlanPrevention/Enum/StatutPlanPrevention.php`
- Test: compilation / phpunit smoke sur l’enum (pas de fichier dédié requis)

**Interfaces:**
- Consumes: enum existant
- Produces: `StatutPlanPrevention::A_CORRIGER = 'A_CORRIGER'`

- [ ] **Step 1: Ajouter le case**

Dans `StatutPlanPrevention.php`, après `BROUILLON` :

```php
case A_CORRIGER             = 'A_CORRIGER';
```

- [ ] **Step 2: Vérifier**

Run (cwd `toa-back`): `php -r "require 'vendor/autoload.php'; echo App\Domain\PlanPrevention\Enum\StatutPlanPrevention::A_CORRIGER->value;"`

Expected: `A_CORRIGER`

---

### Task 2: `PlanPreventionRefuserProcessor` → `A_CORRIGER` + multi-statut d’entrée

**Files:**
- Modify: `toa-back/src/Api/Processor/PlanPreventionRefuserProcessor.php`
- Create: `toa-back/tests/Unit/Api/Processor/PlanPreventionRefuserProcessorTest.php`

**Interfaces:**
- Consumes: `StatutPlanPrevention::A_CORRIGER`, `DecisionHse::REFUSE`, `notifierPrestataire`
- Produces: refus depuis `SOUMIS`|`EN_COURS_DE_VALIDATION`|`EXAMINE` → statut `A_CORRIGER`

- [ ] **Step 1: Écrire les tests (fail)**

Créer `PlanPreventionRefuserProcessorTest.php` en suivant le style de `PlanPreventionSoumettreProcessorTest.php` : mocker `persistProcessor`, `EntityManager`, `TokenStorage` (user User), `NotificationService`, `RequestStack` (JSON `{"commentaire":"motif"}`), `ConsultationGuard`.

```php
public function testRefuseFromSoumisSetsACorrigerAndNotifies(): void
{
    $plan = (new PlanPrevention())->setStatut(StatutPlanPrevention::SOUMIS);
    // ... wire processor with mocks ...
    $this->notificationService->expects($this->once())->method('notifierPrestataire');
    $this->processor->process($plan, new Post());
    $this->assertSame(StatutPlanPrevention::A_CORRIGER, $plan->getStatut());
}

public function testRefuseFromExamineSetsACorriger(): void
{
    $plan = (new PlanPrevention())->setStatut(StatutPlanPrevention::EXAMINE);
    $this->processor->process($plan, new Post());
    $this->assertSame(StatutPlanPrevention::A_CORRIGER, $plan->getStatut());
}

public function testRefuseRequiresCommentaire(): void
{
    $this->expectException(UnprocessableEntityHttpException::class);
    // request body without commentaire
}

public function testRefuseRejectsBrouillon(): void
{
    $plan = (new PlanPrevention())->setStatut(StatutPlanPrevention::BROUILLON);
    $this->expectException(UnprocessableEntityHttpException::class);
    $this->processor->process($plan, new Post());
}
```

Pour `EntityManager::persist`, s’attendre à une `DecisionHsePlanPrevention` avec `DecisionHse::REFUSE`.

- [ ] **Step 2: Run tests — expect FAIL**

Run: `php bin/phpunit tests/Unit/Api/Processor/PlanPreventionRefuserProcessorTest.php -v`  
Expected: FAIL (statut encore `BROUILLON` et/ou rejet de `SOUMIS`)

- [ ] **Step 3: Implémenter le processor**

Remplacer le check statut et la cible :

```php
private const STATUTS_REFUSABLES = [
    StatutPlanPrevention::SOUMIS,
    StatutPlanPrevention::EN_COURS_DE_VALIDATION,
    StatutPlanPrevention::EXAMINE,
];

// dans process() :
if (!in_array($plan->getStatut(), self::STATUTS_REFUSABLES, true)) {
    throw new UnprocessableEntityHttpException('plan_prevention.statut_invalide_pour_refus');
}

// ... commentaire, consultation, decision ...

$plan->setStatut(StatutPlanPrevention::A_CORRIGER);
```

Conserver création `DecisionHsePlanPrevention` + `notifierPrestataire`.

- [ ] **Step 4: Run tests — expect PASS**

Run: `php bin/phpunit tests/Unit/Api/Processor/PlanPreventionRefuserProcessorTest.php -v`  
Expected: PASS

---

### Task 3: Voter `PLAN_PREVENTION_REFUSER` + EDIT/RESOUMETTRE sur `A_CORRIGER`

**Files:**
- Modify: `toa-back/src/Security/Voter/PlanPreventionVoter.php`
- Modify: `toa-back/src/Domain/PlanPrevention/Entity/PlanPrevention.php` (security de l’opération `refuser`)

**Interfaces:**
- Consumes: `StatutPlanPrevention::A_CORRIGER`
- Produces: attribut `PlanPreventionVoter::REFUSER = 'PLAN_PREVENTION_REFUSER'`

- [ ] **Step 1: Étendre l’enum d’attributs et ACTION_MAP**

```php
public const REFUSER     = 'PLAN_PREVENTION_REFUSER';

// ACTION_MAP :
self::REFUSER => 'EDIT',

// supports() : ajouter self::REFUSER dans le tableau in_array
```

- [ ] **Step 2: Autoriser `A_CORRIGER` comme brouillon éditable**

```php
private function checkBrouillonStatut(PlanPrevention $plan): void
{
    $ok = in_array($plan->getStatut(), [
        StatutPlanPrevention::BROUILLON,
        StatutPlanPrevention::A_CORRIGER,
    ], true);

    if (!$ok) {
        throw new AccessDeniedException('plan_prevention.statut_not_brouillon');
    }
}
```

- [ ] **Step 3: Branche `REFUSER` dans `voteOnAttribute`**

Après le bloc EXAMINE :

```php
if ($attribute === self::REFUSER) {
    if (!$subject instanceof PlanPrevention) {
        throw new AccessDeniedException('error.voter.access_denied');
    }
    $statut = $subject->getStatut();
    $examinable = in_array($statut, [
        StatutPlanPrevention::SOUMIS,
        StatutPlanPrevention::EN_COURS_DE_VALIDATION,
    ], true);

    if ($examinable) {
        // Chef assigné (même logique que EXAMINE)
        if (!$this->permissionChecker->isGranted($roles, self::MENU_ROUTE, 'DELETE')) {
            $this->checkOwnershipForChefProjet($subject, $user);
        }
        return true;
    }

    if ($statut === StatutPlanPrevention::EXAMINE) {
        // HSE / admin — pas le Chef seul
        if (
            in_array('ROLE_CHEF_PROJET', $roles, true)
            && !in_array('ROLE_HSE', $roles, true)
            && !in_array('ROLE_ADMIN', $roles, true)
            && !in_array('ROLE_SUPER_ADMIN', $roles, true)
        ) {
            throw new AccessDeniedException('error.voter.access_denied');
        }
        return true;
    }

    throw new AccessDeniedException('plan_prevention.statut_invalide_pour_refus');
}
```

Note : le check menu `EDIT` en tête de `voteOnAttribute` s’applique déjà via `ACTION_MAP`.

- [ ] **Step 4: Pointer l’opération API Platform**

Dans `PlanPrevention.php`, opération `refuser` :

```php
security: "is_granted('PLAN_PREVENTION_REFUSER', object)",
```

Laisser la constante `REFUSER_HSE` en place (non utilisée par cet endpoint).

- [ ] **Step 5: Smoke PHPUnit voter si des tests existent ; sinon smoke manuel logique via processor tests déjà verts**

Run: `php bin/phpunit tests/Unit/Api/Processor/PlanPreventionRefuserProcessorTest.php -v`  
Expected: PASS

---

### Task 4: Resoumettre depuis `A_CORRIGER`

**Files:**
- Modify: `toa-back/src/Api/Processor/PlanPreventionResoumettreProcessor.php`
- Create: `toa-back/tests/Unit/Api/Processor/PlanPreventionResoumettreProcessorTest.php`

**Interfaces:**
- Consumes: `A_CORRIGER`, `DecisionHse::REFUSE`
- Produces: resoumission `A_CORRIGER`|`BROUILLON` (+ refus antérieur) → `SOUMIS`

- [ ] **Step 1: Test fail**

```php
public function testResoumettreFromACorrigerSetsSoumis(): void
{
    $user = (new User())->setEmail('p@ex.com');
    $plan = (new PlanPrevention())
        ->setStatut(StatutPlanPrevention::A_CORRIGER)
        ->setCreatedBy($user);
    // ajouter DecisionHse REFUSE sur le plan
    // mock token user = $user, versionRepository, etc.
    $this->processor->process($plan, new Post());
    $this->assertSame(StatutPlanPrevention::SOUMIS, $plan->getStatut());
}
```

- [ ] **Step 2: Run — expect FAIL** (`statut_not_brouillon`)

- [ ] **Step 3: Implémenter**

```php
$statutsOk = [
    StatutPlanPrevention::BROUILLON,
    StatutPlanPrevention::A_CORRIGER,
];
if (!in_array($plan->getStatut(), $statutsOk, true)) {
    throw new UnprocessableEntityHttpException('plan_prevention.statut_not_brouillon');
}
```

Conserver le reste (ownership, hasRefus, validator, version, notif HSE).

- [ ] **Step 4: Run — expect PASS**

Run: `php bin/phpunit tests/Unit/Api/Processor/PlanPreventionResoumettreProcessorTest.php -v`

---

### Task 5: Front — types, i18n, badge, optimistic

**Files:**
- Modify: `toa-front/src/types/planPrevention.ts`
- Modify: `toa-front/src/components/planPrevention/StatutBadge.tsx`
- Modify: `toa-front/src/lib/locales/fr.json`
- Modify: `toa-front/src/lib/locales/mg.json`
- Modify: `toa-front/src/offline/optimisticPlan.ts`
- Modify: `toa-front/src/offline/optimisticPlan.test.ts`
- Modify: `toa-apk/src/types/planPrevention.ts`
- Modify: `toa-apk/src/lib/statusTone.ts` (si mapping statut → tone)

**Interfaces:**
- Consumes: —
- Produces: type union + label `A_CORRIGER` ; optimistic `refuser` → `A_CORRIGER`

- [ ] **Step 1: Type + badge**

```ts
// planPrevention.ts — ajouter dans l'union :
| 'A_CORRIGER'

// StatutBadge.tsx :
A_CORRIGER: { color: 'bg-amber-100 text-amber-800', icon: AlertCircle },
```

- [ ] **Step 2: i18n**

`fr.json` → `"A_CORRIGER": "À corriger"` dans `planPrevention.statut`  
`mg.json` → `"A_CORRIGER": "Tokony hohitsiana"` (ou libellé MG cohérent avec le glossaire existant)

- [ ] **Step 3: Optimistic + test**

```ts
case 'refuser':
  return { ...plan, statut: 'A_CORRIGER', pendingSync: true }
```

Mettre à jour `optimisticPlan.test.ts` : expect `A_CORRIGER` (plus `BROUILLON`).

- [ ] **Step 4: Alignement apk**

Ajouter `A_CORRIGER` au type + `STATUT_PLAN_LABELS` + tone `warning`/`amber` si applicable.

- [ ] **Step 5: Run Vitest**

Run (cwd `toa-front`): `npx vitest run src/offline/optimisticPlan.test.ts`  
Expected: PASS

---

### Task 6: Front — bouton Refuser Chef sur détail

**Files:**
- Modify: `toa-front/src/pages/planPrevention/PlanPreventionDetailPage.tsx`

**Interfaces:**
- Consumes: `refuserPlan`, `RefuserModal`, `canExamine`, `STATUTS_EXAMINABLES`
- Produces: UI refus Chef sur statut examinable

- [ ] **Step 1: Afficher Refuser à côté d’Examiner**

Dans le header `actions`, après le bouton Examiner :

```tsx
{isExaminable && (
  <Button
    variant="danger"
    onClick={() => setRefuserOpen(true)}
    disabled={!docsConsulted}
    title={!docsConsulted ? t("planPrevention.toast.documentsNonConsultes") : undefined}
  >
    <ShieldX className="mr-2 h-4 w-4" />
    {t("planPrevention.list.actions.refuser")}
  </Button>
)}
```

- [ ] **Step 2: Étendre `hasPendingReviewAction`**

```ts
const hasPendingReviewAction =
  isExaminable || (isDecidable && (canValiderHse || canRefuserHse));
```

(déjà vrai pour examinable — vérifier que l’alerte docs s’affiche aussi quand seul Refuser Chef est possible ; `isExaminable` suffit.)

- [ ] **Step 3: Réutiliser le `RefuserModal` existant**

Le modal déjà monté avec `onRefuser={refuserPlan}` sert Chef **et** HSE. Aucun second modal.

- [ ] **Step 4: Vérifier manuellement (checklist)**

1. Compte Chef, plan `SOUMIS`, docs consultés → Examiner + Refuser visibles  
2. Refuser sans commentaire → bloqué  
3. Refuser avec commentaire → statut « À corriger », prestataire notifié  
4. Compte HSE, plan `EXAMINE` → Refuser → « À corriger »

---

### Task 7: Front — liste + édition/resoumission `A_CORRIGER`

**Files:**
- Modify: `toa-front/src/pages/prevention/PlanPreventionListPage.tsx`
- Grep + aligner tout guard `statut === 'BROUILLON'` lié aux plans refusés / édition prestataire dans `toa-front/src` (hors permis)

**Interfaces:**
- Consumes: `A_CORRIGER`
- Produces: actions « corriger / resoumettre » et filtre statut

- [ ] **Step 1: Filtre liste**

Dans `PLAN_STATUTS`, ajouter `'A_CORRIGER'` après `'BROUILLON'`.

- [ ] **Step 2: Actions ligne**

```ts
const isCorrectible =
  isOwnPlan && isPrestataire
  && (plan.statut === 'BROUILLON' || plan.statut === 'A_CORRIGER')
  && hasRefusDecision && canResoumettre

const isEditable =
  isOwnPlan && isPrestataire
  && plan.statut === 'BROUILLON'
  && !hasRefusDecision
```

Note : un plan `A_CORRIGER` a toujours un refus → `isCorrectible` (pas `isEditable` « brouillon neuf »).

- [ ] **Step 3: Grep de sécurité**

Run: `rg "statut === 'BROUILLON'" toa-front/src -g '!**/permitTravail/**'`  
Pour chaque occurrence **plan de prévention**, décider si `A_CORRIGER` doit être inclus (édition, resoumettre, navigation edit). Mettre à jour en conséquence (ex. `usePlanPrevention` messages d’erreur, pages create/edit si gated).

- [ ] **Step 4: Smoke Vitest ciblé si tests list/guards existent ; sinon checklist manuelle**

Checklist :
1. Prestataire voit plan « À corriger » dans la liste  
2. Peut ouvrir en édition, modifier, resoumettre → `SOUMIS`

---

## Spec coverage (self-review)

| Exigence spec | Task |
|---|---|
| Enum `A_CORRIGER` | T1 |
| Endpoint unique `/refuser` étendu | T2 + T3 |
| Chef sur SOUMIS/EN_COURS ; HSE sur EXAMINE | T3 |
| Commentaire + DecisionHse + notif + statut A_CORRIGER | T2 |
| EDIT/resoumettre depuis A_CORRIGER | T3 + T4 + T7 |
| Bouton Refuser Chef + RefuserModal | T6 |
| Badge / i18n / optimistic | T5 |
| Alignement apk types | T5 |
| Hors scope validation HSE / nouvel endpoint | respecté |

## Placeholder scan

Aucun TBD / « similar to Task N » sans code. Steps commit laissés optionnels (contrainte session).
