import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownUp, CalendarDays, FileText, Newspaper, Search, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { LanguageModal } from "@/components/language-modal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNews } from "@/lib/news-context";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search Engine — News Chronicle AI" },
      {
        name: "description",
        content:
          "Search people, entities and events across multilingual newspapers and generate a chronological, translated timeline report.",
      },
      { property: "og:title", content: "Search Engine — News Chronicle AI" },
      {
        property: "og:description",
        content: "Generate chronological, translated timelines from multilingual newspapers.",
      },
    ],
  }),
  component: SearchPage,
});

function formatDate(iso: string | null) {
  if (!iso) return "Unknown date";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SearchPage() {
  const { timelineResults, runSearch, searchQuery, selectedLanguage, isSearching, searchError, articles } = useNews();
  const [term, setTerm] = useState(searchQuery);
  const [modalOpen, setModalOpen] = useState(false);
  const [order, setOrder] = useState<"newest" | "oldest">("oldest");
  const [excluded, setExcluded] = useState<string[]>([]);

  const searchMutation = useMutation({
    mutationFn: async (data: { query: string; language: string }) => {
      await runSearch(data.query, data.language);
    },
  });

  const sources = useMemo(
    () => Array.from(new Set(timelineResults.map((r) => r.source))),
    [timelineResults]
  );

  const visible = useMemo(() => {
    const rows = timelineResults.filter((r) => !excluded.includes(r.source));
    return [...rows].sort((a, b) =>
      order === "oldest"
        ? (a.date ?? "").localeCompare(b.date ?? "")
        : (b.date ?? "").localeCompare(a.date ?? "")
    );
  }, [timelineResults, excluded, order]);

  const submit = () => {
    if (!term.trim()) return;
    setModalOpen(true);
  };

  const handleLanguageConfirm = async (language: string) => {
    await searchMutation.mutateAsync({ query: term.trim(), language });
    setModalOpen(false);
  };

  const hasDocuments = articles.length > 0;
  const isLoading = isSearching || searchMutation.isPending;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="space-y-4 pt-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Query Engine</h1>
          <p className="text-sm text-muted-foreground">
            Track any entity across every ingested newspaper, in any language.
          </p>
          <div className="mx-auto flex max-w-2xl gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Search entities, people, or events..."
                className="h-12 pl-9 text-base"
                aria-label="Search entities, people, or events"
                disabled={isLoading || !hasDocuments}
              />
            </div>
            <Button 
              size="lg" 
              className="h-12" 
              onClick={submit}
              disabled={isLoading || !hasDocuments}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </section>

        {!hasDocuments ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
              <Newspaper className="size-8 text-muted-foreground" />
              <p className="font-medium">No documents uploaded yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Upload newspapers on the Ingestion Engine page to start searching.
              </p>
            </CardContent>
          </Card>
        ) : searchError ? (
          <Alert variant="destructive">
            <AlertDescription>{searchError}</AlertDescription>
          </Alert>
        ) : timelineResults.length === 0 && searchQuery ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
              <Newspaper className="size-8 text-muted-foreground" />
              <p className="font-medium">No results found</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Try searching for a different entity or upload more documents.
              </p>
            </CardContent>
          </Card>
        ) : timelineResults.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
              <Newspaper className="size-8 text-muted-foreground" />
              <p className="font-medium">No timeline yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Run a search and choose an output language to build a chronological report.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <ArrowDownUp className="size-3.5" /> Sort
                </Label>
                <Select value={order} onValueChange={(v) => setOrder(v as "newest" | "oldest")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Sources
                </Label>
                <div className="space-y-2">
                  {sources.map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={!excluded.includes(s)}
                        onCheckedChange={(c) =>
                          setExcluded((prev) =>
                            c ? prev.filter((p) => p !== s) : [...prev, s]
                          )
                        }
                      />
                      <span className="truncate">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            <section>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Query: {searchQuery}</Badge>
                <Badge>{selectedLanguage} report</Badge>
                <span className="text-sm text-muted-foreground">{visible.length} mentions</span>
              </div>

              <ol className="relative space-y-6 border-l border-border pl-6">
                {visible.map((item) => (
                  <li key={item.id} className="relative">
                    <span className="absolute -left-[31px] top-5 size-3 rounded-full border-2 border-background bg-primary" />
                    <Card>
                      <CardContent className="space-y-3 p-5">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            <CalendarDays className="size-3.5" />
                            {formatDate(item.date)}
                          </span>
                          <Badge variant="outline" className="gap-1">
                            <Newspaper className="size-3" />
                            {item.source}
                          </Badge>
                          <Badge variant="secondary">{item.originalLanguage}</Badge>
                        </div>
                        {item.headline && (
                          <p className="font-medium text-sm">{item.headline}</p>
                        )}
                        <p className="text-sm leading-relaxed">{item.translatedSummary}</p>
                        <Accordion type="single" collapsible>
                          <AccordionItem value="src" className="border-b-0">
                            <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline">
                              <span className="inline-flex items-center gap-1.5">
                                <FileText className="size-3.5" /> View Original Source Text
                              </span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <p className="rounded-md bg-muted/60 p-3 text-sm leading-relaxed">
                                {item.originalText}
                              </p>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </div>

      <LanguageModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        query={term}
        onConfirm={handleLanguageConfirm}
      />
    </div>
  );
}
