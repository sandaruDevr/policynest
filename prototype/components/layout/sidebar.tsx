'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../lib/utils'
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Users,
  History,
  Activity,
  BookOpen,
  Shield
} from 'lucide-react'

interface SidebarProps {
  role: 'organisation_admin' | 'staff'
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/documents', label: 'Documents', icon: FileText },
    { href: '/admin/rag-playground', label: 'RAG Playground', icon: MessageSquare },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: Activity },
    { href: '/admin/hitl', label: 'Review Queue', icon: AlertCircle },
    { href: '/admin/golden-answers', label: 'Golden Answers', icon: CheckCircle },
    { href: '/admin/staff', label: 'Staff', icon: Users },
  ]

  const staffLinks = [
    { href: '/staff', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/staff/assistant', label: 'AI Assistant', icon: MessageSquare },
    { href: '/staff/policies', label: 'Policy Library', icon: BookOpen },
    { href: '/staff/incidents', label: 'Incidents', icon: Shield },
    { href: '/staff/emergency', label: 'Emergency', icon: AlertCircle },
    { href: '/staff/history', label: 'History', icon: History },
  ]

  const links = role === 'organisation_admin' ? adminLinks : staffLinks

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-primary-600">CareSuite AI</h1>
        <p className="text-sm text-gray-500 capitalize">{role.replace('_', ' ')}</p>
      </div>
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div className="absolute bottom-4 left-4 right-4">
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Sign Out
        </Link>
      </div>
    </div>
  )
}
