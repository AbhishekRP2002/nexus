import { createBrowserRouter } from "react-router-dom"
import AppLayout from "@/layouts/app-layout"
import AuthLayout from "@/layouts/auth-layout"
import ProtectedRoute from "@/components/protected-route"
import LoginPage from "@/pages/login"
import FeedPage from "@/pages/feed"
import ReaderPage from "@/pages/reader"
import SearchPage from "@/pages/search"
import MapPage from "@/pages/map"
import NotFoundPage from "@/pages/not-found"

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: "/login", element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <FeedPage /> },
          { path: "/content/:id", element: <ReaderPage /> },
          { path: "/search", element: <SearchPage /> },
          { path: "/map", element: <MapPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
])
