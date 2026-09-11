import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type DocStatus = "pending" | "extracting" | "ready";

export type NewsDoc = {
  id: string;
  name: string;
  language: string;
  publishedAt: string;
  status: DocStatus;
  progress: number;
};

export type TimelineItem = {
  id: string;
  date: string;
  source: string;
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

const initialDocs: NewsDoc[] = [];

const summariesByLanguage: Record<string, string[]> = {
  English: [],
  Hindi: [],
  Marathi: [],
  Gujarati: [],
  Spanish: [],
};

const originals: { date: string; source: string; language: string; text: string }[] = [];

function buildResults(query: string, language: string): TimelineItem[] {
  const pool = summariesByLanguage[language] ?? summariesByLanguage["English"] ?? [];
  return originals.map((o, i) => ({
    id: `t${i + 1}`,
    date: o.date,
    source: o.source,
    translatedSummary: `${pool[i % pool.length] ?? ""} (${query})`,
    originalText: o.text,
    originalLanguage: o.language,
  }));
}

type Ctx = {
  uploadedFiles: NewsDoc[];
  addFiles: (names: string[]) => void;
  searchQuery: string;
  selectedLanguage: string;
  timelineResults: TimelineItem[];
  runSearch: (query: string, language: string) => void;
};

const NewsContext = createContext<Ctx | null>(null);

export function NewsProvider({ children }: { children: ReactNode }) {
  const [uploadedFiles, setUploadedFiles] = useState<NewsDoc[]>(initialDocs);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [timelineResults, setTimelineResults] = useState<TimelineItem[]>([]);

  const addFiles = useCallback((names: string[]) => {
    const guessLang = (n: string) =>
      /loksatta|marathi/i.test(n)
        ? "Marathi"
        : /bhaskar|hindi/i.test(n)
          ? "Hindi"
          : /samachar|gujarati/i.test(n)
            ? "Gujarati"
            : "English";

    const created: NewsDoc[] = names.map((name, i) => ({
      id: `u${Date.now()}-${i}`,
      name,
      language: guessLang(name),
      publishedAt: new Date().toISOString().slice(0, 10),
      status: "pending",
      progress: 0,
    }));
    setUploadedFiles((prev) => [...created, ...prev]);

    created.forEach((doc) => {
      const timer = setInterval(() => {
        setUploadedFiles((prev) =>
          prev.map((d) => {
            if (d.id !== doc.id) return d;
            const progress = Math.min(100, d.progress + 8 + Math.random() * 12);
            const status: DocStatus = progress >= 100 ? "ready" : "extracting";
            if (progress >= 100) clearInterval(timer);
            return { ...d, progress, status };
          }),
        );
      }, 450);
    });
  }, []);

  const runSearch = useCallback((query: string, language: string) => {
    setSearchQuery(query);
    setSelectedLanguage(language);
    setTimelineResults(buildResults(query, language));
  }, []);

  const value = useMemo(
    () => ({ uploadedFiles, addFiles, searchQuery, selectedLanguage, timelineResults, runSearch }),
    [uploadedFiles, addFiles, searchQuery, selectedLanguage, timelineResults, runSearch],
  );

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
}

export function useNews() {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error("useNews must be used inside NewsProvider");
  return ctx;
}
