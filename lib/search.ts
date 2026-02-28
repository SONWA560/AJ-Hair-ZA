import OpenAI from "openai";
import {
    getProducts,
    logSearchQuery,
    searchProducts,
} from "./firebase/firestore";
import type { Product } from "./types";

const PROMPT = `You are a wig expert specialising in African hair textures and styles. Convert this user request into a JSON filter: "{query}"

Available hair types: "kinky_curly", "straight", "coily", "wavy", "body_wave", "deep_wave", "water_wave"
Available lengths: "14in", "16in", "18in", "20in", "22in", "24in", "26in"
Available colors: "Natural Black", "Jet Black", "Brown", "Blonde", "Burgundy", "613 Blonde"
Available densities: "150%", "180%", "200%", "250%"
Available occasions: "daily", "professional", "wedding", "party", "protective"
Available lace types: "13x4 Transparent", "13x6 HD", "4x4 Closure", "360 Lace"

Return ONLY a JSON object (no markdown, no explanation) with any of these keys that apply:
{
  "hair_type": "...",
  "length": "...",
  "color": "...",
  "density": "...",
  "occasion": "...",
  "lace_type": "..."
}

Examples:
User: "I want a long straight wig for work"
{"hair_type":"straight","length":"22in","occasion":"professional"}

User: "Need a curly wig for daily use"
{"hair_type":"kinky_curly","occasion":"daily"}

User: "short protective style"
{"hair_type":"kinky_curly","length":"14in","occasion":"protective"}`;

const HAIR_TYPE_LABELS: Record<string, string> = {
  kinky_curly: "kinky curly",
  straight: "straight",
  coily: "coily",
  wavy: "wavy",
  body_wave: "body wave",
  deep_wave: "deep wave",
  water_wave: "water wave",
};

function buildInterpretation(filters: Record<string, string>): string {
  const parts: string[] = [];
  if (filters.hair_type)
    parts.push(HAIR_TYPE_LABELS[filters.hair_type] ?? filters.hair_type);
  if (filters.length) parts.push(filters.length);
  if (filters.color) parts.push(filters.color);
  if (filters.occasion) parts.push(filters.occasion);
  if (filters.lace_type) parts.push(filters.lace_type);
  return parts.length > 0 ? `Showing ${parts.join(", ")} wigs` : "";
}

export interface AiSearchResult {
  products: Product[];
  aiInterpretation: string;
  suggestions?: string[];
}

export async function aiSearch(query: string): Promise<AiSearchResult> {
  // Try AI-powered search first
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: PROMPT.replace("{query}", query) },
        ],
        max_tokens: 150,
        temperature: 0.3,
      });

      const raw = completion.choices[0]?.message?.content ?? "";

      let filters: Record<string, string> = {};
      try {
        filters = JSON.parse(raw);
      } catch {
        // JSON parse failed — fall through to keyword search below
        throw new Error("Could not parse AI response");
      }

      // Strip empty/null values
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v != null && v !== ""),
      );

      const products = await getProducts(cleanFilters);

      await logSearchQuery(query, undefined, {
        aiFilters: cleanFilters,
        resultsCount: products.length,
      });

      const aiInterpretation = buildInterpretation(cleanFilters);

      const suggestions: string[] = [];
      if (products.length === 0) {
        suggestions.push("Try using fewer filters");
        suggestions.push("Browse our collections");
      } else if (products.length < 5) {
        suggestions.push("Try searching with fewer specifications");
      }

      return {
        products,
        aiInterpretation,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };
    } catch (err) {
      console.error("[aiSearch] AI failed, falling back to keyword search:", err);
    }
  }

  // Fallback: keyword-based search
  const products = await searchProducts(query);
  return {
    products,
    aiInterpretation: "",
  };
}
