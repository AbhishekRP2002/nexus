import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Search, Sparkles, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = "answer" | "results"

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get("q") ?? ""
  const [activeTab, setActiveTab] = useState<Tab>("answer")

  if (!query) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <div className="rounded-full bg-muted/50 p-4">
          <Search className="size-8 text-muted-foreground/50" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-medium text-foreground">Search your knowledge base</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the search bar above to ask questions or find content.
          </p>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: typeof Sparkles }[] = [
    { id: "answer", label: "AI Answer", icon: Sparkles },
    { id: "results", label: "Results (0)", icon: FileText },
  ]

  return (
    <div className="mx-auto max-w-3xl p-6">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Results for
      </p>
      <h1 className="mb-6 text-xl font-semibold text-foreground">{query}</h1>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 border-b border-border/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 pb-2.5 pt-1 text-[13px] font-medium transition-colors",
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "answer" ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
            <Sparkles className="size-3.5" />
            Synthesized from your knowledge base
          </div>
          <div className="rounded-lg border border-border/40 bg-card/50 p-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              AI-powered answers will appear here once your knowledge base has content. Search
              results are synthesized from your saved articles, threads, and notes.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border/40 bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No matching content found. Try a different query or add more content to your knowledge
            base.
          </p>
        </div>
      )}
    </div>
  )
}
