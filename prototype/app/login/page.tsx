'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'

interface Organization {
  id: string
  name: string
  industry: string
}

interface TestUser {
  id: string
  email: string
  password: string
  name: string
  role: 'organisation_admin' | 'staff'
  tenant_id: string
}

const organizations: Organization[] = [
  { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Sunrise Aged Care', industry: 'aged_care' },
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'City General Hospital', industry: 'healthcare' },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Community Care Services', industry: 'disability' },
  { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Mindful Health Clinic', industry: 'mental_health' },
]

const testUsers: TestUser[] = [
  { id: '550e8400-e29b-41d4-a716-446655440010', email: 'admin@sunrise.test', password: 'test123', name: 'Admin', role: 'organisation_admin', tenant_id: '550e8400-e29b-41d4-a716-446655440000' },
  { id: '550e8400-e29b-41d4-a716-446655440011', email: 'staff@sunrise.test', password: 'test123', name: 'Staff', role: 'staff', tenant_id: '550e8400-e29b-41d4-a716-446655440000' },
  { id: '550e8400-e29b-41d4-a716-446655440020', email: 'admin@hospital.test', password: 'test123', name: 'Admin', role: 'organisation_admin', tenant_id: '550e8400-e29b-41d4-a716-446655440001' },
  { id: '550e8400-e29b-41d4-a716-446655440021', email: 'staff@hospital.test', password: 'test123', name: 'Staff', role: 'staff', tenant_id: '550e8400-e29b-41d4-a716-446655440001' },
  { id: '550e8400-e29b-41d4-a716-446655440030', email: 'admin@community.test', password: 'test123', name: 'Admin', role: 'organisation_admin', tenant_id: '550e8400-e29b-41d4-a716-446655440002' },
  { id: '550e8400-e29b-41d4-a716-446655440031', email: 'staff@community.test', password: 'test123', name: 'Staff', role: 'staff', tenant_id: '550e8400-e29b-41d4-a716-446655440002' },
  { id: '550e8400-e29b-41d4-a716-446655440040', email: 'admin@mindful.test', password: 'test123', name: 'Admin', role: 'organisation_admin', tenant_id: '550e8400-e29b-41d4-a716-446655440003' },
  { id: '550e8400-e29b-41d4-a716-446655440041', email: 'staff@mindful.test', password: 'test123', name: 'Staff', role: 'staff', tenant_id: '550e8400-e29b-41d4-a716-446655440003' },
]

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleQuickLogin = async (user: TestUser) => {
    setLoading(user.id)
    setError('')

    try {
      // Sign in with test credentials
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      })

      if (signInError) {
        // If user doesn't exist, create them via backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/create-test-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to create test user')
        }

        // Sign in again after creation
        const { data: signInData, error: retryError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: user.password,
        })

        if (retryError) throw retryError

        router.push(user.role === 'organisation_admin' ? '/admin' : '/staff')
      } else {
        router.push(user.role === 'organisation_admin' ? '/admin' : '/staff')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">CareSuite AI</h1>
          <p className="text-gray-600">Select an organization and role to login</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {organizations.map((org) => {
            const orgUsers = testUsers.filter(u => u.tenant_id === org.id)
            return (
              <Card key={org.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{org.name}</CardTitle>
                  <p className="text-sm text-gray-500 capitalize">{org.industry}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {orgUsers.map((user) => (
                    <Button
                      key={user.id}
                      onClick={() => handleQuickLogin(user)}
                      disabled={loading === user.id}
                      className={`w-full ${
                        user.role === 'organisation_admin'
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {loading === user.id ? 'Signing in...' : user.role === 'organisation_admin' ? 'Admin' : 'Staff'}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>All test accounts use password: <code className="bg-gray-200 px-2 py-1 rounded">test123</code></p>
        </div>
      </div>
    </div>
  )
}
