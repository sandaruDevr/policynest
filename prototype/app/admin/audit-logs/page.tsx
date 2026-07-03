import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { Card, CardContent } from '../../../components/ui/card'

export default async function AuditLogsPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user?.id)
    .single()

  const { data: logs } = await supabase
    .from('rag_audit_logs')
    .select('*')
    .eq('tenant_id', profile?.tenant_id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Audit Logs</h1>

      <div className="space-y-4">
        {logs && logs.length > 0 ? (
          logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold">{log.query}</h3>
                  <div className="flex gap-2">
                    {log.escalated && (
                      <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                        Escalated
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${log.confidence >= 0.85 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {((log.confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                {log.answer && (
                  <p className="text-gray-700 text-sm mb-3">{log.answer}</p>
                )}
                {log.citations && log.citations.length > 0 && (
                  <div className="text-xs text-gray-500 mb-2">
                    <span className="font-semibold">Citations: </span>
                    {log.citations.map((c: any) => `${c.title} v${c.version}`).join(', ')}
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">No audit logs yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
