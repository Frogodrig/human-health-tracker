// Dashboard layout with navigation
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
