# Psychometric Test

A multi-user psychometric questionnaire platform with:

- Username/password accounts and multiple administrators
- Repeat attempts with permanent user-wise response history
- RIASEC, OCEAN, HBDI, and EQ scoring
- Administrator questionnaire creation and Excel import
- Grok-assisted draft reports with mandatory administrator review
- Published user reports with PDF download
- Consent capture, audit logging, and user-history deletion

## Local setup

```powershell
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

Demo accounts:

- Administrator: `admin` / `admin123`
- User: `student` / `student123`

Change these passwords and `AUTH_SECRET` before deployment.

## Grok configuration

Open `.env` and insert the key here:

```env
GROK_API_KEY="INSERT_GROK_API_KEY_HERE"
```

The provider URL and model are configurable:

```env
GROK_BASE_URL="https://api.x.ai/v1"
GROK_MODEL="grok-3-mini"
```

Insert the custom report-writing instruction here when it is ready:

```env
AI_REPORT_INSTRUCTIONS="INSERT_CUSTOM_AI_REPORT_INSTRUCTIONS_HERE"
```

Without a Grok key, the application produces a structured local draft so the review workflow remains usable.

## Excel questionnaire format

Use one row per answer option and these exact column headers:

```text
Questionnaire
Audience
Section
Model
Trait
Question
Option Label
Option Text
Scoring JSON
Admin Note
```

Example scoring JSON:

```json
{"RIASEC":{"Realistic":3,"Enterprising":1}}
```

## Production note

SQLite is suitable for local development. Before a multi-user production launch, switch Prisma to managed PostgreSQL, configure backups, use HTTPS, and review privacy/consent wording for the operating country.
