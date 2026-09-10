import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownUp, CalendarDays, FileText, Newspaper, Search } from "lucide-react";

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SearchPage() {
  const { timelineResults, runSearch, searchQuery, selectedLanguage } = useNews();
  const [term, setTerm] = useState(searchQuery);
  const [modalOpen, setModalOpen] = useState(false);
  const [order, setOrder] = useState<"newest" | "oldest">("oldest");
  const [excluded, setExcluded] = useState<string[]>([]);

  const sources = useMemo(
    () => Array.from(new Set(timelineResults.map((r) => r.source))),
    [timelineResults],
  );

  const visible = useMemo(() => {
    const rows = timelineResults.filter((r) => !excluded.includes(r.source));
    return [...rows].sort((a, b) =>
      order === "oldest" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date),
    );
  }, [timelineResults, excluded, order]);

  const submit = () => {
    if (!term.trim()) return;
    setModalOpen(true);
  };

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
              />
            </div>
            <Button size="lg" className="h-12" onClick={submit}>
              Search
            </Button>
          </div>
        </section>

        {timelineResults.length === 0 ? (
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
                            c ? prev.filter((p) => p !== s) : [...prev, s],
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
        onConfirm={(language) => {
          runSearch(term.trim(), language);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
