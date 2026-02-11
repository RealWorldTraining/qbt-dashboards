import { NextRequest, NextResponse } from 'next/server';

// Model configurations
const MODELS = [
  {
    id: 'opus-4.6',
    name: 'Claude Opus 4.6',
    provider: 'anthropic',
    model: 'claude-opus-4-20250514',
    color: 'from-orange-500 to-red-600',
    role: 'Chairman'
  },
  {
    id: 'gpt-5.3',
    name: 'GPT-5.3 Codex',
    provider: 'openai',
    model: 'gpt-5.3-turbo-0125',
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 'gemini-ultra',
    name: 'Gemini 2.0 Ultra',
    provider: 'google',
    model: 'gemini-2.0-pro-exp-latest',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'perplexity',
    name: 'Perplexity Sonar Pro',
    provider: 'perplexity',
    model: 'sonar-pro',
    color: 'from-purple-500 to-pink-600'
  }
];

async function callAnthropic(question: string, model: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: question
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callOpenAI(question: string, model: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: question
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGoogle(question: string, model: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: question
        }]
      }],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Google API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function callPerplexity(question: string, model: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY not configured');

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: question
      }],
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callModel(modelConfig: typeof MODELS[0], question: string): Promise<{ id: string; name: string; response: string; error?: string }> {
  try {
    let response: string;
    
    switch (modelConfig.provider) {
      case 'anthropic':
        response = await callAnthropic(question, modelConfig.model);
        break;
      case 'openai':
        response = await callOpenAI(question, modelConfig.model);
        break;
      case 'google':
        response = await callGoogle(question, modelConfig.model);
        break;
      case 'perplexity':
        response = await callPerplexity(question, modelConfig.model);
        break;
      default:
        throw new Error(`Unknown provider: ${modelConfig.provider}`);
    }

    return {
      id: modelConfig.id,
      name: modelConfig.name,
      response
    };
  } catch (error: any) {
    return {
      id: modelConfig.id,
      name: modelConfig.name,
      response: '',
      error: error.message
    };
  }
}

async function synthesize(question: string, responses: Array<{ id: string; name: string; response: string; error?: string }>): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const responsesText = responses
    .filter(r => !r.error)
    .map(r => `**${r.name}:**\n${r.response}`)
    .join('\n\n---\n\n');

  const synthesisPrompt = `You are the Chairman of the Jedi Council, synthesizing insights from multiple AI models.

**Original Question:**
${question}

**Council Members' Responses:**
${responsesText}

**Your Task:**
As Chairman, provide a concise synthesis that:
1. Identifies areas of agreement across the council
2. Highlights any important disagreements or unique perspectives
3. Provides a balanced, actionable recommendation
4. Keeps it concise (2-3 paragraphs max)

Your synthesis:`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: synthesisPrompt
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic synthesis error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Invalid question' },
        { status: 400 }
      );
    }

    // Call all models in parallel
    const responses = await Promise.all(
      MODELS.filter(m => m.id !== 'opus-4.6' || !m.role).map(m => callModel(m, question))
    );

    // Synthesize with Chairman (Opus 4.6)
    const synthesis = await synthesize(question, responses);

    return NextResponse.json({
      question,
      responses,
      synthesis,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Jedi Council error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
