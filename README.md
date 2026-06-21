# AI Asset Studio

AI image packs & avatar generator. Generate batches of visuals with ComfyUI,
browse a catalog, and license/download with Stripe. Next.js 14 (App Router) +
Prisma + NextAuth + Stripe + ComfyUI + n8n, deployable to Vercel.

## Stack

| Layer    | Tech                                    |
| -------- | --------------------------------------- |
| Framework| Next.js 14 App Router (TypeScript strict)|
| AI gen   | ComfyUI HTTP API (`/prompt`, `/history`, `/view`) |
| Auth     | NextAuth.js v4 (Google OAuth)           |
| DB       | Neon Postgres + Prisma 5                |
| Payments | Stripe (subscriptions + one-shot)       |
| Ads      | Google AdSense (`<AdSlot />`)           |
| Automation | n8n webhook (`/api/n8n/publish`)      |
| Hosting  | Vercel                                  |

## Prerequisites

- [Bun](https://bun.sh) (this machine has no system Node — Bun is used)
- A Neon Postgres database (or any Postgres)
- ComfyUI running locally on `http://localhost:8188` (optional for browsing —
  the gallery falls back to sample images when no DB is connected)

## Quick start

```bash
# 1. install deps (also runs `prisma generate`)
bun install

# 2. configure env
cp .env.example .env.local
#   then fill in DATABASE_URL, NEXTAUTH_SECRET, Google + Stripe keys

# 3. apply the database schema
bun run db:push          # or: bun run db:migrate

# 4. run the dev server
bun run dev              # http://localhost:3000
```

The app runs without a database — the gallery and home page show sample assets.
Generation, auth, payments and publishing require their respective env vars; any
route whose integration is unconfigured returns HTTP 503 with a clear message
(no hardcoded keys, no silent failures).

## Scripts

| Script              | Purpose                              |
| ------------------- | ------------------------------------ |
| `bun run dev`       | Dev server                           |
| `bun run build`     | `prisma generate` + production build |
| `bun run start`     | Start built app                      |
| `bun run db:push`   | Push schema to DB (no migration file)|
| `bun run db:migrate`| Create + apply a dev migration       |
| `bun run db:studio` | Prisma Studio                        |

## Routes

| Route               | Description                                   |
| ------------------- | --------------------------------------------- |
| `/`                 | Landing — hero, featured grid, pricing teaser |
| `/gallery`          | Catalog grid                                  |
| `/gallery/[id]`     | Asset detail + license selector + buy         |
| `/pricing`          | Subscription plans (Basic $9 / Pro $19)       |
| `/generate`         | Prompt → ComfyUI generation                   |
| `/account`          | Profile + subscription status                 |
| `/signin`           | Google OAuth sign-in                          |

### API

| Endpoint                       | Method | Description                                  |
| ------------------------------ | ------ | -------------------------------------------- |
| `/api/generate`                | POST   | Run a ComfyUI workflow, return image URLs    |
| `/api/generate`                | GET    | ComfyUI reachability                         |
| `/api/stripe/checkout`         | POST   | Create subscription or one-shot checkout     |
| `/api/stripe/webhook`          | POST   | Stripe webhook (signature-verified)          |
| `/api/n8n/publish`             | POST   | Publish images into the catalog (n8n)        |
| `/api/auth/[...nextauth]`      | —      | NextAuth handlers                            |
| `/api/health`                  | GET    | Smoke endpoint — which integrations configured |

## Environment variables

See [`.env.example`](./.env.example) for the full annotated list. Key groups:

- **Database** — `DATABASE_URL`, `DIRECT_URL` (Neon pooled + direct)
- **Auth** — `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID/SECRET`
- **Stripe** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PRO`
- **ComfyUI** — `COMFYUI_API_URL`
- **n8n** — `N8N_WEBHOOK_SECRET`
- **Ads** — `NEXT_PUBLIC_ADSENSE_CLIENT`
- **App** — `NEXT_PUBLIC_APP_URL`

## ComfyUI generation

`POST /api/generate` builds a standard SDXL text-to-image workflow, queues it via
`/prompt`, polls `/history/{id}` until images are produced, then returns `/view`
URLs. Override the checkpoint name in `src/lib/comfyui.ts` (`DEFAULTS.ckptName`)
to match a model installed in your ComfyUI.

Example:

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"isometric cozy coffee shop, warm light"}'
```

## n8n publishing

```bash
curl -X POST http://localhost:3000/api/n8n/publish \
  -H "Content-Type: application/json" \
  -H "x-n8n-secret: $N8N_WEBHOOK_SECRET" \
  -d '{"images":[{"title":"Sunset Pack","url":"https://.../a.png","priceCents":500}]}'
```

## Stripe local testing

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET
```

Create two recurring Prices ($9 and $19) in the Stripe dashboard and set
`STRIPE_PRICE_BASIC` / `STRIPE_PRICE_PRO`.

## Deploy to Vercel

1. Push to GitHub, import the repo in Vercel.
2. Add all env vars from `.env.example` (use Neon for the database).
3. Set the Google OAuth redirect URI to
   `https://YOUR_DOMAIN/api/auth/callback/google`.
4. Add the Stripe webhook endpoint `https://YOUR_DOMAIN/api/stripe/webhook`.
5. Note: ComfyUI is local-only — Vercel cannot reach `localhost:8188`. Expose
   ComfyUI via a tunnel/remote host and point `COMFYUI_API_URL` at it, or run
   generation from a worker that publishes via the n8n endpoint.

## Out of scope (v2)

High-res video, multi-language, mobile app, deep avatar customization.
