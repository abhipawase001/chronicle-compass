import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, FileText, UploadCloud, Trash2, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive" },
};

function UploadsPage() {
  const { uploadedFiles, addFiles, deleteDocument, isUploading, uploadError } = useNews();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      await addFiles(Array.from(files));
    },
  });

  const handleFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    
    const validFiles = Array.from(list).filter((f) => {
      const type = f.type.toLowerCase();
      return type === "application/pdf" || type.startsWith("image/");
    });

    if (validFiles.length === 0) {
      alert("Please upload only PDF or image files (JPG, PNG)");
      return;
    }

    if (validFiles.length !== list.length) {
      alert(`${list.length - validFiles.length} file(s) were skipped (not PDF or image)`);
    }

    uploadMutation.mutate(
      new (DataTransfer as any)([...validFiles]).items as FileList
    );
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

        {(uploadError || uploadMutation.error) && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              {uploadError || (uploadMutation.error instanceof Error ? uploadMutation.error.message : "Upload failed")}
            </AlertDescription>
          </Alert>
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-14 text-center transition-colors",
            dragging ? "border-primary bg-accent" : "border-border bg-card",
            isUploading || uploadMutation.isPending ? "opacity-50 cursor-not-allowed" : ""
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <UploadCloud className="size-6" />
          </span>
          <p className="text-base font-medium">Drag & drop newspapers here</p>
          <p className="text-sm text-muted-foreground">PDF, JPG or PNG — up to 40 pages each</p>
          <Button 
            variant="outline" 
            onClick={() => inputRef.current?.click()}
            disabled={isUploading || uploadMutation.isPending}
          >
            {isUploading || uploadMutation.isPending ? "Uploading..." : "Browse files"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={isUploading || uploadMutation.isPending}
          />
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">
            Uploaded Newspapers ({uploadedFiles.length})
          </h2>
          
          {uploadedFiles.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <FileText className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No documents yet. Upload a newspaper to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uploadedFiles.map((doc) => {
                const s = statusStyles[doc.status];
                return (
                  <Card key={doc.id} className={doc.status === "failed" ? "border-destructive/50" : ""}>
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                            <FileText className="size-4 text-muted-foreground" />
                          </span>
                          <p className="line-clamp-2 text-sm font-medium leading-snug break-words">
                            {doc.name}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDocument(doc.id)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          disabled={isUploading || uploadMutation.isPending}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {doc.language && <Badge variant="outline">{doc.language}</Badge>}
                        <Badge className={cn("border-transparent", s.className)}>
                          {s.label}
                        </Badge>
                        {doc.articleCount ? (
                          <Badge variant="secondary">{doc.articleCount} articles</Badge>
                        ) : null}
                      </div>

                      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5" />
                        {new Date(doc.publishedAt ?? new Date()).toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>

                      {doc.status !== "ready" && doc.status !== "failed" && (
                        <div className="space-y-1">
                          <Progress value={doc.progress} />
                          <p className="text-xs text-muted-foreground">
                            {Math.round(doc.progress)}% extracted
                          </p>
                        </div>
                      )}

                      {doc.status === "failed" && doc.error && (
                        <div className="rounded-md bg-destructive/10 p-2">
                          <p className="text-xs text-destructive">{doc.error}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
