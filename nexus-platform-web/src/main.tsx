import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { router } from "@/config/routes"
import "@fontsource/geist-sans/400.css"
import "@fontsource/geist-sans/500.css"
import "@fontsource/geist-sans/600.css"
import "@fontsource/geist-sans/700.css"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <RouterProvider router={router} />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
