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

- Presentation tier decision: Render API-backed content in the existing React pages through the shared API client. A shared resource hook handles loading and failure states; each page renders its own empty and success states.
- Logic tier decision: Keep Express routes thin and put validation, orchestration, and response-ready capability logic in backend services. Return deliberate 4xx responses for invalid input, malformed or unknown IDs, and unknown users; never expose database cast errors as 500s.
- Data tier decision: Enforce required fields and positive duration constraints in Mongoose models, represent user/team relationships with references, and keep seed data representative and idempotent. MongoDB remains the source of persisted application data.
- Activity tracking approach: Validate the request and confirm the user and team exist before creating an activity. Store the activity type, positive minutes, one point per minute, and the server's occurrence time; use those persisted points for the leaderboard.
- Team management approach: Require a non-empty name and mascot, validate that each supplied member ID identifies an existing user, and persist member references. Keep created and listed team names and mascots intact.
- Leaderboard approach: Aggregate persisted activity points by team, order totals highest first with a stable team-ID tie-break, and assign 1-based ranks. Return the documented `teamName`, `totalPoints`, and `rank` fields.
- Workout suggestions approach: Find the user by email, then try workouts matching the user's fitness goal followed by their most recent activity types (up to ten records). Include a reason explaining the goal or activity match and return `404` when the email is unknown.
- **Scope:** Do not add authentication in this exercise; it remains a follow-up challenge.

## Test plan

Run focused contract tests in dependency order (data, API, then presentation), followed by both production builds. A failing contract test indicates behavior or validation missing from that tier; a build failure indicates a type-check or production compilation problem.

Verification results recorded on 2026-10-15:

- **Data tier —** `npm run test:data --prefix octofit-tracker/backend`: 5 of 5 tests passed, including model validation and idempotent seeding.
- **API —** `npm run test:api --prefix octofit-tracker/backend`: 4 of 4 tests passed, covering valid creation, deliberate 4xx responses, leaderboard ordering, and personalized recommendations.
- **Frontend —** `npm test --prefix octofit-tracker/frontend`: 15 of 15 tests passed, covering API-backed content and accessible loading, empty, and error states.
- **Backend build —** `npm run build --prefix octofit-tracker/backend`: passed.
- **Frontend build —** `npm run build --prefix octofit-tracker/frontend`: passed.
- **Repository exercise validation —** `node --test tests/exercise-validation.test.mjs`: currently reports a failure in the block-scalar workflow fixture because the repository README copy badge does not match the validator's expected template owner/name. The architecture and app-tier grading checks pass.
