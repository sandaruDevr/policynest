import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../lib/supabase-server'
import { Sidebar } from '../../components/layout/sidebar'

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding/create-organisation')
  }

  return (
    <div className="flex">
      <Sidebar role="staff" />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
