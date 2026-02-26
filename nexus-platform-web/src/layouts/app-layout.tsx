import { Outlet } from "react-router-dom"
import TopNav from "@/components/top-nav"

export default function AppLayout() {
  return (
    <div className="flex h-screen flex-col">
      <TopNav />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
