import { UserButton, OrganizationSwitcher } from '@clerk/nextjs'

export function TopBar() {
  return (
    <header className="h-14 shrink-0 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6">
      <OrganizationSwitcher
        appearance={{
          elements: {
            organizationSwitcherTrigger: 'text-slate-300 hover:text-slate-100',
          },
        }}
      />
      <UserButton />
    </header>
  )
}
