import { VendorForm } from '@/components/vendors/VendorForm'

export default function NewVendorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Register New Vendor</h1>
        <p className="text-sm text-slate-400 mt-1">
          Add a new vendor to the registry.
        </p>
      </div>

      <VendorForm />
    </div>
  )
}
