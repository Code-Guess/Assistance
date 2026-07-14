# PDF Tutor AI — Backend

Standalone Node/Express API for the PDF Tutor AI mobile app. This folder is
self-contained (its own `package.json`, no monorepo dependencies) so it can
be pushed to its own Git repository and deployed independently, e.g. on
Render.

It is a **stateless proxy**: no database, no sessions. Every request from
the mobile app carries all the context it needs (document text, chapter
list, chat history); the server never stores anything.

## Endpoints

All routes are mounted under `/api`:

- `GET /api/healthz` → `{ "status": "ok" }`
- `POST /api/tutor/extract` — body `{ file_base64, file_name }`, returns
  `{ text, chapters }`.
- `POST /api/tutor/chat` — body `{ document_text, current_chapter, chapters,
  history, message, images? }`, returns `{ reply, advance_chapter }`.

## Environment variables

| Variable            | Required | Notes                                             |
| ------------------- | -------- | -------------------------------------------------- |
| `OPENROUTER_API_KEY` | yes      | From https://openrouter.ai/keys                    |
| `PORT`               | no       | Render sets this automatically; defaults to 8080   |

## Deploying on Render

1. Push this `backend/` folder as the root of its own Git repository (e.g.
   `Code-Guess/Assistance`).
2. In the Render dashboard, create/keep a **Web Service** pointed at that
   repo.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add the `OPENROUTER_API_KEY` environment variable under
   **Environment**, then deploy.
6. Once live, the service answers at
   `https://<your-service>.onrender.com/api/...` — verify with:
   `curl https://<your-service>.onrender.com/api/healthz`

## Local development

```bash
npm install
cp .env.example .env   # then fill in OPENROUTER_API_KEY
npm run dev
```
# Assistance
# Assistance
