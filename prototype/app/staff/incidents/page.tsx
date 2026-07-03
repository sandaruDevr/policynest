'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'

export default function StaffIncidentsPage() {
  const [incidentType, setIncidentType] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

      await supabase.from('incidents').insert({
        tenant_id: profile?.tenant_id,
        submitted_by: user?.id,
        incident_type: incidentType,
        description,
        urgency,
        status: 'submitted',
      })

      setSubmitted(true)
      setIncidentType('')
      setDescription('')
      setUrgency('medium')
    } catch (error) {
      console.error('Error submitting incident:', error)
      alert('Error submitting incident')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Report Incident</h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-green-600 mb-2">Incident Reported</h2>
              <p className="text-gray-600 mb-4">Your incident has been submitted successfully.</p>
              <Button onClick={() => setSubmitted(false)}>Report Another Incident</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Report Incident</h1>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Incident Type</label>
              <Input
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                placeholder="e.g., Fall, Medication Error, Aggression"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
                placeholder="Describe what happened..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Urgency</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Incident'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
