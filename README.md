# ft_transcendence
Bataille navale revisitée

# Idees principales
- Grille cachée
- Tour par tour
- Jouable jusqu'a 4 joueurs (grille plus grande) (solo, duo possible pour 4j)
- Capacaites speciales
- Bot (adversaire)
- Gestion utilisateur et amis
- Partie Privée (invitation par code ou la liste d'amis) / Publique
- Tournoi (augmente / diminue le score (sauf 1v1 bot))
- Systeme de chat pour le mode duo
- Leaderboard
- Securite pour le score si une personne quitte trop vite (en mode 3j et 4j, peut etre remplacer le joueur qui quitte par un bot)
- 
# Commandes pour la partie dev
- si le projet vient d'etre cloné ou qu'un membre a ajouté une dependance avec `pnpm`, rendez vous dans `backend` et faite `pnpm i` (pareil coté `frontend`)
- Dans un premier terminal, se rendre dans le dossier `frontend` et faire `pnpm run dev`
- Dans un second terminal, se mettre a la racine du projet et faire `make`: cela demarre le serveur (coté back) et la bdd
- Pour ajouter une table a la bdd, se rendre dans `backend/prisma/schema.prisma`
- Apres une modification dans le fichier `prisma`, ouvrez un troisieme terminal à la racine du projet et faites `make migrate name=...` le `name` sera utilisé dans le fichier créé par prisma donc soyez explicite exemple: `add_friends_table`
- Pour afficher le contenu de la bdd (un peu comme PhpMyAdmin ou Adminer) faite `make studio` dans un nouveau terminal (quand le serveur est demarré)

## Roles
* **Product Owner (PO)** : Définit la vision du produit, priorise les fonctionnalités et s'assure que le projet répond aux besoins des utilisateurs.
  * Maintient le **Product Backlog**.
  * Prend les décisions concernant les fonctionnalités et les priorités.
  * Valide le travail réalisé.
  * Communique avec les parties prenantes (évaluateurs, pairs).

* **Chef de projet (PM) / Scrum Master** - `ALEXIS` : Facilite la coordination de l'équipe et supprime les obstacles.
  * Organise les réunions d'équipe et les sessions de planification.
  * Suit l'avancement du projet et les échéances.
  * Veille à une communication efficace au sein de l'équipe.
  * Gère les risques et les blocages.

* **Responsable technique / Architecte** - `TOM` : Supervise les décisions techniques et l'architecture du projet.
  * Définit l'architecture technique.
  * Choisit la pile technologique (*technology stack*).
  * Garantit la qualité du code et le respect des bonnes pratiques.
  * Révise les modifications critiques du code.

* **Développeurs (tous les membres de l'équipe)** : Implémentent les fonctionnalités et les différents modules.
  * Développent le code des fonctionnalités qui leur sont attribuées.
  * Participent aux revues de code (*code reviews*).
  * Testent leurs implémentations.
  * Documentent leur travail.