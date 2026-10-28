const PORTFOLIO_CONTEXT = `This is a fictional sample portfolio with a displayed value of $248,640.80. The dashboard lists 55% equities (34% US and 21% international), 16% bonds, 12% cash, 9% real assets, and 8% other. The largest listed holding is VTI at 24%. The sample dashboard shows 8.42% year-to-date return, 12.8% illustrative annualized volatility, and -14.2% illustrative maximum drawdown. These values are demonstration data, not live market data.`;

const SYSTEM_PROMPT = `You are a careful portfolio-analysis assistant in a product demo. Analyze only the supplied fictional portfolio context and the user's question. Never imply that the figures are real, current market data, or personalized to the user. Do not give buy, sell, or hold instructions, price targets, or guarantees. Explain uncertainty and relevant limitations. Keep answers concise, factual, and educational. If asked for a recommendation or information outside this context, say what additional verified information or qualified professional input would be needed. Portfolio context: ${PORTFOLIO_CONTEXT}`;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST for portfolio analysis.' });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Analysis is not configured. Set ANTHROPIC_API_KEY in the deployment environment.' });
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); }
    catch { return res.status(400).json({ error: 'Request body must be valid JSON.' }); }
  }
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  if (!question || question.length > 500) return res.status(400).json({ error: 'Enter a question of 1 to 500 characters.' });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001', max_tokens: 350, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: question }] }),
      signal: controller.signal
    });
    if (!upstream.ok) return res.status(upstream.status === 429 ? 503 : 502).json({ error: 'The analysis provider could not complete this request. Please try again later.' });
    const result = await upstream.json();
    const answer = result.content?.find(block => block.type === 'text')?.text;
    if (typeof answer !== 'string' || !answer.trim()) return res.status(502).json({ error: 'The analysis provider returned an empty response.' });
    return res.status(200).json({ answer: answer.trim() });
  } catch {
    return res.status(502).json({ error: 'The analysis service is temporarily unavailable. Please try again.' });
  } finally { clearTimeout(timeout); }
};
