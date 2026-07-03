'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Send, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

export default function RAGPlaygroundPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState('')
  const [showChunks, setShowChunks] = useState(false)

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setResponse(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      const res = await fetch('http://localhost:3001/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          tenant_id: profile?.tenant_id,
          role: profile?.role,
          site_id: profile?.site_id,
          query,
        }),
      })

      if (!res.ok) throw new Error('Failed to get response')
      const data = await res.json()
      setResponse(data)
    } catch (err: any) {
      setError(err.message || 'Error processing request. Make sure the server is running on port 3001.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">RAG Playground</h1>
      <p className="text-gray-600 mb-8">Test the RAG system with your tenant documents</p>

      <Card className="mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleAsk} className="flex gap-4">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Test question, e.g., 'What should I do if a resident falls?'"
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              <Send className="w-4 h-4 mr-2" />
              Test
            </Button>
          </form>
          {error && <p className="text-red-600 mt-4">{error}</p>}
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            {response.requires_escalation && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Escalation Required</span>
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Answer</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{response.answer}</p>
            </div>

            {response.steps && response.steps.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Steps</h3>
                <ol className="list-decimal list-inside space-y-2">
                  {response.steps.map((step: any, index: number) => (
                    <li key={index} className="text-gray-700">{step.step}</li>
                  ))}
                </ol>
              </div>
            )}

            {response.citations && response.citations.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Citations</h3>
                <ul className="list-disc list-inside space-y-1">
                  {response.citations.map((c: any, i: number) => (
                    <li key={i} className="text-sm text-gray-600">
                      {c.title} v{c.version} {c.section_title && `- ${c.section_title}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-6 text-sm mb-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="font-semibold">Confidence:</span>{' '}
                <span className={response.confidence >= 0.85 ? 'text-green-600' : 'text-yellow-600'}>
                  {(response.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <span className="font-semibold">Source:</span>{' '}
                <span className="capitalize">{response.source || 'rag'}</span>
              </div>
              <div>
                <span className="font-semibold">Escalated:</span>{' '}
                <span className={response.requires_escalation ? 'text-red-600' : 'text-green-600'}>
                  {response.requires_escalation ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowChunks(!showChunks)}
              className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
            >
              {showChunks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showChunks ? 'Hide' : 'Show'} Retrieved Chunks
            </button>

            {showChunks && response.retrieved_chunks && (
              <div className="mt-4 space-y-2">
                {response.retrieved_chunks.map((chunk: any, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 rounded text-sm">
                    <p className="font-semibold">{chunk.title} (similarity: {(chunk.similarity * 100).toFixed(1)}%)</p>
                    <p className="text-gray-600 mt-1">{chunk.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
