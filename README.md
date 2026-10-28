# Portfolio LLM Demo

A static portfolio dashboard with a Vercel serverless API route that sends questions to Anthropic. All portfolio figures are fictional and hard-coded demo data. The API key is read only by the server function; never add it to browser code or commit a real key.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set your own `ANTHROPIC_API_KEY` there.
4. Run `npx vercel dev` and open the local URL it prints.

You can optionally set `ANTHROPIC_MODEL`; the default is `claude-haiku-4-5-20251001`.

## Deploy to Vercel

1. Push this folder as the root of a GitHub repository.
2. In Vercel, import that repository and keep the project root at this folder. No framework preset or build command is required.
3. Add `ANTHROPIC_API_KEY` under Project Settings > Environment Variables. Add `ANTHROPIC_MODEL` only if you want to override the default.
4. Deploy, then test the dashboard's portfolio question box on the deployed URL.

Do not put the API key in `index.html`, a `VITE_` variable, or any committed file. If a key has ever been exposed, revoke it and create a replacement.

## Before real users

This is a product prototype, not a financial service. It has no authentication, durable rate limiting, live market data, or personalized suitability checks. The model endpoint accepts questions about fixed fictional data only. Add authentication and a durable per-user/IP rate limiter, provider spend limits, privacy disclosures, monitoring, and appropriate financial/legal review before opening it to public traffic. Do not send customer brokerage data to this demo endpoint.
