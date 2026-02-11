'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Send, Crown } from 'lucide-react';

interface ModelResponse {
  id: string;
  name: string;
  response: string;
  error?: string;
}

interface CouncilResponse {
  question: string;
  responses: ModelResponse[];
  synthesis: string;
  timestamp: string;
}

const MODEL_CONFIGS = [
  {
    id: 'opus-4.6',
    name: 'Claude Opus 4.6',
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-gradient-to-br from-orange-50 to-red-50',
    borderColor: 'border-orange-200'
  },
  {
    id: 'gpt-5.3',
    name: 'GPT-5.3 Codex',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
    borderColor: 'border-green-200'
  },
  {
    id: 'gemini-ultra',
    name: 'Gemini 2.0 Ultra',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'perplexity',
    name: 'Perplexity Sonar Pro',
    color: 'from-purple-500 to-pink-600',
    bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
    borderColor: 'border-purple-200'
  }
];

export function InteractiveJediCouncil() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CouncilResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/jedi-council-interactive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: question.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to get council response');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#D2D2D7]">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-3">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-[#1D1D1F]">Interactive Jedi Council</h2>
            <p className="text-[#6E6E73] text-sm">
              Ask a question and get insights from 4 leading AI models
            </p>
          </div>
        </div>

        {/* Question Input */}
        <div className="space-y-3">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask the council a question... (e.g., 'Should we increase our Google Ads budget?' or 'What metrics should I focus on this month?')"
            className="min-h-[120px] text-base resize-none"
            disabled={loading}
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || !question.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Consulting the Council...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Consult the Council
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Council Members' Responses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.responses.map((response) => {
              const config = MODEL_CONFIGS.find(m => m.id === response.id);
              if (!config) return null;

              return (
                <Card key={response.id} className={`border-2 ${config.borderColor} overflow-hidden`}>
                  <CardHeader className={`pb-3 ${config.bgColor}`}>
                    <CardTitle className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.color}`} />
                      {config.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {response.error ? (
                      <div className="text-red-600 text-sm">
                        Error: {response.error}
                      </div>
                    ) : (
                      <div className="text-sm text-[#1D1D1F] whitespace-pre-wrap leading-relaxed">
                        {response.response}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Chairman's Synthesis */}
          <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold text-[#1D1D1F] flex items-center gap-3">
                <Crown className="h-6 w-6 text-amber-600" />
                Chairman's Synthesis
                <span className="text-sm font-normal text-amber-700">(Claude Opus 4.6)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-base text-[#1D1D1F] whitespace-pre-wrap leading-relaxed">
                {result.synthesis}
              </div>
              <div className="pt-3 border-t border-amber-200 flex items-center justify-between">
                <span className="text-xs text-[#6E6E73]">
                  Asked: {new Date(result.timestamp).toLocaleString()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestion('')}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  Ask Another Question
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State / Instructions */}
      {!result && !loading && (
        <Card className="border border-[#D2D2D7] bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="py-12 text-center">
            <Sparkles className="h-16 w-16 mx-auto mb-4 text-purple-300" />
            <h3 className="text-xl font-semibold text-[#1D1D1F] mb-2">
              The Council Awaits Your Question
            </h3>
            <p className="text-[#6E6E73] max-w-2xl mx-auto">
              Ask strategic questions about your marketing, business decisions, or data analysis. 
              The council will consult Claude Opus 4.6, GPT-5.3 Codex, Gemini 2.0 Ultra, and Perplexity Sonar Pro, 
              then provide a synthesized recommendation.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              <button
                onClick={() => setQuestion('Should we increase our Google Ads budget this month based on current performance?')}
                className="text-left p-4 bg-white rounded-lg border border-purple-200 hover:border-purple-400 transition-colors"
              >
                <div className="text-sm font-medium text-purple-700 mb-1">Example Question</div>
                <div className="text-xs text-[#6E6E73]">Budget optimization</div>
              </button>
              <button
                onClick={() => setQuestion('What are the top 3 metrics I should focus on to improve conversion rate?')}
                className="text-left p-4 bg-white rounded-lg border border-purple-200 hover:border-purple-400 transition-colors"
              >
                <div className="text-sm font-medium text-purple-700 mb-1">Example Question</div>
                <div className="text-xs text-[#6E6E73]">Metric prioritization</div>
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
