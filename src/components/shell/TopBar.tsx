import { UserButton, OrganizationSwitcher } from '@clerk/nextjs'

export function TopBar() {
  return (
    <header className="h-14 shrink-0 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6">
      <OrganizationSwitcher
        appearance={{
          elements: {
            organizationSwitcherTrigger: 'text-slate-300 hover:text-slate-100',
            organizationSwitcherTriggerIcon: 'text-slate-400',
            organizationName: 'text-slate-200',
            organizationPreviewTextContainer: 'text-slate-200',
            organizationPreviewMainIdentifier: 'text-slate-200',
          },
        }}
      />
      <UserButton />
    </header>
  )
}
