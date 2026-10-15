# Parcours terrain — 13 octobre 2026

## Fonctionnement

- Le tableau de bord terrain ouvre « Ma journée » : suivis à saisir, déjà renseignés par l'équipe, en attente de synchronisation, ou permis à vérifier.
- Un suivi déjà renseigné aujourd'hui renvoie vers sa consultation/modification plutôt que vers une deuxième création. Le serveur conserve la contrainte d'un suivi par intervention et par date.
- Le carnet regroupe les interventions du même site et du même plan de prévention. Sans plan, chaque permis reste distinct.
- Le carnet présente le journal, les phases, les photos et les liens vers les permis et leur circuit de clôture existant.
- Les statuts et dates des interventions utilisent une présentation partagée avec le tableau de bord.
- La création de permis dépend de `canCreate` sur `/permits-travail`, dans la matrice de menus configurée par l'admin. Bouton, route et voter utilisent cette même source, sans condition sur le nom du rôle et sans autorisation supplémentaire issue de `role_action`. Le menu est rafraîchi au retour sur l'application, à la reconnexion et toutes les minutes en ligne.

## Mise en service du serveur

Les modifications de l'interface fonctionnent avec l'ancienne API. La saisie des phases et des dangers reste masquée tant que l'intervention ne renvoie pas `suiviTerrainVersion: 1`, afin de ne pas accepter des données que le serveur ne conserverait pas.

Déployer les changements de `toa-back` avec les migrations Doctrine :

1. `Version20261013190000` : phases, dangers et rattachement des photos aux phases.

Appliquer la migration selon la procédure habituelle du serveur. La migration de permissions précédemment préparée (`Version20261013191000`) a été retirée avant exécution : la configuration admin existante reste inchangée.

Aucune migration ni aucun déploiement distant n'a été exécuté pendant ce travail. Le contrôle serveur fondé sur la matrice de menus nécessite le déploiement du voter corrigé, sans migration des droits. L'affectation reste celle de l'application existante (créateur/entreprise), sans ajout d'une affectation nominative.

## Vérifications

Compilation TypeScript et Vite réussies. Tests ciblés : calcul des états quotidiens, pagination, cohérence des statuts, permissions HSE et conservation des métadonnées hors ligne. Tests PHP exécutés avec PHP 8.4 : validation des phases/dangers et autorisation de création des permis. PHPUnit signale des notices sur les doubles de tests du voter, sans échec d'assertion.

Vérification en lecture dans le navigateur : trois suivis du jour, regroupement des deux interventions de TVAT126, journal et phases du plan. Aucun suivi ni permis réel n'a été créé pour les tests.
