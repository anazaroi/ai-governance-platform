'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Database,
  BookOpen,
  ShieldAlert,
  GitBranch,
  FileText,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/models', label: 'AI Inventory', icon: Database },
  { href: '/registry', label: 'Registry', icon: BookOpen },
  { href: '/assessments', label: 'Risk Tiering', icon: ShieldAlert },
  { href: '/workflows', label: 'Workflows', icon: GitBranch },
  { href: '/policies', label: 'Policies', icon: FileText },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col">
      <div className="px-6 py-5 border-b border-slate-800">
        <span className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
          AI Governance
        </span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
