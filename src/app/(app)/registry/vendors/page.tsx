import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { VendorTable } from '@/components/vendors/VendorTable'
import { getVendors } from '@/lib/queries/vendor.queries'

export default async function VendorsPage() {
  const vendors = await getVendors()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Vendors</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage AI model vendors and third-party providers.
          </p>
        </div>
        <Link href="/registry/vendors/new">
          <Button>Register Vendor</Button>
        </Link>
      </div>

      <VendorTable vendors={vendors} />
    </div>
  )
}
