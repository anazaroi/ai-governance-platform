'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { deleteVendor } from '@/lib/actions/vendor.actions'

interface VendorRow {
  id: string
  name: string
  type: 'INTERNAL' | 'THIRD_PARTY'
  country: string | null
  contractRef: string | null
  _count: { models: number }
}

export function VendorTable({ vendors }: { vendors: VendorRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete vendor "${name}"?`)) return
    startTransition(async () => {
      await deleteVendor(id)
    })
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800/50">
            <th className="px-4 py-3 text-left font-medium text-slate-300">Name</th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">Type</th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">Country</th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">Contract Ref</th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">Models</th>
            <th className="px-4 py-3 text-right font-medium text-slate-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                No vendors registered yet.
              </td>
            </tr>
          ) : (
            vendors.map((vendor) => (
              <tr key={vendor.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/registry/vendors/${vendor.id}`}
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {vendor.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {vendor.type === 'THIRD_PARTY' ? 'Third Party' : 'Internal'}
                </td>
                <td className="px-4 py-3 text-slate-400">{vendor.country ?? '--'}</td>
                <td className="px-4 py-3 text-slate-400">{vendor.contractRef ?? '--'}</td>
                <td className="px-4 py-3 text-slate-300">{vendor._count.models}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/registry/vendors/${vendor.id}`)}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      disabled={isPending}
                      onClick={() => handleDelete(vendor.id, vendor.name)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
