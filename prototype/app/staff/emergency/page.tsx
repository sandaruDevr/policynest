import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { Card, CardContent } from '../../../components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default async function EmergencyPage() {
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
    .eq('risk_level', 'high')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <AlertTriangle className="w-8 h-8 text-red-600" />
        <h1 className="text-3xl font-bold text-red-600">Emergency Quick Access</h1>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
        <p className="text-red-800">
          <strong>Emergency Contact:</strong> Call 000 (Australia) for life-threatening emergencies.
        </p>
      </div>

      <h2 className="text-xl font-semibold mb-4">High-Risk Policies & Procedures</h2>

      <div className="space-y-4">
        {documents && documents.length > 0 ? (
          documents.map((doc) => (
            <Card key={doc.id} className="border-red-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{doc.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {doc.document_type} • {doc.sector}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Version: {doc.version}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    High Risk
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">No high-risk policies available yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
