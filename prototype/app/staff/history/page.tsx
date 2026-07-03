import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { Card, CardContent } from '../../../components/ui/card'

export default async function StaffHistoryPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: logs } = await supabase
    .from('rag_audit_logs')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">My Question History</h1>

      <div className="space-y-4">
        {logs && logs.length > 0 ? (
          logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">{log.query}</h3>
                {log.answer && (
                  <p className="text-gray-700 text-sm mb-3">{log.answer}</p>
                )}
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                  {log.escalated && (
                    <span className="text-red-600">Escalated</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">No question history yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
