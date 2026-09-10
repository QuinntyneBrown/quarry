import { frameworks } from "./catalog";
import type { Framework } from "./catalog";

// Hand-authored concept vectors demonstrate ranking offline. This is a simulation,
// not a language model or production semantic embedding of the catalog metadata.
const concepts = [
  {
    terms: [
      "animal hospital",
      "veterinary",
      "vet",
      "clinic",
      "patient",
      "pet care",
      "practice",
      "records",
      "record",
      "intake",
      "hospital",
      "healthcare",
    ],
    label: "Intake and records",
  },
  {
    terms: [
      "appointment",
      "appointments",
      "booking",
      "bookings",
      "schedule",
      "scheduling",
      "reservation",
      "travel",
      "hotel",
      "availability",
    ],
    label: "Appointments and bookings",
  },
  {
    terms: [
      "forms",
      "form",
      "onboarding",
      "portal",
      "registration",
      "client",
      "clients",
      "intake",
    ],
    label: "Forms and client experiences",
  },
  {
    terms: [
      "analytics",
      "dashboard",
      "dashboards",
      "reporting",
      "data",
      "metrics",
      "monitoring",
      "performance",
    ],
    label: "Data and reporting",
  },
  {
    terms: [
      "online store",
      "ecommerce",
      "e-commerce",
      "shop",
      "store",
      "commerce",
      "retail",
      "checkout",
      "product",
      "products",
      "marketplace",
    ],
    label: "Products and checkout",
  },
  {
    terms: [
      "music",
      "media",
      "video",
      "streaming",
      "social",
      "community",
      "communities",
      "creator",
      "audio",
    ],
    label: "Media and communities",
  },
  {
    terms: [
      "blog",
      "editorial",
      "publishing",
      "publication",
      "articles",
      "journal",
      "knowledge",
      "documentation",
      "content",
    ],
    label: "Content and publishing",
  },
  {
    terms: [
      "developer",
      "code",
      "terminal",
      "infrastructure",
      "console",
      "devtools",
      "logs",
      "system",
    ],
    label: "Developer workflows",
  },
];

// Dimensions follow the concepts above; styling and colors never enter ranking.
const sampleVectors: Record<string, number[]> = {
  cornerstone: [1, 0.8, 0.6, 0.3, 0, 0, 0, 0.1],
  form: [0.6, 0.1, 1, 0, 0.1, 0, 0, 0],
  pulse: [0, 0, 0, 0, 0, 1, 0.3, 0],
  folio: [0, 0, 0, 0, 0.1, 0.2, 1, 0],
  orbit: [0.15, 0, 0, 1, 0.1, 0, 0, 0.2],
  coast: [0.35, 1, 0.3, 0, 0.2, 0, 0.1, 0],
  mono: [0, 0, 0.1, 0.25, 0, 0, 0.1, 1],
  mango: [0, 0.1, 0.2, 0.1, 1, 0, 0, 0],
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function contains(text: string, term: string) {
  return ` ${text} `.includes(` ${normalize(term)} `);
}
function similarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const length = Math.hypot(...a) * Math.hypot(...b);
  return length ? dot / length : 0;
}

export type Recommendation = {
  framework: Framework;
  reason: string;
  score: number;
};
export function recommend(
  query: string,
  technology: string,
): { results: Recommendation[]; concepts: string[] } {
  const normalized = normalize(query);
  const vector: number[] = concepts.map((concept) =>
    concept.terms.some((term) => contains(normalized, term)) ? 1 : 0,
  );
  // Practice projects also imply appointment and intake experiences.
  if (vector[0]) {
    vector[1] = Math.max(vector[1], 0.65);
    vector[2] = Math.max(vector[2], 0.55);
  }
  const catalog = frameworks.filter(
    (f) => technology === "All technologies" || f.type === technology,
  );
  if (!query.trim())
    return {
      results: catalog.sort((a, b) => {
        const left = a.name.toLowerCase();
        const right = b.name.toLowerCase();
        return left < right ? -1 : left > right ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      }).map((framework) => ({
        framework,
        reason: "",
        score: 0,
      })),
      concepts: [],
    };
  if (!normalized) return { results: [], concepts: [] };
  const results = catalog
    .map((framework) => {
      const literalMatch = [
        framework.name,
        framework.type,
        ...framework.tags,
        ...framework.useCases,
      ].some((value) => contains(normalize(value), normalized));
      const score = literalMatch
        ? 1.1
        : similarity(vector, sampleVectors[framework.id]);
      const reason = literalMatch
        ? `Matches ${framework.name}'s name, technology, tags, or use cases.`
        : `${framework.capabilities[0]} support ${framework.useCases[0].toLowerCase()}.`;
      return { framework, reason, score };
    })
    .filter((item) => item.score >= 0.3)
    .sort((a, b) => b.score - a.score || (a.framework.id < b.framework.id ? -1 : a.framework.id > b.framework.id ? 1 : 0))
    .slice(0, 3);
  return {
    results,
    concepts: concepts
      .filter((_, index) => vector[index] > 0)
      .map((concept) => concept.label),
  };
}
