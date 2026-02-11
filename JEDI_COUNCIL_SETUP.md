# Interactive Jedi Council - Setup Instructions

## API Keys Required

Add these to your `.env.local` file:

```bash
# Anthropic (Claude Opus 4.6 - Chairman)
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI (GPT-5.3 Codex)
OPENAI_API_KEY=sk-...

# Google (Gemini 2.0 Ultra)
GEMINI_API_KEY=...

# Perplexity (Sonar Pro) - Optional
PERPLEXITY_API_KEY=pplx-...
```

## How It Works

1. User asks a question in the Jedi Council tab
2. Question is sent to 4 AI models in parallel:
   - GPT-5.3 Codex (OpenAI)
   - Gemini 2.0 Ultra (Google)
   - Perplexity Sonar Pro (optional)
3. Claude Opus 4.6 acts as Chairman and synthesizes all responses
4. Results displayed in beautiful cards with synthesis at bottom

## Features

- **Real-time**: Ask questions on-demand (no waiting for scheduled runs)
- **Multi-LLM**: Get diverse perspectives from 4 cutting-edge models
- **Chairman Synthesis**: Claude Opus 4.6 provides balanced summary
- **Beautiful UI**: Color-coded responses, clear hierarchy
- **Example Questions**: Pre-loaded suggestions to get started

## Cost Estimate

Per question (approximate):
- Claude Opus 4.6: ~$0.10 (synthesis)
- GPT-5.3: ~$0.05
- Gemini 2.0 Ultra: ~$0.02
- Perplexity: ~$0.01

Total: **~$0.18 per question**

Much cheaper than running large scheduled workflows!

## Location

- **Page:** `/` (Command Center) → Jedi Council tab
- **Component:** `src/components/InteractiveJediCouncil.tsx`
- **API Route:** `src/app/api/jedi-council-interactive/route.ts`

## Next Steps

1. Add API keys to `.env.local`
2. Restart dev server (or wait for Vercel deployment)
3. Go to Command Center → Jedi Council tab
4. Ask a question!

## Example Questions

- "Should we increase our Google Ads budget this month?"
- "What are the top 3 metrics I should focus on to improve conversion rate?"
- "How can we improve our landing page performance?"
- "What's the best strategy for reducing CPA while maintaining volume?"
