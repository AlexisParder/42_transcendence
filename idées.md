```md
1. Arène de robots programmables ("code your bot")
Les joueurs ne jouent pas directement : ils programment un petit robot via une interface visuelle (type Blockly) ou un mini-langage, puis les robots s'affrontent dans une arène temps réel. Personne ne fait ça à 42, c'est techniquement riche, et ça colle à ton profil dev/game. Le mode spectateur devient central (on regarde les combats), les tournois et l'IA "bot de référence" tombent naturellement.
Modules : jeu web (2) + multijoueur 3+ (2) + IA adversaire (2) + frameworks (2) + ORM (1) + spectateur (1) + tournoi (1) + customisation (1) + user management (2) = 14+ sans forcer.
```
```md
2. Jeu de déduction sociale (type Loup-Garou / Secret Hitler)
Parties temps réel avec rôles cachés, discussion, votes, phases jour/nuit. Le chat n'est pas un bonus posé à côté : c'est le cœur du gameplay, ce qui rend la combinaison de modules très cohérente (rare dans ce projet). Excellent pour 4-5 personnes car chacun peut prendre un rôle/phase.
Modules : jeu web (2) + multijoueur 3+ (2) + WebSockets temps réel (2) + interaction/chat (2) + chat avancé (1) + frameworks (2) + user management (2) = 13+, tu ajoutes ORM ou 2FA pour la marge.
```
```md
3. Coopératif asymétrique "désamorçage de bombe" (type Keep Talking and Nobody Explodes)
Un joueur voit la bombe à l'écran, les autres ont le manuel mais pas l'écran, et ils doivent communiquer pour désamorcer dans le temps imparti. L'asymétrie d'information force une vraie synchro temps réel et rend l'expérience mémorable en éval. Très peu vu sur le web.
Modules : jeu web (2) + joueurs distants (2) + multijoueur 3+ (2) + temps réel (2) + frameworks (2) + user management (2) = 12, + intégration voix (1, module IA) qui a ici un vrai sens.
```
```md
4. Roguelike / donjon coopératif au tour par tour, à seed partageable
Génération procédurale de donjons (tu as déjà bossé la PCG sous UE, ça te parlera), les équipes affrontent le même seed pour comparer les runs, classement, historique. Tu peux même brancher le module blockchain pour stocker les scores de tournoi de façon immuable — c'est original et ça justifie proprement un module compliqué.
Modules : jeu web (2) + multijoueur 3+ (2) + IA (monstres, 2) + frameworks (2) + stats/historique (1) + gamification (1) + tournoi (1) + user mgmt (2) = 13+.
```
```md
5. Plateforme avec éditeur de niveaux (contenu créé par les joueurs)
Un jeu de plateforme/physique où les joueurs construisent et publient leurs propres niveaux, jouables par les autres avec classements (multijoueur asynchrone via "fantômes"/scores). L'éditeur = système de contenu réutilisable, upload, recherche/filtres. Ça change des projets "une seule map figée".
Modules : jeu web (2) + frameworks (2) + upload/gestion fichiers (1) + recherche avancée (1) + design system custom (1) + user mgmt (2) + stats (1) + gamification (1) = 11+, complète avec joueurs distants.
```
```md
6. Snake multijoueur / Slither-like
Chacun contrôle un serpent qui grandit, arène partagée en temps réel, on coupe les autres pour les éliminer. Simple à comprendre mais nerveux, et le temps réel + synchro à plusieurs est un vrai défi technique (interpolation, gestion de la latence). Le mode spectateur et le classement viennent tout seuls.
Jeu web (2) + multijoueur 3+ (2) + joueurs distants (2) + temps réel (2) + user mgmt (2) + stats (1) + spectateur (1) = 12+.
```
```md
7. Puzzle en duel façon Tetris/Puyo compétitif
Deux joueurs côte à côte, quand tu fais des lignes tu envoies des "malus" chez l'adversaire. Très addictif, gameplay clair, et le versus temps réel est parfait pour l'éval. L'IA adversaire est faisable et intéressante à expliquer.
Jeu web (2) + joueurs distants (2) + IA (2) + frameworks (2) + tournoi (1) + customisation (1) + user mgmt (2) = 12+.
```
```md
8. Jeu de dessine-et-devine (type Skribbl / Pictionary)
Un joueur dessine un mot, les autres devinent dans le chat en temps réel, rotation des tours, points. Le dessin collaboratif temps réel coche un module à lui seul, et le chat est au cœur du jeu (cohérent, pas plaqué).
Jeu web (2) + multijoueur 3+ (2) + temps réel (2) + collaboratif temps réel (1) + interaction/chat (2) + user mgmt (2) = 11+, + chat avancé.
```
```md
9. Bataille navale revisitée
Grille cachée, tir à tour de rôle, mais tu peux ajouter des twists originaux : brouillard, capacités spéciales (radar, mine, double tir), plateau plus grand à 3-4 joueurs. Tour par tour donc plus simple côté synchro, et l'IA se code proprement (probabilités de ciblage — expliquable en éval).
Jeu web (2) + IA (2) + multijoueur 3+ (2) + frameworks (2) + customisation (1) + tournoi (1) + user mgmt (2) = 12+.
```
```md
10. Puissance 4 / Gomoku en 3D
Un classique mais projeté en 3D avec Three.js (tu as déjà touché à la 3D sous UE, ça te parlera), ce qui débloque le module "3D avancée" à 2 points et change complètement le rendu. Gameplay carré, IA minimax facile à justifier.
Jeu web (2) + 3D avancée (2) + IA (2) + joueurs distants (2) + frameworks (2) + user mgmt (2) = 12+.
```
```md
11. Course de dactylo (typing race, type TypeRacer)
Les joueurs tapent un texte le plus vite possible, progression en temps réel façon course. Original, très visuel, facile à rendre juste, et le multijoueur temps réel est le cœur. Bon pour un module i18n aussi (textes en plusieurs langues).
Jeu web (2) + multijoueur 3+ (2) + temps réel (2) + frameworks (2) + user mgmt (2) + stats (1) + multi-langues (1) = 12+.
```
```md
12. Air hockey en ligne
Physique temps réel à deux, palet et maillets, rebonds. Nerveux comme Pong mais plus riche visuellement, et la physique + latence est un vrai sujet technique. IA possible et sympa à expliquer.
Jeu web (2) + joueurs distants (2) + IA (2) + temps réel (2) + frameworks (2) + user mgmt (2) = 12+.
```
```md
13. Jeu de cartes à collectionner / bataille de cartes simple
Deck-building léger, chaque joueur pose des cartes avec effets, tour par tour. Riche en systèmes (collection = upload/gestion, matchmaking, stats), et l'IA adversaire est un beau morceau. Attention : c'est le plus gros en contenu à équilibrer.
Jeu web (2) + IA (2) + matchmaking/2e couche (2) + frameworks (2) + stats (1) + user mgmt (2) = 11+.
```