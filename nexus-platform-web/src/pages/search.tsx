import { useSearchParams } from "react-router-dom"
import { Search, Sparkles, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get("q") ?? ""

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

  return (
    <div className="mx-auto max-w-3xl p-6">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Results for
      </p>
      <h1 className="mb-6 text-xl font-semibold text-foreground">{query}</h1>

      <Tabs defaultValue="answer">
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="answer" className="gap-1.5">
            <Sparkles className="size-3.5" />
            AI Answer
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-1.5">
            <FileText className="size-3.5" />
            Results (0)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="answer" className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
            <Sparkles className="size-3.5" />
            Synthesized from your knowledge base
          </div>
          <Card className="gap-0 border-border/40 bg-card/30 py-0">
            <CardContent className="p-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                AI-powered answers will appear here once your knowledge base has content. Search
                results are synthesized from your saved articles, threads, and notes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card className="gap-0 border-border/40 bg-card/30 py-0">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No matching content found. Try a different query or add more content to your
                knowledge base.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
