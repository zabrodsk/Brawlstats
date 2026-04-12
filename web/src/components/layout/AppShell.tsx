import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex flex-1 min-h-0 min-w-0 flex-col pb-16 md:pb-0 overflow-auto">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}
