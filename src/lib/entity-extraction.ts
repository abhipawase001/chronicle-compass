import { aiJson, type AiPart } from "./ai.server";

export type Entity = {
  name: string;
  type: "person" | "place" | "organization" | "event" | "other";
  confidence: number;
  mentions: number;
};

export type DateMention = {
  date: string; // YYYY-MM-DD format
  context: string;
  confidence: number;
};

export type ExtractionResult = {
  entities: Entity[];
  dates: DateMention[];
  language: string;
  summary: string;
};

const ENTITY_EXTRACTION_SYSTEM = `You are an expert NLP system that extracts named entities and dates from newspaper text.
Your task is to identify and categorize all named entities (people, places, organizations, events) and extract date references.

Return ONLY valid JSON in this exact format:
{
  "entities": [
    {
      "name": "entity name",
      "type": "person|place|organization|event|other",
      "confidence": 0.95,
      "mentions": 1
    }
  ],
  "dates": [
    {
      "date": "YYYY-MM-DD or partial date",
      "context": "brief context where date appears",
      "confidence": 0.9
    }
  ],
  "language": "detected language",
  "summary": "1-2 sentence summary of main content"
}

Guidelines:
- Confidence scores should be 0.0 to 1.0
- Only include high-confidence extractions (>0.7)
- For dates, use YYYY-MM-DD format when complete, partial dates otherwise
- Count entity mentions across the entire text
- Detect the language of the input text
- Keep entity names exactly as they appear in text
- Never invent facts or entities not in the text`;

export async function extractEntitiesAndDates(
  text: string,
  language?: string
): Promise<ExtractionResult> {
  if (!text || text.trim().length < 20) {
    return {
      entities: [],
      dates: [],
      language: language || "Unknown",
      summary: "Text too short to extract information",
    };
  }

  try {
    const result = await aiJson<ExtractionResult>({
      system: ENTITY_EXTRACTION_SYSTEM,
      parts: [
        {
          type: "text",
          text: `Extract entities and dates from this text:\n\n${text.slice(0, 8000)}`,
        },
      ],
    });

    // Validate and clean results
    return {
      entities: (result.entities ?? []).filter((e) => e.confidence > 0.7).slice(0, 50),
      dates: (result.dates ?? []).filter((d) => d.confidence > 0.6).slice(0, 30),
      language: result.language || language || "Unknown",
      summary: result.summary || "No summary available",
    };
  } catch (error) {
    console.error("Entity extraction failed:", error);
    return {
      entities: [],
      dates: [],
      language: language || "Unknown",
      summary: "Extraction failed",
    };
  }
}

export async function extractArticlesFromText(
  text: string,
  documentName: string,
  publishedDate?: string
): Promise<
  Array<{
    headline: string;
    text: string;
    date: string | null;
    entities: string[];
  }>
> {
  const ARTICLE_SPLIT_SYSTEM = `You are an expert journalist who splits newspaper text into individual articles.
Each article has a headline and body text. Return ONLY valid JSON:
{
  "articles": [
    {
      "headline": "Article Headline",
      "text": "Full article body text",
      "date": "YYYY-MM-DD or null",
      "entities": ["person", "place", "organization"]
    }
  ]
}

Rules:
- Identify distinct articles in the text
- Each article must have at least 20 words
- Extract or create appropriate headlines
- Keep original language
- Use article_date if present, otherwise use document publication date
- Include key entities mentioned in each article
- Return maximum 10 articles`;

  try {
    const result = await aiJson<{
      articles?: Array<{
        headline: string;
        text: string;
        date: string | null;
        entities: string[];
      }>;
    }>({
      system: ARTICLE_SPLIT_SYSTEM,
      parts: [
        {
          type: "text",
          text: `Document: ${documentName}\nPublished: ${publishedDate || "unknown"}\n\nText:\n${text.slice(0, 12000)}`,
        },
      ],
    });

    const articles = result.articles ?? [];
    return articles
      .filter((a) => (a.text ?? "").trim().length > 20)
      .map((a) => ({
        headline: a.headline || "Untitled Article",
        text: a.text || "",
        date: a.date || publishedDate || null,
        entities: (a.entities ?? []).filter(Boolean),
      }))
      .slice(0, 10);
  } catch (error) {
    console.error("Article splitting failed:", error);
    // Fallback: return entire text as single article
    return [
      {
        headline: documentName || "Article",
        text: text.slice(0, 4000),
        date: publishedDate || null,
        entities: [],
      },
    ];
  }
}

export function mergeEntities(entityLists: Entity[][]): Entity[] {
  const merged = new Map<string, Entity>();

  for (const list of entityLists) {
    for (const entity of list) {
      const key = `${entity.name.toLowerCase()}|${entity.type}`;
      if (merged.has(key)) {
        const existing = merged.get(key)!;
        existing.mentions += entity.mentions;
        existing.confidence = Math.max(existing.confidence, entity.confidence);
      } else {
        merged.set(key, { ...entity });
      }
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 100);
}

export function filterEntitiesByType(
  entities: Entity[],
  type: "person" | "place" | "organization" | "event" | "other"
): Entity[] {
  return entities.filter((e) => e.type === type);
}

export function searchEntitiesByName(
  entities: Entity[],
  query: string,
  threshold = 0.7
): Entity[] {
  const lower = query.toLowerCase();
  return entities.filter(
    (e) =>
      e.name.toLowerCase().includes(lower) ||
      (e.name.toLowerCase().similarity?.(lower) ?? 0) > threshold
  );
}

// Simple string similarity for fuzzy matching
export function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.indexOf(shorter) > -1) return shorter.length / longer.length;

  const editDistance = levenshteinDistance(longer, shorter);
  return 1 - editDistance / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}
