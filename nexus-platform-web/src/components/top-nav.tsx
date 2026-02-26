import { useRef, useEffect, useState } from "react"
import { NavLink, useNavigate, useSearchParams } from "react-router-dom"
import { Search, Plus, Newspaper, Share2, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", label: "Feed", icon: Newspaper },
  { to: "/map", label: "Knowledge Map", icon: Share2 },
]

export default function TopNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Sync query from URL when navigating to search page
  useEffect(() => {
    setQuery(searchParams.get("q") ?? "")
  }, [searchParams])

  // Global keyboard shortcut: Cmd+/ or Ctrl+/ to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) {
      document.addEventListener("mousedown", handleClick)
      return () => document.removeEventListener("mousedown", handleClick)
    }
  }, [showUserMenu])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
      {/* Logo */}
      <NavLink to="/" className="mr-1 select-none">
        <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-lg font-semibold tracking-tight text-transparent">
          Nexus
        </span>
      </NavLink>

      {/* Nav tabs */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )
            }
          >
            <item.icon className="size-3.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Search bar — centered */}
      <form onSubmit={handleSearchSubmit} className="ml-auto flex w-full max-w-md items-center">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your knowledge base..."
            className="h-8 w-full rounded-lg border border-border/60 bg-muted/40 pl-9 pr-14 text-[13px] text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary/50 focus:bg-muted/60 focus:ring-1 focus:ring-primary/25"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 select-none rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ⌘/
          </kbd>
        </div>
      </form>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" className="gap-1.5 rounded-lg text-[13px]">
          <Plus className="size-3.5" />
          Add URL
        </Button>

        {/* User avatar with menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="rounded-full outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Avatar size="sm">
              {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
              <AvatarFallback className="bg-primary/20 text-[11px] font-medium text-primary">
                {user?.name ? getInitials(user.name) : "?"}
              </AvatarFallback>
            </Avatar>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-border/60 bg-popover p-1 shadow-lg">
              <div className="border-b border-border/40 px-3 py-2">
                <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <LogOut className="size-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
