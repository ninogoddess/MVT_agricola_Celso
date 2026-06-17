import MobileNav from "@/components/ui/MobileNav";
import { ToastProvider } from "@/components/ui/Toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-dvh">
        <MobileNav />
        <main className="lg:ml-60 p-4 md:p-6">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
