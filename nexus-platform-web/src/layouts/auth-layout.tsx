import { Outlet } from "react-router-dom"

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Outlet />
    </div>
  )
}
