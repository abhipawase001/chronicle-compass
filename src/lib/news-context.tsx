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

const initialDocs: NewsDoc[] = [
  {
    id: "d1",
    name: "The Indian Express — 12 Mar 2026.pdf",
    language: "English",
    publishedAt: "2026-03-12",
    status: "ready",
    progress: 100,
  },
  {
    id: "d2",
    name: "Loksatta — 04 Apr 2026.pdf",
    language: "Marathi",
    publishedAt: "2026-04-04",
    status: "ready",
    progress: 100,
  },
  {
    id: "d3",
    name: "Dainik Bhaskar — 21 May 2026.jpg",
    language: "Hindi",
    publishedAt: "2026-05-21",
    status: "extracting",
    progress: 62,
  },
  {
    id: "d4",
    name: "Gujarat Samachar — 09 Jun 2026.pdf",
    language: "Gujarati",
    publishedAt: "2026-06-09",
    status: "pending",
    progress: 0,
  },
];

const summariesByLanguage: Record<string, string[]> = {
  English: [
    "State infrastructure board clears the coastal expressway extension, with tenders opening next quarter.",
    "Municipal audit flags delays in the metro depot land transfer; a review committee is constituted.",
    "Public hearing records 480 written objections on the riverfront redevelopment masterplan.",
    "Cabinet approves revised funding pattern; central share rises to 60 percent of project cost.",
    "Completion deadline formally moved to late 2028 after contractor mobilisation issues.",
  ],
  Hindi: [
    "राज्य अवसंरचना बोर्ड ने तटीय एक्सप्रेसवे विस्तार को मंजूरी दी, अगली तिमाही में निविदाएँ खुलेंगी।",
    "नगर निगम ऑडिट ने मेट्रो डिपो भूमि हस्तांतरण में देरी बताई; समीक्षा समिति गठित।",
    "रिवरफ्रंट पुनर्विकास योजना पर जनसुनवाई में 480 लिखित आपत्तियाँ दर्ज।",
    "मंत्रिमंडल ने संशोधित वित्तपोषण को मंजूरी दी; केंद्र का हिस्सा बढ़कर 60 प्रतिशत।",
    "ठेकेदार की तैयारी में दिक्कतों के बाद पूर्णता समयसीमा 2028 के अंत तक बढ़ी।",
  ],
  Marathi: [
    "राज्य पायाभूत सुविधा मंडळाने किनारी द्रुतगती मार्ग विस्ताराला मान्यता दिली; निविदा पुढील तिमाहीत.",
    "महापालिका लेखापरीक्षणात मेट्रो डेपो जमीन हस्तांतरणास विलंब; समिती स्थापन.",
    "नदीकाठ पुनर्विकास आराखड्यावर जनसुनावणीत ४८० लेखी हरकती नोंद.",
    "मंत्रिमंडळाने सुधारित निधी रचनेस मान्यता; केंद्राचा वाटा ६० टक्क्यांवर.",
    "कंत्राटदाराच्या अडचणींमुळे प्रकल्प पूर्णत्वाची मुदत २०२८ अखेरपर्यंत.",
  ],
  Gujarati: [
    "રાજ્ય માળખાગત બોર્ડે દરિયાકાંઠાના એક્સપ્રેસવે વિસ્તરણને મંજૂરી આપી; ટેન્ડર આગામી ત્રિમાસિકમાં.",
    "મ્યુનિસિપલ ઓડિટમાં મેટ્રો ડેપો જમીન તબદીલીમાં વિલંબ; સમીક્ષા સમિતિ રચાઈ.",
    "રિવરફ્રન્ટ પુનર્વિકાસ યોજના પર જાહેર સુનાવણીમાં ૪૮૦ લેખિત વાંધા.",
    "કેબિનેટે સુધારેલ ભંડોળ માળખું મંજૂર કર્યું; કેન્દ્રનો હિસ્સો ૬૦ ટકા.",
    "કોન્ટ્રાક્ટરની સમસ્યાઓ બાદ પૂર્ણતાની સમયમર્યાદા ૨૦૨૮ના અંત સુધી.",
  ],
  Spanish: [
    "La junta de infraestructura aprueba la ampliación de la autopista costera; licitaciones el próximo trimestre.",
    "Una auditoría municipal señala retrasos en la cesión del terreno del depósito del metro.",
    "La audiencia pública registra 480 objeciones escritas al plan de reurbanización ribereña.",
    "El gabinete aprueba el nuevo esquema de financiación; el aporte central sube al 60 por ciento.",
    "El plazo de finalización se traslada a finales de 2028 por problemas del contratista.",
  ],
};

const originals: { date: string; source: string; language: string; text: string }[] = [
  {
    date: "2026-01-18",
    source: "The Indian Express",
    language: "English",
    text: "The State Infrastructure Board on Saturday cleared the 32-km coastal expressway extension. Officials said tenders would be floated in the next quarter.",
  },
  {
    date: "2026-02-27",
    source: "Loksatta",
    language: "Marathi",
    text: "महापालिकेच्या लेखापरीक्षण अहवालात मेट्रो डेपोसाठीच्या जमीन हस्तांतरणात विलंब झाल्याचे नमूद करण्यात आले असून समीक्षा समिती नेमण्यात आली आहे.",
  },
  {
    date: "2026-04-04",
    source: "Dainik Bhaskar",
    language: "Hindi",
    text: "रिवरफ्रंट पुनर्विकास मास्टरप्लान पर आयोजित जनसुनवाई में कुल 480 लिखित आपत्तियाँ दर्ज की गईं, जिनमें अधिकांश पुनर्वास से जुड़ी थीं।",
  },
  {
    date: "2026-05-21",
    source: "Gujarat Samachar",
    language: "Gujarati",
    text: "કેબિનેટે સુધારેલ ભંડોળ પેટર્નને મંજૂરી આપી છે, જેમાં કેન્દ્રનો હિસ્સો વધીને પ્રોજેક્ટ ખર્ચના ૬૦ ટકા થશે.",
  },
  {
    date: "2026-06-30",
    source: "The Indian Express",
    language: "English",
    text: "Following contractor mobilisation issues, the completion deadline for the corridor has been formally revised to late 2028, the department confirmed.",
  },
];

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
          : /samachar|gujarat/i.test(n)
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
