import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { Card, CardContent } from '../../../components/ui/card'

export default async function StaffManagementPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user?.id)
    .single()

  const { data: staff } = await supabase
    .from('profiles')
    .select('*')
    .eq('tenant_id', profile?.tenant_id)
    .neq('role', 'organisation_admin')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Staff Management</h1>

      <div className="space-y-4">
        {staff && staff.length > 0 ? (
          staff.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{member.full_name}</h3>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {member.role}
                    </span>
                    {member.site_id && (
                      <p className="text-xs text-gray-400 mt-1">Site: {member.site_id}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">No staff members yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
