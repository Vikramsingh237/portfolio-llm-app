# Portfolio LLM Demo

A responsive portfolio dashboard with a Vercel serverless API backed by Anthropic. Portfolio figures are fictional, fixed demo data. The API key remains server-side.

## Run locally

1. Install Node.js 20 or newer.
2. Run npm install.
3. Copy .env.example to .env.local and set your own ANTHROPIC_API_KEY.
4. For local API testing, add the Upstash Redis REST URL and token shown in .env.example.
5. Run npm run dev and open the local URL.
6. Run npm run check to verify API JavaScript syntax.

## Deploy to Vercel

1. Import this repository into Vercel with the repository root as the project root. No framework preset or build command is required.
2. Create an Upstash Redis database.
3. Add ANTHROPIC_API_KEY, UPSTASH_REDIS_REST_URL, and UPSTASH_REDIS_REST_TOKEN under Vercel Project Settings > Environment Variables. Optionally set ANTHROPIC_MODEL; the default is claude-haiku-4-5-20251001.
4. Deploy and test the dashboard question box.

Never put a real key in browser code, VITE_ variables, or committed files. If a key has been exposed, revoke it and create a replacement. Production requests fail closed unless shared rate limiting is configured. The API limits each client IP to 10 questions per 15 minutes using Upstash Redis.

## Scope and limitations

This is an educational prototype, not a financial service. It has no authentication, live market data, or suitability checks. The limiter reduces casual abuse but is not a substitute for authentication, provider spend limits, monitoring, privacy disclosures, and legal review. Do not send customer brokerage data to this endpoint.
