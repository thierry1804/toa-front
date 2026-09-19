# Gap Analysis — Retours client 08/09/2026 vs code réel `toa-front`

## 1. En-tête

- **Repo analysé :** `D:\TOA\toa-front`
- **Branche :** `develop`
- **HEAD au moment de l'analyse :** `a5940237659cd1594c931178d7255a288c38e1b4` (2026-09-08 09:13:21 +0300) — *"Corrige erreur React #310 sur le plan de prévention : useState placé après un early..."*
- **Date de l'analyse :** 2026-09-14
- **Source des retours :** `D:\TOA\Retours_Consolides_2026-09-08.md` (statuts définitifs, croisés avec `precisions.png`)
- **Méthode :** lecture exhaustive du code sur `develop` (routage `src/main.tsx`, pages, composants, hooks, types, i18n). Aucune confiance accordée à `D:\TOA\Taches_toa-front.md` ni à l'audit du 06/07/2026 — les deux sont partiellement obsolètes (cf. §5). Mission 100% lecture, aucun fichier source modifié.

---

## 2. Tableau de synthèse

| Réf | Retour (résumé) | Statut réel | Effort restant |
|---|---|---|---|
| R-01 | Logos ISO 45001 + 14001 sur page connexion | **NON COMMENCÉ** | S |
| R-02 | Renommer titre page connexion | **NON COMMENCÉ** | S |
| R-03 | Autoriser plusieurs planifications même site/date | **PARTIEL** (contrôle probablement côté back) | S |
| R-04 | Déplacer sections/tâches planning → plan prévention, renommer « Tâche »→« Mode opératoire » | **NON COMMENCÉ** | L |
| R-05 | Restreindre droits création par rôle | **PARTIEL** (mécanisme RBAC générique en place) | S |
| R-06 | Import CSV codes site (collage `;`) | **FAIT** | — |
| R-07 | Liste plans prévention filtrée côté prestataire | **PARTIEL** (à vérifier scope back) | S |
| R-08 | Saisie phases + modes opératoires dans plan prévention | **PARTIEL** | L |
| R-09 | Alerte APN/API multi-site | **NON COMMENCÉ** | M |
| R-10 | Risque APN/API obligatoire (Option 1) | **NON COMMENCÉ** | S (après R-09/R-27) |
| R-11 | Blocage validation tant que pièces non consultées | **NON COMMENCÉ** | M |
| R-12 | Action Refuser + commentaire obligatoire | **PARTIEL** | S-M |
| R-13 | Notification groupée rôle HSE TOA | **FAIT côté front** / back à confirmer | — |
| R-14 | Supprimer raccourci validation depuis la liste | **NON COMMENCÉ** | S |
| R-15 | Upload → prise de photo directe (3 modules) | **NON COMMENCÉ** | L |
| R-16 | Horodatage photo affiché | **NON COMMENCÉ** | S |
| R-17 | Multi-photos / galerie | **NON COMMENCÉ** | M |
| R-18 | Option « N/A » par ligne document | **NON COMMENCÉ** | M |
| R-19 | Heure soumission + validation (plan prévention & permis) | **PARTIEL** | S-M |
| R-20 | Permis général obligatoire hors « Nouveau site » | **NON COMMENCÉ** | M |
| R-21 | Renommer « Clôture permis » → « PV Environnement » | **NON COMMENCÉ** | S |
| R-22 | 2 photos avant/après travaux à la clôture | **NON COMMENCÉ** | M |
| R-23 | Pièces environnementales APN/API dynamiques | **NON COMMENCÉ** | L (bloqué par R-27) |
| R-24 | Retirer bloc validation PV du dashboard | **FAIT** | — |
| R-25 | Indicateur nombre de permis | **NON COMMENCÉ** (clé i18n orpheline) | S |
| R-26 | Couleur automatique par type de projet | **NON COMMENCÉ** | M |
| R-27 | Import KMZ : 2 colonnes APN/API | **NON COMMENCÉ** | M (bloquant R-09/R-10/R-23) |
| R-28 | Lien direct dans les courriels | **FAIT côté front** (routes déjà deep-linkables) / back à faire | — |

**Décompte : FAIT = 4 (R-06, R-13*, R-24, R-28*) · PARTIEL = 6 (R-03, R-05, R-07, R-08, R-12, R-19) · NON COMMENCÉ = 18.**
(*R-13 et R-28 sont "FAIT" uniquement côté front — l'essentiel du travail est backend/emailing.)

---

## 3. Détail par retour

### 3.1 Page de connexion

**R-01 — NON COMMENCÉ.** `src/pages/auth/LoginPage.tsx:60-62` n'affiche que le logo `/images/TOA.png`. Aucun fichier ISO dans `public/images` (contenu vérifié : seul `TOA.png`). Les assets clients existent à `D:\TOA\retours\LOGO ISO 45001.jpg` et `LOGOISO 14001.png` (hors repo, à copier dans `public/images`).

**R-02 — NON COMMENCÉ.** Titre en dur `"Plateforme de gestion HSE"` à `src/pages/auth/LoginPage.tsx:67`, non extrait en clé i18n (contrairement au reste de l'écran qui utilise `t('auth.email')` etc.). À remplacer par une clé i18n portant le nouveau texte.

### 3.2 Planification

**R-03 — PARTIEL.** Aucun contrôle front bloquant à l'avance (pas de vérification de doublon site/date dans `validateForm()` de `src/pages/planning/PlanningFormPage.tsx:151-185`). Le seul code lié est un `onError` réagissant à un **409 renvoyé par le back** avec `error_key`/`createConflict` (`PlanningFormPage.tsx:261-269`). Le contrôle à supprimer est donc très probablement côté back ; le front n'a qu'un nettoyage cosmétique à faire une fois le back corrigé (le toast `planning.toast.createConflict` deviendra mort).

**R-04 — NON COMMENCÉ.** Le bloc « Sections et tâches » est toujours présent et actif dans le formulaire de planification : `src/pages/planning/PlanningFormPage.tsx:421-435` (Card `t('planning.sections.title')` contenant `PlanningSectionManager`), et les sections sont toujours envoyées dans le payload de création/update (`sectionsPayload`, lignes 207-230). Le libellé « Tâche » n'est pas renommé : colonne `t('planning.sections.col_tache')` dans `src/features/planning/components/PlanningTaskTable.tsx:36` (aucune occurrence de « mode opératoire » dans tout `src/`, vérifié par recherche globale). Architecture actuelle : Planning **crée** les sections/tâches, Plan de Prévention les **consomme en lecture seule** (`activeSections = activePlanif?.sections`, `src/pages/planPrevention/PlanPreventionCreatePage.tsx:455-458`) — c'est l'inverse de ce que demande R-04.

**R-05 — PARTIEL.** Mécanisme RBAC générique déjà en place : bouton créer masqué via `perms?.canCreate` (`src/pages/planning/PlanningListPage.tsx:140`, `src/pages/prevention/PlanPreventionListPage.tsx:219,323`). La restriction effective par rôle dépend donc de la configuration back (menu-access), pas de code front à écrire. **Point d'attention** : `src/pages/planPrevention/PlanPreventionCreatePage.tsx:139-140` — `canEdit`/`canSubmit` retombent à `true` par défaut (`perms?.canCreate ?? true`) si les permissions ne sont pas encore chargées ou échouent → *fail-open*, à corriger indépendamment du retour client.

**R-06 — FAIT.** Import par collage déjà implémenté : `src/components/planning/SiteSelectorBlock.tsx:84-101` (`handlePasteImport`, split sur `;`), UI dédiée lignes 261-288 (textarea + bouton « Importer »), actif uniquement quand `typeIntervention !== 'Nouveau site'` (`isMulti`, ligne 44) — conforme exactement à la précision du retour. Rien à faire.

**R-07 — PARTIEL / à vérifier côté back.** `src/pages/prevention/PlanPreventionListPage.tsx` ne fait **aucun filtrage client par entreprise** ; la liste vient de `usePlanPreventionList` → `planPreventionApi.list(params)` (`src/features/planPrevention/hooks/usePlanPrevention.ts:196-206`) sans paramètre d'entreprise. Le filtrage repose donc entièrement sur le scope backend (Voter API Platform), à confirmer. Note : l'ancienne page orpheline `src/pages/prevention/PreventionListPage.tsx:36-39` avait un filtre client explicite (`plan.entreprisePrestataire === user?.entreprise`) mais cette page n'est **pas routée** (cf. §5).

### 3.3 Plan de prévention — Prestataire

**R-08 — PARTIEL.** Le bloc d'évaluation des risques par mode opératoire existe déjà et fonctionne (`AnalyseRisquesPlanning`, `src/components/planPrevention/AnalyseRisquesPlanning.tsx`, intégré à l'étape 1 du wizard `src/pages/planPrevention/PlanPreventionCreatePage.tsx:702-723`). Ce qui manque, conformément à la précision client : la **création/l'ordonnancement des phases** (sections) et de leurs modes opératoires (tâches) **depuis le plan de prévention lui-même** — actuellement ces données sont en lecture seule, héritées de la planification (`activeSections`, ligne 458). Il faudrait réutiliser/adapter `PlanningSectionManager` (`src/features/planning/components/PlanningSectionManager.tsx`) côté prestataire dans le formulaire prévention.

**R-09 — NON COMMENCÉ.** Recherche exhaustive de « APN »/« API » dans `src/` : aucune occurrence. `SitePrevention` (`src/types/planPrevention.ts:99-112`) n'a pas de champ `apn`/`api`. Aucune alerte, aucune donnée disponible. Bloqué par R-27 (le KMZ doit d'abord porter ces colonnes).

**R-10 — NON COMMENCÉ.** Même constat que R-09 — aucune logique d'obligation de risque APN/API dans `PlanPreventionCreatePage.tsx` (validation step 1 = `isStep1Invalid`, ligne 1074, ne porte que sur les mesures préventives manquantes, rien sur APN/API).

### 3.4 Plan de prévention — Chef de projet

**R-11 — NON COMMENCÉ.** Aucune trace de suivi de consultation des pièces/photos (recherche « consult/viewed » dans `src/` : uniquement des faux positifs sans rapport, `src/lib/locales/*.json`, `PermitTravailSuiviPage.tsx`, `LogsDrawer.tsx`). Les boutons Valider/Refuser dans `src/pages/planPrevention/PlanPreventionDetailPage.tsx:248-259` ne sont conditionnés que par `isDecidable` (statut `EXAMINE`), jamais par une consultation effective des documents listés en §5 de la même page (lignes 421-471, simples liens Voir/Télécharger sans tracking d'état).

**R-12 — PARTIEL.** `RefuserModal` (`src/components/planPrevention/RefuserModal.tsx:39-40`) impose bien un commentaire obligatoire (`commentRequired`), avec message d'erreur backend géré (« Plan non examiné »). Notification prestataire déjà annoncée dans les libellés (`fr.json:615`, `1916`). **Nuance** : ce refus se trouve au niveau de la décision **HSE** (`canRefuserHse`, plan au statut `EXAMINE`), alors que le retour est classé sous « rôle Chef de projet ». L'étape « Examiner » du Chef de Projet (`ExaminerModal.tsx`) n'offre **aucune option de refus** — seulement une confirmation avec commentaire optionnel. À clarifier avec le client/back : qui doit réellement pouvoir refuser (Chef de Projet à l'étape d'examen, ou HSE seul comme actuellement) ? Le statut cible n'est pas littéralement « À corriger » (l'enum `StatutPlanPrevention` n'a pas cette valeur, `src/types/planPrevention.ts:1-11`) mais retombe à `BROUILLON` + flag `hasRefusDecision` — équivalent fonctionnel, à vérifier si le libellé exact importe au client.

**R-13 — FAIT côté front.** `ExaminerModal.tsx:27-29` annonce déjà « Les utilisateurs HSE concernés seront notifiés pour validation ». Le scope exact des destinataires (HSE TOA uniquement, pas Etech) est entièrement backend/mailing — aucune action front nécessaire.

**R-14 — NON COMMENCÉ.** `src/pages/prevention/PlanPreventionListPage.tsx` propose toujours Valider/Refuser **directement depuis la liste** : boutons dans `PlanRow` (lignes 191-208) et modales `ExaminerModal`/`ValiderModal`/`RefuserModal` montées directement dans la page liste (lignes 459-490), sans passer par le détail. Ceci contredit directement R-14 et fragilise R-11 (on peut décider sans jamais ouvrir le détail ni les pièces jointes).

### 3.5 Téléversement des pièces justificatives

**R-15 — NON COMMENCÉ.** Les 3 zones d'upload identifiées (`src/components/planPrevention/DocumentUploadZone.tsx:184-190`, `src/components/permitTravail/PermitDocumentUploadZone.tsx`, `SuiviDocumentUploadZone` utilisé dans `src/pages/intervention/SuiviJournalierPage.tsx:532-535`) utilisent toutes un `<input type="file" accept=".pdf,.jpg,.jpeg">` classique avec glisser-déposer. Aucun attribut `capture`, aucune API caméra (`getUserMedia`) nulle part dans `src/` (seule occurrence du mot « environment » : non liée, dans `UserFormPage.tsx`).

**R-16 — NON COMMENCÉ.** Le champ `uploadedAt` existe dans les modèles (`types/planPrevention.ts:96`, `types/permitTravail.ts:167`) mais n'est **jamais affiché** dans l'UI (aucun usage JSX trouvé, seulement des affectations lors de la création d'objets optimistes locaux).

**R-17 — NON COMMENCÉ.** Les zones d'upload sont strictement un-fichier-par-type : un nouvel upload **remplace** le précédent (bouton « Remplacer » vs « Choisir », `DocumentUploadZone.tsx:209`). Pas de galerie multi-fichiers.

**R-18 — NON COMMENCÉ.** Aucune option « N/A » nulle part ; les listes de documents (`ALL_DOCUMENT_TYPES`, `DOCUMENT_MATRIX`) sont toutes en tout-ou-rien.

### 3.6 Permis de travail

**R-19 — PARTIEL.** Côté plan de prévention, l'heure est **déjà affichée** pour les examens et décisions HSE : `src/pages/planPrevention/PlanPreventionDetailPage.tsx:492` (`examineAt` via `toLocaleString`) et `:525` (`decidedAt` via `toLocaleString`) — mais il n'existe **aucun champ « soumisAt »** sur `PlanPrevention` (`types/planPrevention.ts:147-174`), donc pas d'heure de soumission affichable pour l'instant. Côté permis, c'est l'inverse : le champ `soumisAt` existe mais n'est affiché **qu'en date**, jamais avec l'heure — `src/pages/permitTravail/PermitTravailDetailPage.tsx:171` (`toLocaleDateString`), `:375` (décision, `toLocaleDateString`), et pareil dans `PermitTravailListPage.tsx:114` et `PermitTravailSuiviPage.tsx:356`.

**R-20 — NON COMMENCÉ.** `src/pages/permitTravail/PermitTravailCreatePage.tsx:160-162` : pour tout processus autre que « Nouveau site », `typePermisOptions = ['ELECTRIQUE', 'HAUTEUR']` — le permis Général n'est **même pas proposé**, a fortiori pas rendu obligatoire, contrairement à ce que demande R-20.

**R-21 — NON COMMENCÉ.** `src/lib/locales/fr.json:1906` : `"title": "Clôturer le permis"`. Aucune occurrence de « PV Environnement » comme libellé d'action/écran dans tout `src/` (le seul « PV Environnement » existant est `PV_ENVIRONNEMENT`, un type de document distinct utilisé en amont pour le processus Nouveau Site — sans rapport avec le libellé de l'action de clôture).

**R-22 — NON COMMENCÉ.** `CLOTURE_DOCUMENT_MATRIX` (`src/types/permitTravail.ts:138-141`) : `NOUVEAU_SITE: ['PV_CLOTURE_ENVIRONNEMENT', 'PV_FIN_TRAVAUX']`, `AUTRES: ['PHOTO_PROPRETE_SITE', 'PV_FIN_TRAVAUX']` — exactement les 2 documents déjà existants mentionnés par le retour, mais **aucun type `PHOTO_AVANT_TRAVAUX`/`PHOTO_APRES_TRAVAUX`** n'existe dans l'énumération `TypeDocumentPermitTravail` (lignes 52-69) ni dans la matrice.

**R-23 — NON COMMENCÉ.** Aucune logique conditionnelle APN/API dans `DOCUMENT_MATRIX` ni `CLOTURE_DOCUMENT_MATRIX`. Entièrement à construire, et bloqué tant que R-27 (colonnes KMZ) n'est pas fait.

### 3.7 Tableau de bord

**R-24 — FAIT.** Aucun bloc « validation du PV » dans `src/pages/dashboard/DashboardPage.tsx` (KPIs superadmin actuels : `plansValides`, `permisValides`, `permisClotures`, `tauxCloture`, lignes 165-172) ni dans `src/pages/hse/DashboardKpisPage.tsx`. Rien à retirer.

**R-25 — NON COMMENCÉ.** La clé i18n `dashboard.kpis.nbPermis` existe déjà (`fr.json:678`, `mg.json:678` — « Nb permis » / « Isan'ny permis ») mais n'est **utilisée nulle part** dans le code (clé orpheline). Aucun compteur brut du nombre total de permis dans `buildProfileKpis.ts` (`src/features/dashboard/buildProfileKpis.ts:55-138`, qui ne compte que des sous-ensembles par statut) ni dans `superAdminStatItems`.

**R-26 — NON COMMENCÉ.** Deux mécanismes de couleur existent mais aucun ne correspond à « type de projet » : (1) couleur par **statut** de planification dans le Gantt (`STATUS_COLORS`, `src/features/planning/components/GanttChart.tsx:11-16`) ; (2) couleur manuelle par **site** (`couleurMarqueur`, `types/referentiel.ts`, utilisée dans `SitesKmzMap.tsx:155` et `SiteTable.tsx:56`) — un attribut de référentiel de site, pas dérivé automatiquement du type de projet/processus.

**R-27 — NON COMMENCÉ.** `src/utils/kmzParser.ts:43-50` : seules les colonnes `Fokontany`, `Commune`, `District` sont extraites des `<Data>` du KML. Aucune colonne APN/API. `SitePrevention` (`types/planPrevention.ts:99-112`) n'a pas de champs `apn`/`api`. **Ce retour est le prérequis bloquant de R-09, R-10 et R-23**, conformément à l'ordre de dev demandé par le client.

### 3.8 Notifications

**R-28 — FAIT côté front (rien à coder), dépend entièrement du back.** Aucun écran de notifications dans le front (pas de route `/notifications`, pas de composant liste) — confirmé volontairement hors périmètre front par le document source lui-même. Les routes cibles pour les liens (`/prevention/:id`, `/permits-travail/:id`) sont déjà routées et fonctionnelles en accès direct (deep-link) dans `src/main.tsx:67-81` et `:131-137` — le back peut donc générer ces liens sans travail front supplémentaire.

---

## 4. Plan d'intervention ordonné

Respect de l'ordre imposé par le client : **R-04 → R-15 → R-23/R-27**, puis le reste.

1. **[R-04, structurant]** Retirer le bloc « Sections et tâches » de `PlanningFormPage.tsx` (garder en-tête + dates uniquement) ; retirer `PlanningSectionManager` de ce formulaire et le `sectionsPayload` associé. **Dépendance back** : le modèle `ActivityPlanning` doit cesser de porter les sections, ou celles-ci doivent devenir optionnelles/legacy côté API.
2. **[R-04 + R-08]** Construire la saisie des phases/modes opératoires **dans** `PlanPreventionCreatePage.tsx` (nouvelle étape ou extension de l'étape 1), en réutilisant `PlanningSectionManager`/`PlanningTaskTable` adaptés au contexte prévention. Renommer partout « Tâche » → « Mode opératoire » (clés i18n `planning.sections.col_tache` et dérivées). **Dépendance back** : nouvel endpoint pour créer/réordonner phases+tâches côté `PlanPrevention`.
3. **[R-05]** Corriger le fail-open de `PlanPreventionCreatePage.tsx:139-140` (`?? true`) ; confirmer avec le back la configuration des menu-access par rôle (ROLE_CHEF_PROJET → `/planning`, ROLE_PRESTATAIRE → `/prevention`).
4. **[R-15, structurant]** Créer un composant caméra partagé (`capture="environment"` ou `getUserMedia`) et l'intégrer dans les 3 zones d'upload : `DocumentUploadZone.tsx` (plan prévention), `PermitDocumentUploadZone.tsx` (permis), `SuiviDocumentUploadZone` (suivi journalier). **Dépendance back** : confirmer que l'endpoint Flysystem accepte toujours des fichiers image standard (pas de format spécifique attendu).
5. **[R-16]** Afficher `uploadedAt` (déjà présent dans le modèle) sur chaque vignette de document, une fois R-15 en place.
6. **[R-17]** Étendre les 3 zones d'upload au multi-fichiers par type + affichage galerie.
7. **[R-18]** Ajouter une option « N/A » par ligne de document et exclure ces lignes des contrôles de blocage (`missingDocuments`, `missingUploadedDocs`).
8. **[R-27, structurant]** Étendre `kmzParser.ts` pour lire 2 colonnes APN/API (0/1), ajouter `apn`/`api` à `SitePrevention` et propager jusqu'à l'UI d'import (`KmzImportButton.tsx`, `ImportKmzTable.tsx`, `GestionSitesPage.tsx`). **Dépendance back** : le fichier KMZ de référence doit être mis à jour par TOA, et l'API doit persister ces 2 champs.
9. **[R-09]** Une fois R-27 fait, ajouter l'alerte non bloquante multi-site APN/API dans `PlanPreventionCreatePage.tsx` (couvrir tous les sites de `activePlanif?.sites`, pas seulement le premier).
10. **[R-10]** Ajouter la validation bloquante « au moins un risque APN/API » dans `isStep1Invalid` du même formulaire.
11. **[R-23]** Étendre `DOCUMENT_MATRIX`/`CLOTURE_DOCUMENT_MATRIX` (`types/permitTravail.ts`) avec les pièces environnementales conditionnelles APN/API du §3 de `Retours_Consolides`, en réutilisant le flag apn/api posé en étape 8.
12. **[R-03]** Retirer/nettoyer la gestion du toast `planning.toast.createConflict` une fois le contrôle supprimé côté back (à coordonner, pas de blocage front avant confirmation back).
13. **[R-06]** Rien à faire — déjà conforme.
14. **[R-07]** Confirmer le scope backend de la collection `plan_prevention` pour ROLE_PRESTATAIRE ; ajouter un filtre front uniquement si le back ne le fait pas déjà.
15. **[R-11]** Ajouter un suivi de consultation des pièces (état local ou flag persistant côté back) et désactiver Valider/Refuser tant que tous les documents n'ont pas été ouverts au moins une fois, dans `PlanPreventionDetailPage.tsx`.
16. **[R-14]** Retirer les boutons/modales Valider/Refuser/Examiner de `PlanPreventionListPage.tsx` (`PlanRow`, lignes 191-208 et 459-490) ; ne garder qu'un lien vers le détail.
17. **[R-12]** Clarifier avec client/back qui peut refuser (Chef de Projet à l'étape « Examiner » vs HSE seul) ; ajouter l'option refus à `ExaminerModal.tsx` si nécessaire.
18. **[R-19]** Remplacer `toLocaleDateString` par `toLocaleString` (ou afficher heure séparément) sur les 4 emplacements permis identifiés (`PermitTravailDetailPage.tsx:171,375`, `PermitTravailListPage.tsx:114`, `PermitTravailSuiviPage.tsx:356`). **Dépendance back** : ajouter un champ `soumisAt` à `PlanPrevention` pour le volet plan de prévention.
19. **[R-20]** Revoir `PermitTravailCreatePage.tsx:156-162` et `permitCreationTransition.ts` pour rendre GENERAL obligatoire/premier permis sur tout processus hors « Nouveau site ». **Dépendance back** : `PermitDocumentRequirementResolver` doit rester synchronisé (commentaire déjà présent dans `types/permitTravail.ts:90-94`).
20. **[R-21]** Renommer la clé i18n `permitTravail.components.cloturerModal.title` (et libellés associés) « Clôturer le permis » → texte incluant « PV Environnement », dans `fr.json` et `mg.json`.
21. **[R-22]** Ajouter les types `PHOTO_AVANT_TRAVAUX`/`PHOTO_APRES_TRAVAUX` à `TypeDocumentPermitTravail` et à `CLOTURE_DOCUMENT_MATRIX` (les deux buckets), à réaliser après R-15 pour bénéficier de la capture photo directe.
22. **[R-25]** Brancher la clé i18n `dashboard.kpis.nbPermis` déjà existante sur un vrai compteur total dans `StatStrip`/`buildProfileKpis.ts`.
23. **[R-26]** Introduire une palette couleur automatique par `typeIntervention`/`process`, à appliquer dans le Gantt (`GanttChart.tsx`) et/ou la carte dashboard.
24. **[R-01, R-02]** Copier les logos ISO dans `public/images`, les intégrer dans `LoginPage.tsx`, extraire le titre en clé i18n et le renommer.
25. **[R-13, R-24, R-28]** Rien à faire côté front ; s'assurer côté back que la portée des notifications et les liens d'email pointent bien vers les routes déjà existantes.

---

## 5. Risques et points d'attention techniques

- **Fichiers orphelins confirmés** (aucun import trouvé nulle part dans `src/`, non routés dans `main.tsx`) : `src/pages/prevention/PreventionListPage.tsx`, `PreventionDetailPage.tsx`, `PreventionFormPage.tsx`. Ils utilisent un ancien modèle (`usePermitStore().plansPrevention`, jamais alimenté) totalement différent du flux actif (`planPreventionApi` + `features/planPrevention/hooks/usePlanPrevention.ts`). À supprimer pour éviter toute confusion de maintenance — un développeur pourrait éditer ces fichiers en pensant toucher le module actif.
- **`Taches_toa-front.md` est en grande partie obsolète** sur sa section « P0 — Doublons de pages et routage » : `src/main.tsx` ne route déjà plus aucun stub à la racine de `pages/` (dashboard, statistics, permits, prevention, interventions pointent tous vers les versions complètes en sous-dossier). Ce module de la liste de tâches ne doit pas être repris tel quel.
- **Incohérence de nommage de dossiers** : le module « Plan de prévention » est réparti entre `src/pages/prevention/` (liste) et `src/pages/planPrevention/` (create/detail/edit) — source de confusion pour les futures features (ex. R-08 va devoir toucher les deux).
- **Fail-open de permissions** : `PlanPreventionCreatePage.tsx:139-140` autorise la création par défaut (`?? true`) si les permissions ne sont pas encore résolues — à corriger indépendamment des retours client, car cela affaiblit R-05.
- **Incohérence de rôle potentielle R-11/R-12/R-14** : le retour classe ces actions sous « Chef de projet », mais le code actuel sépare strictement « Examiner » (Chef de Projet, sans option refus) de « Valider/Refuser » (HSE uniquement). Le plan d'intervention §4 propose une clarification avant développement pour éviter une reprise.
- **R-19 dépend d'un trou de données back** : sans champ `soumisAt` sur `PlanPrevention`, le calcul de délai souhaité par le client (heure soumission → heure validation) restera impossible côté plan de prévention même après le fix d'affichage front.
- **Ordre de dépendances R-09/R-10/R-23 vs R-27** : les trois premiers retours sont totalement inertes tant que R-27 (colonnes APN/API du KMZ) n'est pas livré côté back+front — confirmé par l'absence totale du concept APN/API dans le code actuel.
- **Statistics page** (`src/pages/statistics/StatisticsPage.tsx`) et **Dashboard** (`src/pages/dashboard/DashboardPage.tsx`) sont déjà branchés à des API réelles (pas de données en dur `demoStats` trouvées) — contrairement à ce que suggérait l'ancien audit ; à ne pas retraiter inutilement.
