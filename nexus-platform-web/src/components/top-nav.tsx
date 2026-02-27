import { useEffect, useState } from "react"
import { NavLink } from "react-router-dom"
import { Search, Plus, Newspaper, Share2, LogOut, User, Sun, Moon } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "@/contexts/theme-context"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AddUrlDialog } from "@/components/add-url-dialog"
import { SearchCommandPalette } from "@/components/search-command-palette"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", label: "Feed", icon: Newspaper },
  { to: "/map", label: "Knowledge Map", icon: Share2 },
]

export default function TopNav() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [addUrlOpen, setAddUrlOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Global ⌘/ shortcut to open search palette
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
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

        {/* Search trigger — opens command palette */}
        <button
          onClick={() => setSearchOpen(true)}
          className="ml-auto flex h-8 w-full max-w-md items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 text-[13px] text-muted-foreground transition-colors hover:bg-muted/50"
        >
          <Search className="size-3.5 shrink-0" />
          <span className="flex-1 text-left">Search your knowledge base...</span>
          <kbd className="shrink-0 select-none rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium">
            ⌘/
          </kbd>
        </button>

        {/* Right section */}
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-lg text-muted-foreground hover:text-foreground"
                onClick={toggleTheme}
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Switch to {theme === "dark" ? "light" : "dark"} mode</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className="gap-1.5 rounded-lg text-[13px]"
                onClick={() => setAddUrlOpen(true)}
              >
                <Plus className="size-3.5" />
                Add URL
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add content to your knowledge base</TooltipContent>
          </Tooltip>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="rounded-full">
                <Avatar size="sm">
                  {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                  <AvatarFallback className="bg-primary/20 text-[11px] font-medium text-primary">
                    {user?.name ? getInitials(user.name) : "?"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="truncate text-sm font-medium">{user?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="size-3.5" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} variant="destructive">
                <LogOut className="size-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Dialogs rendered outside header */}
      <AddUrlDialog open={addUrlOpen} onOpenChange={setAddUrlOpen} />
      <SearchCommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onAddUrl={() => {
          setSearchOpen(false)
          setAddUrlOpen(true)
        }}
      />
    </>
  )
}
