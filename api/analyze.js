const { createHash } = require('node:crypto');
const { Ratelimit } = require('@upstash/ratelimit');
const { Redis } = require('@upstash/redis');

const PORTFOLIO_CONTEXT = 'Fictional demo portfolio: value $248,640.80; 55% equities (34% US, 21% international), 16% bonds, 12% cash, 9% real assets, 8% other; VTI largest at 24%; illustrative YTD return 8.42%, volatility 12.8%, max drawdown -14.2%. Not live market data.';
const SYSTEM_PROMPT = 'You are an educational portfolio assistant for a fictional demo. Analyze only this context: ' + PORTFOLIO_CONTEXT + ' Never imply real/current data or personalized advice. Do not instruct users to buy, sell, or hold, or provide targets or guarantees. State limitations and uncertainty. Keep answers concise.';
const configured = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const limiter = configured ? new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(10, '15 m'), prefix: 'portfolio-analysis', analytics: false }) : null;

function clientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.headers['x-real-ip']) || 'unknown';
  return createHash('sha256').update(ip.trim()).digest('hex');
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use POST for portfolio analysis.' }); }
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'Analysis is not configured. Set ANTHROPIC_API_KEY in the deployment environment.' });
  const length = Number(req.headers['content-length'] || 0);
  if (length > 2048) return res.status(413).json({ error: 'Request is too large.' });
  let body = req.body;
  if (typeof body === 'string') {
    if (body.length > 2048) return res.status(413).json({ error: 'Request is too large.' });
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Request body must be valid JSON.' }); }
  }
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  if (!question || question.length > 500) return res.status(400).json({ error: 'Enter a question of 1 to 500 characters.' });
  if (!limiter && process.env.NODE_ENV === 'production') return res.status(503).json({ error: 'Analysis is not configured for production traffic.' });
  if (limiter) {
    try {
      const { success, reset } = await limiter.limit(clientKey(req));
      if (!success) { res.setHeader('Retry-After', String(Math.max(1, Math.ceil((reset - Date.now()) / 1000)))); return res.status(429).json({ error: 'Too many questions. Please try again later.' }); }
    } catch { return res.status(503).json({ error: 'Analysis is temporarily unavailable.' }); }
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001', max_tokens: 350, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: question }] }), signal: controller.signal });
    if (!upstream.ok) {
      if (upstream.status === 429) res.setHeader('Retry-After', upstream.headers.get('retry-after') || '30');
      return res.status(upstream.status === 429 ? 503 : 502).json({ error: 'The analysis provider could not complete this request. Please try again later.' });
    }
    const result = await upstream.json().catch(() => null);
    const answer = result?.content?.find(block => block.type === 'text')?.text;
    if (typeof answer !== 'string' || !answer.trim()) return res.status(502).json({ error: 'The analysis provider returned an empty response.' });
    return res.status(200).json({ answer: answer.trim() });
  } catch { return res.status(502).json({ error: 'The analysis service is temporarily unavailable. Please try again.' }); }
  finally { clearTimeout(timeout); }
};
