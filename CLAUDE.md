# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Projet

**Finloop / Finthesis** — SaaS comptable pour cabinets d'expertise-comptable (Raly Conseils). Le cabinet importe des FEC, visualise les états financiers, et partage des rapports d'activité avec ses clients dirigeants.

- **UI langue** : Français uniquement
- **Charte couleurs** : vert `#2D5A3D` (primary), orange `#E8621A` (accent)
- **Typographie** : Syne (Google Fonts — 400/500/600/700)
- **Déployé sur** : Vercel, remote Git = `finloop` (pas `origin`)

---

## Commandes essentielles

### Développement local

```bash
# Backend (port 3001)
npm run dev -w packages/server

# Frontend (port 5173)
npm run dev -w packages/web

# Les deux en parallèle
npm run dev
```

### Build (ordre obligatoire)

```bash
cd packages/shared && npx tsc
cd packages/engine && npx tsc
cd packages/server && npx tsc
cd packages/web && npx vite build
```

> ⚠️ Toujours builder `shared` **avant** `engine`, `engine` **avant** `server`. Les `dist/` générés sont importés par les packages en aval. Ne jamais git-ajouter `packages/*/dist/`.

### Commit (sans push — l'utilisateur pousse lui-même)

```bash
git add <fichiers spécifiques>
git commit -m "feat(...): ..."
# NE PAS faire git push — l'utilisateur push vers le remote 'finloop'
```

---

## Architecture des packages

```
packages/shared    → types, constantes, utilitaires (aucune dépendance)
packages/engine    → analyseurs financiers (importe shared)
packages/server    → API Hono/Express (importe engine + shared)
packages/web       → Frontend React + Vite (importe shared uniquement)
api/[[...route]].ts → Entry point Vercel serverless (wrap packages/server/dist/app)
```

### `@finthesis/shared`

Types TypeScript partagés entre tous les packages. Toute modification de type ici impose un rebuild de toute la chaîne.

Fichiers clés :
- `src/types/financial.types.ts` — `Bilan`, `Sig`, `SigLevel`, `DashboardKpis`, `CompteAggregate`
- `src/types/rapport.types.ts` — `RatioFinancier` (avec `categorie?: 'sig' | 'bilan'`), `RapportActiviteData`, `ChargeClassDetail`
- `src/types/company.types.ts` — `Company` (avec `dirigeant: string | null`), `CreateCompanyDto`
- `src/constants/sig.constants.ts` — `SIG_FORMULAS`, `SIG_COMPUTATION_ORDER`, `SIG_DEPENDENCIES`
- `src/constants/pcg.constants.ts` — `PCG_MAIN_ACCOUNTS` (mapping 2-chiffres → libellé)

### `@finthesis/engine`

Calculs financiers purs à partir des `CompteAggregate[]` (agrégats Knex). Aucun accès DB, aucun effet de bord.

- `analyzers/sig.analyzer.ts` — `computeSig()` : calcule les 9 niveaux SIG, inclut `compteRacines` (2 premiers chiffres) dans chaque detail
- `analyzers/bilan.analyzer.ts` — `computeBilan()`
- `analyzers/kpi.analyzer.ts` — `computeKpis()`
- `parsers/fec.parser.ts` — Parse les fichiers FEC (format INSEE)

### `@finthesis/server`

API Express exposée sur `/api/v1`. Auth via Supabase JWT (middleware `authMiddleware`).

**Services critiques :**
- `services/rapport.service.ts` — Génère `RapportActiviteData` complet. Inclut le lookup SIREN en temps réel si `company.dirigeant` est null. Contient `buildRatios()` (9 ratios taggés `categorie: 'sig'|'bilan'`) et `buildChargesDetaillees()`.
- `services/analysis.service.ts` — Wrapper avec cache (`getCachedOrCompute`) qui appelle les analyzers engine.
- `services/company.service.ts` — CRUD sociétés, stocke le champ `dirigeant`.
- `data/naf-benchmarks.ts` — 244 codes NAF avec 9 ratios sectoriels (`tauxMargeBrute`, `rentabiliteNette`, `autonomieFinanciere`, `endettement`, `bfrJours`, `delaiClient`, `delaiFournisseur`, `tauxVA`, `tauxEBE`).

**Migrations Knex :**
- Fichiers dans `src/db/migrations/001_*.ts` à `012_*.ts`
- `src/db/migrationSource.ts` — Import statique de toutes les migrations (requis pour Vercel serverless qui n'a pas accès au filesystem)
- ⚠️ Tout ajout de migration = ajouter l'import ET l'entrée dans `migrationSource.ts`

### `@finthesis/web`

React 19 + Vite + Tailwind CSS v4 + Zustand + React Query.

**Tailwind v4** : La config est dans `src/styles/globals.css` avec `@import "tailwindcss"` et un bloc `@theme`. Pas de `tailwind.config.js`.

**Stores Zustand** (`src/store/`) :
- `companyStore.ts` — Société + exercice sélectionnés. Persiste dans localStorage : `finloop_company_id`, `finloop_fy_id`
- `authStore.ts` — Session Supabase (non persisté, géré par Supabase)

**localStorage flags** :
- `finloop_company_id` — ID société sélectionnée
- `finloop_fy_id` — ID exercice sélectionné
- `finloop_onboarded` — `'1'` après la première connexion (évite de réafficher WelcomePage)

**Client API** (`src/api/client.ts`) : Axios avec intercepteur qui injecte automatiquement le JWT Supabase (`Authorization: Bearer <token>`) et gère le refresh sur 401.

**Pages principales** :
- `RapportActivitePage.tsx` — 2 sections : `SIGSection` + `BilanDetailSection`. Composant `ExpertTooltip` en `position: fixed` (évite le clipping par `overflow-hidden`). Ratios filtrés par `categorie`.
- `AdminPage.tsx` — Gestion des utilisateurs (rôle admin uniquement)
- `ImportPage.tsx` — Upload FEC/CSV/Excel

---

## Vercel & déploiement

Le fichier `api/[[...route]].ts` est le seul point d'entrée serverless. Il :
1. Importe `packages/server/dist/app` (build obligatoire avant deploy)
2. À la première requête : exécute `db.migrate.latest()` puis seede les utilisateurs et données de test
3. Réutilise l'instance Express pour toutes les requêtes suivantes

La DB Knex utilise un `Proxy` lazy pour éviter de charger `better-sqlite3` sur Vercel (PostgreSQL uniquement en prod, SQLite en dev local).

**Remote Git Vercel** : `finloop` (pas `origin`). L'utilisateur push lui-même, ne jamais exécuter `git push`.

---

## Auth Supabase

Le middleware `auth.middleware.ts` :
1. Extrait le Bearer token
2. Décode le header JWT pour déterminer l'algorithme (`ES256` ou `HS256`)
3. ES256 → fetch JWKS depuis `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` (cache 10 min)
4. HS256 → vérifie avec `SUPABASE_JWT_SECRET`
5. Extrait `req.userId = decoded.sub` et `req.userRole = decoded.app_metadata?.role`
6. Rôle admin : vérifié dans `app_metadata.role === 'admin'` côté Supabase

---

## Variables d'environnement

| Variable | Usage |
|---|---|
| `DATABASE_URL` / `POSTGRES_URL` | PostgreSQL (prod Vercel) |
| `DATABASE_TYPE` | `sqlite` (dev) ou `postgresql` (prod) |
| `SUPABASE_URL` | URL projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service (backend uniquement) |
| `SUPABASE_JWT_SECRET` | Secret JWT (≥ 32 chars) |
| `VITE_SUPABASE_URL` | URL Supabase (frontend) |
| `VITE_SUPABASE_ANON_KEY` | Clé anon Supabase (frontend) |
| `VITE_API_URL` | Base URL API (`http://localhost:3001/api/v1` en dev) |

---

## Flux de données : Rapport d'Activité

```
FEC import → ecritures (DB)
  → getAggregatesForRapport() [SQL GROUP BY compte_num]
  → computeSig() / computeBilan() / computeKpis() [engine]
  → buildRatios() [9 ratios, taggés sig/bilan, comparés aux benchmarks NAF]
  → buildChargesDetaillees() [groupés par classe 60-69]
  → RapportActiviteData → RapportActivitePage.tsx
                            ├── SIGSection (ratios filtrés categorie=sig)
                            └── BilanDetailSection (ratios filtrés categorie=bilan)
```

**Dirigeant** : Stocké dans `companies.dirigeant`. Si null au moment de générer le rapport et que le SIREN existe, `rapport.service.ts` fait un appel live à `https://recherche-entreprises.api.gouv.fr/search?q={siren}` et met à jour la DB.

---

## Conventions de code

- **`let company`** (pas `const`) dans `rapport.service.ts` — nécessaire pour la réassignation après lookup SIREN
- Nouveaux ratios dans `buildRatios()` → toujours ajouter le champ `categorie: 'sig' | 'bilan'`
- Nouveaux niveaux SIG → mettre à jour `SIG_FORMULAS`, `SIG_COMPUTATION_ORDER`, `SIG_DEPENDENCIES` dans `shared/src/constants/sig.constants.ts`
- Nouvelles migrations → toujours mettre à jour `migrationSource.ts` (import statique)
- `ExpertTooltip` utilise `position: fixed` + `getBoundingClientRect()` — ne pas revenir à `absolute` (clipping par les parents `overflow-hidden`)
