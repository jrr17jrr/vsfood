import { requireAdmin } from "@/lib/auth";
import { AdminSidebar, AdminMobileNav } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav />
        <main className="flex-1 bg-secondary/20 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
