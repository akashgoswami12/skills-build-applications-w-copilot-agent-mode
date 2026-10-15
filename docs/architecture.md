# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- **Presentation tier:** Keep each capability in its existing React page and use the shared API client for all `/api` requests. Pages own presentation state (loading, empty, and accessible error states); business rules and persistence stay in the backend.
- **Logic tier:** Keep Express routes thin and put input validation, orchestration, and response-ready capability logic in backend services. Return deliberate 4xx responses for invalid input, malformed or unknown IDs, and unknown users; do not expose database cast errors as 500s.
- **Data tier:** Enforce required fields and valid value constraints in Mongoose models, represent user/team relationships with references, and keep seed data representative and idempotent. MongoDB remains the source of persisted application data.
- **Activity tracking:** Validate the request shape and confirm both referenced records exist before creating an activity. Persist the referenced user and team, activity type, minutes, computed points, and occurrence time; use the same persisted points for the leaderboard.
- **Team management:** Validate required team data (especially a non-empty name), persist mascot and member references, and return created/listed teams with their names and mascots intact.
- **Leaderboard:** Aggregate activity points by team in the backend, sort from highest total to lowest, and assign ranks starting at 1. Return the documented `teamName`, `totalPoints`, and `rank` fields.
- **Workout suggestions:** Find the requested user by email, use that user's goal and recent activity to select relevant workouts, and include a reason tied to the matching goal or activity. Return a deliberate 4xx when no user matches.
- **Scope:** Do not add authentication in this exercise; it remains a follow-up challenge.

## Test plan

Run focused contract tests in dependency order (data, API, then presentation), followed by both production builds. A failing contract test indicates behavior or validation missing from that tier; a build failure indicates a type-check or production compilation problem.

Baseline results recorded on 2026-10-15:

- **Data tier —** `npm run test:data --prefix octofit-tracker/backend`: 4 of 5 tests failed because required model validation is missing for users, teams, activities, and workouts. The idempotent seed test passed.
- **API —** `npm run test:api --prefix octofit-tracker/backend`: 4 of 4 tests failed. Invalid activity/team requests returned `501` rather than `400`, the leaderboard was empty, and suggestions did not match the user's expected activity pattern.
- **Frontend —** `npm test --prefix octofit-tracker/frontend`: 15 of 15 tests failed. API-backed content and user-specific suggestion requests were missing, as were the expected accessible loading, empty, and error states.
- **Backend build —** `npm run build --prefix octofit-tracker/backend`: passed.
- **Frontend build —** `npm run build --prefix octofit-tracker/frontend`: passed.
