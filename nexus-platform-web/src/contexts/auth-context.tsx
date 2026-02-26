import { createContext, useState, useEffect, type ReactNode } from "react"
import api from "@/lib/api"

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  twitterConnected: boolean
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (token: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("nexus_token")
    if (!token) {
      setIsLoading(false)
      return
    }
    api
      .get("/api/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("nexus_token"))
      .finally(() => setIsLoading(false))
  }, [])

  const login = (token: string) => {
    localStorage.setItem("nexus_token", token)
    api.get("/api/auth/me").then((res) => setUser(res.data))
  }

  const logout = () => {
    localStorage.removeItem("nexus_token")
    setUser(null)
    window.location.href = "/login"
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
