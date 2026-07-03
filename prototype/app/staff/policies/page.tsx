import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card'

export default async function StaffPoliciesPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user?.id)
    .single()

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('tenant_id', profile?.tenant_id)
    .in('status', ['approved', 'published'])
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Policy Library</h1>

      <div className="grid gap-4">
        {documents && documents.length > 0 ? (
          documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{doc.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {doc.document_type} • {doc.sector}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Version: {doc.version} • {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {doc.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">No published policies available yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
