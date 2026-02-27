import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  Sparkles,
  FileText,
  ArrowRight,
  Newspaper,
  Network,
  Plus,
  Clock,
} from "lucide-react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"

const recentSearches = [
  "How does RAG improve LLM accuracy?",
  "Vector database comparison",
  "Attention mechanism scaling",
]

const quickActions = [
  { label: "Go to Feed", icon: Newspaper, action: "/" },
  { label: "Go to Knowledge Map", icon: Network, action: "/map" },
  { label: "Add URL", icon: Plus, action: "add-url" },
]

interface SearchCommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddUrl?: () => void
}

export function SearchCommandPalette({ open, onOpenChange, onAddUrl }: SearchCommandPaletteProps) {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState("")

  useEffect(() => {
    if (!open) {
      // Small delay before clearing so the close animation plays with content visible
      const t = setTimeout(() => setSearchValue(""), 200)
      return () => clearTimeout(t)
    }
  }, [open])

  function handleSearchSubmit() {
    const trimmed = searchValue.trim()
    if (trimmed) {
      onOpenChange(false)
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  function handleQuickAction(action: string) {
    onOpenChange(false)
    if (action === "add-url") {
      onAddUrl?.()
    } else {
      navigate(action)
    }
  }

  function handleRecentSearch(query: string) {
    onOpenChange(false)
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search your knowledge base or run a quick action"
      showCloseButton={false}
      className="max-w-xl rounded-xl border-border/50 bg-background shadow-2xl"
    >
      <CommandInput
        placeholder="Search your knowledge base..."
        value={searchValue}
        onValueChange={setSearchValue}
        onKeyDown={(e) => {
          if (e.key === "Enter" && searchValue.trim()) {
            e.preventDefault()
            handleSearchSubmit()
          }
        }}
      />
      <CommandList className="max-h-[360px]">
        <CommandEmpty className="py-8">
          <div className="flex flex-col items-center gap-2">
            <Search className="size-5 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No results found</p>
          </div>
        </CommandEmpty>

        {searchValue.trim() && (
          <CommandGroup>
            <CommandItem onSelect={handleSearchSubmit} className="gap-3 py-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="size-4 text-primary" />
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium">
                  Search &ldquo;{searchValue.trim()}&rdquo;
                </span>
                <span className="text-xs text-muted-foreground">
                  AI-powered search across your knowledge base
                </span>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </CommandItem>
          </CommandGroup>
        )}

        {!searchValue.trim() && (
          <>
            <CommandGroup heading="Recent">
              {recentSearches.map((query) => (
                <CommandItem
                  key={query}
                  onSelect={() => handleRecentSearch(query)}
                  className="gap-3"
                >
                  <Clock className="size-3.5 text-muted-foreground/60" />
                  <span className="text-sm">{query}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Quick Actions">
              {quickActions.map((action) => (
                <CommandItem
                  key={action.label}
                  onSelect={() => handleQuickAction(action.action)}
                  className="gap-3"
                >
                  <action.icon className="size-3.5 text-muted-foreground/60" />
                  <span className="text-sm">{action.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Search Tips">
              <div className="px-2 py-3">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 size-3.5 text-muted-foreground/40" />
                  <p className="text-xs leading-relaxed text-muted-foreground/70">
                    Ask natural questions like &ldquo;What are the tradeoffs of vector
                    databases?&rdquo; — Nexus searches across all your saved content and synthesizes
                    an answer.
                  </p>
                </div>
              </div>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
