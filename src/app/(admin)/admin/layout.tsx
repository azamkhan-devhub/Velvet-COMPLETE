import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminGuard } from '@/components/admin/AdminGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-admin-bg flex">
        <AdminSidebar />
        <main className="flex-1 overflow-auto admin-scroll">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
