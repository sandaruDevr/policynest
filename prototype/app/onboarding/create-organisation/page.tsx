'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card'

export default function CreateOrganisationPage() {
  const router = useRouter()
  const [orgName, setOrgName] = useState('')
  const [industry, setIndustry] = useState('')
  const [role, setRole] = useState<'organisation_admin' | 'staff'>('organisation_admin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login')
        return
      }

      // Check if profile already exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profile) {
        // Profile exists, redirect to dashboard
        router.push(profile.role === 'organisation_admin' ? '/admin' : '/staff')
        return
      }

      setCheckingAuth(false)
    }
    checkAuthAndProfile()
  }, [router])

  const handleCreateOrganisation = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not authenticated')

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/setup`
      console.log('Calling API:', apiUrl)

      // Call backend onboarding endpoint (bypasses RLS)
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          full_name: user.user_metadata.full_name,
          org_name: orgName,
          industry,
          role,
        }),
      })

      console.log('Response status:', response.status)
      const text = await response.text()
      console.log('Response text:', text)

      if (!response.ok) {
        try {
          const data = JSON.parse(text)
          throw new Error(data.error || 'Failed to create organisation')
        } catch {
          throw new Error(text || 'Failed to create organisation')
        }
      }

      const data = JSON.parse(text)
      router.push(data.redirect)
    } catch (err: any) {
      console.error('Onboarding error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Create Organisation</CardTitle>
          <p className="text-center text-gray-600">Set up your organisation</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateOrganisation} className="space-y-4">
            <div>
              <label htmlFor="orgName" className="block text-sm font-medium mb-1">
                Organisation Name
              </label>
              <Input
                id="orgName"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="industry" className="block text-sm font-medium mb-1">
                Industry
              </label>
              <Input
                id="industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Aged Care, NDIS, Healthcare"
                required
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-1">
                Your Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="organisation_admin">Organisation Admin</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Organisation'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
