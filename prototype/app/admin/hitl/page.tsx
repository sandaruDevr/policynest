import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card'

export default async function HITLPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user?.id)
    .single()

  const { data: queue } = await supabase
    .from('hitl_queue')
    .select('*')
    .eq('tenant_id', profile?.tenant_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">HITL Review Queue</h1>

      <div className="space-y-4">
        {queue && queue.length > 0 ? (
          queue.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Question: {item.query}</h3>
                  {item.suggested_answer && (
                    <div>
                      <p className="font-medium text-sm text-gray-600 mb-1">Suggested Answer:</p>
                      <p className="text-gray-700 text-sm">{item.suggested_answer}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 text-xs text-gray-400 mb-4">
                  <span>Confidence: {((item.confidence || 0) * 100).toFixed(0)}%</span>
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-500">
                  <p>Use the API endpoint POST /api/hitl/{item.id}/approve to review this item</p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">No pending items in the review queue.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
