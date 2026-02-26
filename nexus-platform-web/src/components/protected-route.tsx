import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"

// TODO: Remove DEV_BYPASS when backend auth is ready
const DEV_BYPASS = import.meta.env.DEV

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth()

  if (DEV_BYPASS) return <Outlet />

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
