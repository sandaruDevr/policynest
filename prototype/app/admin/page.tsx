import { createSupabaseServerClient } from '../../lib/supabase-server'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'

export default async function AdminDashboard() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user?.id)
    .single()

  const tenantId = profile?.tenant_id

  // Get stats
  const { count: totalDocs } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  const { count: publishedDocs } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'published')

  const { count: draftDocs } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'draft')

  const { count: totalStaff } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .neq('role', 'organisation_admin')

  const { count: totalQuestions } = await supabase
    .from('rag_audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  const { count: escalatedQuestions } = await supabase
    .from('rag_audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('escalated', true)

  const { count: pendingHitl } = await supabase
    .from('hitl_queue')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalDocs || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{publishedDocs || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-600">{draftDocs || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Staff Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalStaff || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalQuestions || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Escalated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{escalatedQuestions || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{pendingHitl || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/documents"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold mb-2">Upload Document</h3>
              <p className="text-sm text-gray-600">Add new policy or procedure</p>
            </a>
            <a
              href="/admin/rag-playground"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold mb-2">Test RAG</h3>
              <p className="text-sm text-gray-600">Test AI with your documents</p>
            </a>
            <a
              href="/admin/staff"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold mb-2">Manage Staff</h3>
              <p className="text-sm text-gray-600">Add or manage staff users</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
