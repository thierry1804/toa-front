# Product

## Register

product

## Users

Personnel HSE (Hygiène Sécurité Environnement), administrateurs, chefs de projet (CPE), prestataires/entreprises intervenantes de TowerCo of Africa Madagascar. Utilisation mixte terrain (tablette, connectivité intermittente, extérieur, lumière directe) et bureau (desktop, tâches administratives, gestion de rôles et référentiels). Le travail se fait sous contrainte réglementaire : permis de travail, plans de prévention, suivi d'intervention doivent être remplis et validés correctement, souvent dans l'urgence ou sur site.

## Product Purpose

TOA Frontend est la SPA/PWA qui pilote la sécurité opérationnelle des sites télécoms : création et validation de plans de prévention, permis de travail (général/électrique/hauteur) avec suivi journalier, planification des interventions prestataires, suivi terrain avec évaluation des risques, référentiel des sites/entreprises/installations, gestion des utilisateurs et rôles. Succès = un utilisateur HSE ou prestataire peut accomplir sa tâche (remplir un permis, valider un plan, consulter un statut) vite et sans ambiguïté, y compris hors ligne sur le terrain.

## Brand Personality

Rapide, efficace, dense. Pas d'habillage décoratif : chaque écran doit permettre d'exécuter une tâche réglementaire avec le minimum de friction. La confiance vient de la clarté des statuts et permissions, pas d'éléments de marque.

## Anti-references

Look SaaS générique : pas de dégradés gratuits, pas de grilles de cartes icône+titre+texte répétées à l'identique, pas de glassmorphism décoratif, pas de "hero metric" avec gros chiffre + dégradé. Référence de qualité structurelle visée : Stripe Dashboard (densité de données, hiérarchie claire par rôle/permission, précision).

## Design Principles

1. Statut et permission toujours visibles avant action — l'utilisateur ne doit jamais deviner s'il peut créer/valider/modifier.
2. Densité utile, pas décorative — chaque écran priorise l'exécution rapide de la tâche réglementaire sur l'esthétique.
3. Le mode hors-ligne est un état de première classe, pas une dégradation silencieuse — toujours visible et explicite (queue en attente, sync en cours).
4. Terrain et bureau sont deux contextes d'usage réels — cibles tactiles ≥44px, contraste fort exploitable en extérieur, densité d'info plus élevée acceptable sur desktop.
5. Workflow avant décoration — statuts, validations, historiques et permissions structurent l'écran ; le style visuel ne doit jamais masquer où en est un dossier.

## Accessibility & Inclusion

Contexte mixte terrain (tablette, extérieur, lumière directe, connectivité intermittente) et bureau (desktop). Cibles tactiles ≥44px déjà en place (PWA). Contraste renforcé requis pour lisibilité en extérieur. État offline/sync doit rester perceptible sans dépendre uniquement de la couleur (icône + texte).
