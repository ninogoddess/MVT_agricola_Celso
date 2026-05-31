import MobileNav from "@/components/ui/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <MobileNav />
      <main className="lg:ml-60 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
