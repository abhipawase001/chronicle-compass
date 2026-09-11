import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { extractEntitiesAndDates, extractArticlesFromText } from "./entity-extraction";

export type DocStatus = "pending" | "extracting" | "ready" | "failed";

export type NewsDoc = {
  id: string;
  name: string;
  language: string | null;
  publishedAt: string | null;
  status: DocStatus;
  progress: number;
  error?: string | null;
  articleCount?: number;
};

export type Article = {
  id: string;
  documentId: string;
  headline: string | null;
  date: string | null;
  source: string;
  originalText: string;
  originalLanguage: string;
  entities: string[];
};

export type TimelineItem = {
  id: string;
  date: string | null;
  source: string;
  headline: string | null;
  translatedSummary: string;
  originalText: string;
  originalLanguage: string;
};

export const LANGUAGES = [
  "English",
  "Hindi",
  "Marathi",
  "Gujarati",
  "Bengali",
  "Tamil",
  "Spanish",
  "French",
  "German",
] as const;

type Ctx = {
  // Documents
  uploadedFiles: NewsDoc[];
  addFiles: (files: File[]) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  
  // Articles
  articles: Article[];
  
  // Search & Timeline
  searchQuery: string;
  selectedLanguage: string;
  timelineResults: TimelineItem[];
  runSearch: (query: string, language: string) => Promise<void>;
  isSearching: boolean;
  searchError: string | null;
  
  // Loading states
  isUploading: boolean;
  uploadError: string | null;
};

const NewsContext = createContext<Ctx | null>(null);

export function NewsProvider({ children }: { children: ReactNode }) {
  const [uploadedFiles, setUploadedFiles] = useState<NewsDoc[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [timelineResults, setTimelineResults] = useState<TimelineItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Simulate document processing with real entity extraction
  const addFiles = useCallback(async (files: File[]) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      for (const file of files) {
        const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Add pending document
        const newDoc: NewsDoc = {
          id: docId,
          name: file.name,
          language: null,
          publishedAt: new Date().toISOString().slice(0, 10),
          status: "pending",
          progress: 0,
          articleCount: 0,
        };
        
        setUploadedFiles((prev) => [newDoc, ...prev]);

        // Detect language from filename
        const detectedLanguage = /hindi|हिन्दी|मराठी|marathi|ગુજરાતી|gujarati/i.test(file.name) 
          ? /मराठी|marathi/i.test(file.name) ? "Marathi"
          : /hindi|हिन्दी/i.test(file.name) ? "Hindi"
          : /gujarati|ગુજરાતી/i.test(file.name) ? "Gujarati"
          : "English"
          : "English";

        // Simulate file reading and text extraction
        let progress = 0;
        const interval = setInterval(async () => {
          progress += Math.random() * 15;
          
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            try {
              // Read file content (in real app, PDF extraction happens here)
              const text = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                  // For demo: treat as text if possible, otherwise generate mock
                  if (typeof e.target?.result === "string") {
                    resolve(e.target.result.slice(0, 5000));
                  } else {
                    resolve(`Sample newspaper content from ${file.name}. This contains news articles and information about various topics and events.`);
                  }
                };
                reader.onerror = () => resolve(`Content from ${file.name}`);
                reader.readAsText(file).catch(() => {
                  resolve(`Sample content from ${file.name}`);
                });
              });

              // Extract articles from text
              const extractedArticles = await extractArticlesFromText(
                text,
                file.name,
                new Date().toISOString().slice(0, 10)
              );

              // Extract entities from each article
              const mockArticles: Article[] = [];
              for (let i = 0; i < extractedArticles.length; i++) {
                const article = extractedArticles[i];
                
                // Extract entities for this article
                const extraction = await extractEntitiesAndDates(
                  article.text,
                  detectedLanguage
                );

                const artId = `art-${docId}-${i + 1}`;
                mockArticles.push({
                  id: artId,
                  documentId: docId,
                  headline: article.headline,
                  date: article.date || new Date().toISOString().slice(0, 10),
                  source: file.name,
                  originalText: article.text.slice(0, 1000),
                  originalLanguage: detectedLanguage,
                  entities: extraction.entities
                    .slice(0, 15)
                    .map((e) => e.name),
                });
              }

              setUploadedFiles((prev) =>
                prev.map((d) =>
                  d.id === docId
                    ? {
                        ...d,
                        status: "ready",
                        progress: 100,
                        language: detectedLanguage,
                        articleCount: mockArticles.length,
                      }
                    : d
                )
              );

              setArticles((prev) => [...mockArticles, ...prev]);
            } catch (error) {
              console.error("Processing error:", error);
              const message = error instanceof Error ? error.message : "Processing failed";
              
              setUploadedFiles((prev) =>
                prev.map((d) =>
                  d.id === docId
                    ? {
                        ...d,
                        status: "failed",
                        progress: 100,
                        error: message,
                      }
                    : d
                )
              );
            }
          } else {
            setUploadedFiles((prev) =>
              prev.map((d) =>
                d.id === docId ? { ...d, status: "extracting", progress: Math.round(progress) } : d
              )
            );
          }
        }, 300);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    setUploadedFiles((prev) => prev.filter((d) => d.id !== id));
    setArticles((prev) => prev.filter((a) => a.documentId !== id));
  }, []);

  const runSearch = useCallback(async (query: string, language: string) => {
    setIsSearching(true);
    setSearchError(null);

    try {
      setSearchQuery(query);
      setSelectedLanguage(language);

      // Simulate search delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Filter articles matching the query
      const lower = query.toLowerCase();
      const matching = articles.filter(
        (a) =>
          a.originalText.toLowerCase().includes(lower) ||
          a.headline?.toLowerCase().includes(lower) ||
          a.entities.some((e) => e.toLowerCase().includes(lower))
      );

      if (matching.length === 0) {
        setTimelineResults([]);
        return;
      }

      // Convert to timeline items with simulated translations
      const results: TimelineItem[] = matching.map((a) => {
        // Simple translation simulation based on language
        let translatedSummary = a.originalText.slice(0, 150);
        if (language !== "English" && a.originalLanguage !== language) {
          translatedSummary = `[${language}] ${translatedSummary}`;
        }
        translatedSummary += ` ... (Query: "${query}")`;

        return {
          id: a.id,
          date: a.date,
          source: a.source,
          headline: a.headline,
          translatedSummary,
          originalText: a.originalText,
          originalLanguage: a.originalLanguage,
        };
      });

      setTimelineResults(results.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "")));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Search failed";
      setSearchError(message);
    } finally {
      setIsSearching(false);
    }
  }, [articles]);

  const value = useMemo(
    () => ({
      uploadedFiles,
      addFiles,
      deleteDocument,
      articles,
      searchQuery,
      selectedLanguage,
      timelineResults,
      runSearch,
      isSearching,
      searchError,
      isUploading,
      uploadError,
    }),
    [
      uploadedFiles,
      addFiles,
      deleteDocument,
      articles,
      searchQuery,
      selectedLanguage,
      timelineResults,
      runSearch,
      isSearching,
      searchError,
      isUploading,
      uploadError,
    ]
  );

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
}

export function useNews() {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error("useNews must be used inside NewsProvider");
  return ctx;
}
