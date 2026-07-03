'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Send, AlertTriangle } from 'lucide-react'

export default function StaffAssistantPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState('')

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
      setQuery('')
    } catch (err: any) {
      setError(err.message || 'Error processing request. Make sure the server is running on port 3001.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">AI Policy Assistant</h1>

      <Card className="mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleAsk} className="flex gap-4">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about policies and procedures..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              <Send className="w-4 h-4 mr-2" />
              Ask
            </Button>
          </form>
          {error && (
            <p className="text-red-600 mt-4">{error}</p>
          )}
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
          </CardHeader>
          <CardContent>
            {response.requires_escalation && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Escalation Required</span>
                </div>
                <p className="text-red-600 mt-1">Policy not found or confidence is low. Please escalate to your supervisor.</p>
              </div>
            )}

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Answer</h3>
              <p className="text-gray-700">{response.answer}</p>
            </div>

            {response.steps && response.steps.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Steps</h3>
                <ol className="list-decimal list-inside space-y-2">
                  {response.steps.map((step: any, index: number) => (
                    <li key={index} className="text-gray-700">
                      {step.step}
                      {step.citation && (
                        <span className="text-sm text-gray-500 ml-2">
                          (Source: {step.citation.title} v{step.citation.version} - {step.citation.section_title})
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {response.citations && response.citations.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Sources</h3>
                <ul className="list-disc list-inside space-y-1">
                  {response.citations.map((citation: any, index: number) => (
                    <li key={index} className="text-sm text-gray-600">
                      {citation.title} v{citation.version}
                      {citation.section_title && ` - ${citation.section_title}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-semibold">Confidence:</span>{' '}
                <span className={response.confidence >= 0.85 ? 'text-green-600' : 'text-yellow-600'}>
                  {(response.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <span className="font-semibold">Escalated:</span>{' '}
                <span className={response.requires_escalation ? 'text-red-600' : 'text-green-600'}>
                  {response.requires_escalation ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
