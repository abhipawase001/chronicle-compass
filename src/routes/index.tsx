import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, FileText, UploadCloud } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNews, type DocStatus } from "@/lib/news-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ingestion Engine — News Chronicle AI" },
      {
        name: "description",
        content:
          "Upload multilingual newspaper PDFs and scans, track extraction status, and prepare documents for entity timelines.",
      },
      { property: "og:title", content: "Ingestion Engine — News Chronicle AI" },
      {
        property: "og:description",
        content: "Upload newspapers and track extraction status across languages.",
      },
    ],
  }),
  component: UploadsPage,
});

const statusStyles: Record<DocStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
  extracting: { label: "Extracting", className: "bg-chart-4/20 text-foreground" },
  ready: { label: "Ready", className: "bg-primary/10 text-primary" },
};

function UploadsPage() {
  const { uploadedFiles, addFiles } = useNews();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (list: FileList | null) => {
    if (!list?.length) return;
    addFiles(Array.from(list).map((f) => f.name));
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Ingestion Engine</h1>
          <p className="text-sm text-muted-foreground">
            Drop newspaper PDFs or page scans — language and dates are detected automatically.
          </p>
        </header>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handle(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-14 text-center transition-colors",
            dragging ? "border-primary bg-accent" : "border-border bg-card",
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <UploadCloud className="size-6" />
          </span>
          <p className="text-base font-medium">Drag & drop newspapers here</p>
          <p className="text-sm text-muted-foreground">PDF, JPG or PNG — up to 40 pages each</p>
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            Browse files
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => handle(e.target.files)}
          />
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Uploaded Newspapers</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {uploadedFiles.map((doc) => {
              const s = statusStyles[doc.status];
              return (
                <Card key={doc.id}>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <FileText className="size-4 text-muted-foreground" />
                      </span>
                      <p className="line-clamp-2 text-sm font-medium leading-snug">{doc.name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{doc.language}</Badge>
                      <Badge className={cn("border-transparent", s.className)}>{s.label}</Badge>
                    </div>
                    <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      {new Date(doc.publishedAt).toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {doc.status !== "ready" && (
                      <div className="space-y-1">
                        <Progress value={doc.progress} />
                        <p className="text-xs text-muted-foreground">
                          {Math.round(doc.progress)}% extracted
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
