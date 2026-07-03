import { createSupabaseServerClient } from '../../lib/supabase-server'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import Link from 'next/link'

export default async function StaffDashboard() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user?.id)
    .single()

  const tenantId = profile?.tenant_id

  // Get recent questions
  const { data: recentQuestions } = await supabase
    .from('rag_audit_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Staff Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/staff/assistant">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>AI Policy Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Ask questions about policies and procedures</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/staff/policies">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Policy Library</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Browse approved policies and procedures</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/staff/incidents">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Report Incident</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Submit an incident report</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/staff/emergency">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Emergency Quick Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Quick access to emergency procedures</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Questions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentQuestions && recentQuestions.length > 0 ? (
            <div className="space-y-4">
              {recentQuestions.map((log) => (
                <div key={log.id} className="p-4 border rounded-lg">
                  <p className="font-medium">{log.query}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {log.escalated ? (
                      <span className="text-red-600">Escalated</span>
                    ) : (
                      <span className="text-green-600">Answered</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No questions yet. Start by asking the AI Assistant!</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
