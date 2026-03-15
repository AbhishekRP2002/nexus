import type { SearchResultItem, CitationSource, SearchPhase } from "./types"

export interface SearchStreamState {
  phase: SearchPhase
  results: SearchResultItem[]
  answerText: string
  citations: Record<string, CitationSource>
  followUpQuestions: string[]
  error: string | null
}

type StateCallback = (state: SearchStreamState) => void

const CACHE_TTL_MS = 5 * 60 * 1000
const MAX_CACHE_ENTRIES = 50
const STORAGE_KEY = "nexus:search-cache"

interface CacheEntry {
  state: SearchStreamState
  timestamp: number
}

const cache = new Map<string, CacheEntry>(loadFromStorage())

function loadFromStorage(): [string, CacheEntry][] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const entries: [string, CacheEntry][] = JSON.parse(raw)
    const now = Date.now()
    // Filter out expired entries on load
    return entries.filter(([, entry]) => now - entry.timestamp <= CACHE_TTL_MS)
  } catch {
    return []
  }
}

function persistToStorage() {
  try {
    const entries = Array.from(cache.entries())
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

function getCacheKey(query: string, userId: string): string {
  return `${userId}:${query.trim().toLowerCase()}`
}

function getCached(key: string): SearchStreamState | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key)
    persistToStorage()
    return null
  }
  return entry.state
}

function setCache(key: string, state: SearchStreamState) {
  // Evict oldest entries if at capacity
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value
    if (oldestKey !== undefined) cache.delete(oldestKey)
  }
  cache.set(key, { state: { ...state }, timestamp: Date.now() })
  persistToStorage()
}

/**
 * Look up a cached result without triggering a search.
 * Used by the search page to instantly restore results on back/reload.
 */
export function getCachedResult(query: string, userId: string): SearchStreamState | null {
  return getCached(getCacheKey(query, userId))
}

/**
 * Connects to the search SSE endpoint and streams updates via callback.
 * Returns an AbortController to cancel the stream.
 * Serves completed results from cache when available.
 */
export function streamSearch(
  query: string,
  userId: string,
  onUpdate: StateCallback,
): AbortController {
  const controller = new AbortController()
  const cacheKey = getCacheKey(query, userId)

  // Return cached result immediately if available
  const cached = getCached(cacheKey)
  if (cached) {
    // Deliver synchronously on next microtask so the caller
    // can still store the returned controller before updates fire
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        onUpdate({ ...cached })
      }
    })
    return controller
  }

  const state: SearchStreamState = {
    phase: "retrieving",
    results: [],
    answerText: "",
    citations: {},
    followUpQuestions: [],
    error: null,
  }

  const params = new URLSearchParams({ q: query, userId })
  const url = `/api/search/stream?${params.toString()}`

  fetchSSE(url, controller.signal, state, onUpdate, cacheKey)

  return controller
}

async function fetchSSE(
  url: string,
  signal: AbortSignal,
  state: SearchStreamState,
  onUpdate: StateCallback,
  cacheKey: string,
) {
  try {
    const response = await fetch(url, {
      signal,
      headers: { Accept: "text/event-stream" },
    })

    if (!response.ok) {
      state.phase = "error"
      state.error = `Search failed (${response.status})`
      onUpdate({ ...state })
      return
    }

    const reader = response.body?.getReader()
    if (!reader) return

    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Parse SSE events from buffer
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? "" // Keep incomplete line in buffer

      let eventType = ""
      let eventData = ""

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7).trim()
        } else if (line.startsWith("data: ")) {
          eventData = line.slice(6)
        } else if (line === "" && eventType && eventData) {
          // End of event
          handleEvent(eventType, eventData, state)
          onUpdate({ ...state })
          eventType = ""
          eventData = ""
        }
      }
    }

    // Cache successful completed results
    if (state.phase === "done" && !state.error) {
      setCache(cacheKey, state)
    }
  } catch (err) {
    if (signal.aborted) return // Intentional cancellation
    state.phase = "error"
    state.error = err instanceof Error ? err.message : "Search failed"
    onUpdate({ ...state })
  }
}

function handleEvent(event: string, data: string, state: SearchStreamState) {
  try {
    const parsed = JSON.parse(data)

    switch (event) {
      case "status":
        if (typeof parsed.phase === "string" && parsed.phase.toLowerCase().includes("retriev")) {
          state.phase = "retrieving"
        } else if (
          typeof parsed.phase === "string" &&
          parsed.phase.toLowerCase().includes("generat")
        ) {
          state.phase = "generating"
        }
        break
      case "sources":
        state.results = parsed.results ?? []
        break
      case "response-delta":
        state.phase = "generating"
        state.answerText += parsed.delta ?? ""
        break
      case "citations":
        state.citations = parsed.citations ?? {}
        break
      case "follow-up":
        state.followUpQuestions = parsed.questions ?? []
        break
      case "error":
        state.error = parsed.message ?? "Unknown error"
        break
      case "done":
        state.phase = "done"
        break
    }
  } catch {
    // Ignore malformed events
  }
}
