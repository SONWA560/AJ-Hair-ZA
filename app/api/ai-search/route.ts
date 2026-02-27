import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { getProducts, logSearchQuery } from "../../../lib/firebase/firestore";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query, userId } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Invalid search query" },
        { status: 400 },
      );
    }

    // AI prompt for wig-specific interpretation
    const prompt = `You are a wig expert specializing in African hair textures and styles. Convert this user request into a JSON filter: "${query}"

Available hair types: "kinky_curly", "straight", "coily", "wavy", "body_wave", "deep_wave", "water_wave"
Available lengths: "14in", "16in", "18in", "20in", "22in", "24in", "26in"
Available colors: "Natural Black", "Jet Black", "Brown", "Blonde", "Burgundy", "613 Blonde"
Available densities: "150%", "180%", "200%", "250%"
Available occasions: "daily", "professional", "wedding", "party", "protective"
Available lace types: "13x4 Transparent", "13x6 HD", "4x4 Closure", "360 Lace"

Return only JSON in this format:
{
  "hair_type": "kinky_curly|straight|coily|wavy|body_wave|deep_wave|water_wave",
  "length": "14in|16in|18in|20in|22in|24in|26in",
  "color": "Natural Black|Jet Black|Brown|Blonde|Burgundy|613 Blonde",
  "density": "150%|180%|200%|250%",
  "occasion": "daily|professional|wedding|party|protective",
  "lace_type": "13x4 Transparent|13x6 HD|4x4 Closure|360 Lace"
}

Examples:
User: "I want a long straight wig for work"
Response: {"hair_type": "straight", "length": "22in", "occasion": "professional"}

User: "Need a curly wig for daily use"
Response: {"hair_type": "kinky_curly", "occasion": "daily"}

User: "Looking for a natural black wig for wedding"
Response: {"color": "Natural Black", "occasion": "wedding"}

User: "short protective style"
Response: {"hair_type": "kinky_curly", "length": "14in", "occasion": "protective"}

Return only the JSON, no additional text:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 150,
      temperature: 0.3, // Lower temperature for more consistent results
    });

    const aiResponseText = completion.choices[0]?.message?.content;

    if (!aiResponseText) {
      throw new Error("No response from AI");
    }

    // Parse AI response
    let aiFilters = {};
    try {
      aiFilters = JSON.parse(aiResponseText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponseText);
      // Fallback to basic text search
      const products = await getProducts();
      await logSearchQuery(query, userId, {
        fallback: true,
        resultsCount: products.length,
      });

      return NextResponse.json({
        products,
        filters: {},
        aiInterpretation:
          "Could not interpret your request, showing all products",
      });
    }

    // Remove empty/null values from filters
    const cleanFilters = Object.fromEntries(
      Object.entries(aiFilters).filter(
        ([_, value]) => value !== null && value !== undefined && value !== "",
      ),
    );

    // Get products based on AI filters
    const products = await getProducts(cleanFilters);

    // Log the search query for analytics
    await logSearchQuery(query, userId, {
      aiFilters: cleanFilters,
      resultsCount: products.length,
    });

    // Generate human-friendly interpretation
    const interpretations = [];
    if (cleanFilters.hair_type) {
      const hairTypeMap = {
        kinky_curly: "kinky curly",
        straight: "straight",
        coily: "coily",
        wavy: "wavy",
        body_wave: "body wave",
        deep_wave: "deep wave",
        water_wave: "water wave",
      };
      interpretations.push(
        hairTypeMap[cleanFilters.hair_type as keyof typeof hairTypeMap] ||
          cleanFilters.hair_type,
      );
    }
    if (cleanFilters.length) interpretations.push(cleanFilters.length);
    if (cleanFilters.color) interpretations.push(cleanFilters.color);
    if (cleanFilters.occasion) interpretations.push(cleanFilters.occasion);

    const aiInterpretation =
      interpretations.length > 0
        ? `Showing ${interpretations.join(", ")} wigs`
        : "Showing all available wigs";

    // Generate alternative suggestions
    const suggestions = [];
    if (products.length === 0) {
      suggestions.push("Try using fewer filters");
      suggestions.push("Browse our kinky curly collection");
      suggestions.push("Check out our straight hair wigs");
    } else if (products.length < 5) {
      suggestions.push("Try searching with fewer specifications");
    } else if (products.length > 20) {
      suggestions.push("Add more details to narrow results");
    }

    return NextResponse.json({
      products,
      filters: cleanFilters,
      aiInterpretation,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    });
  } catch (error) {
    console.error("AI search error:", error);

    // Fallback to basic search if AI fails
    try {
      const { query, userId } = await request.json();
      const products = await getProducts();

      await logSearchQuery(query, userId, {
        error: "AI failed",
        resultsCount: products.length,
      });

      return NextResponse.json({
        products,
        filters: {},
        aiInterpretation: "AI search unavailable, showing all products",
        error: "AI search temporarily unavailable",
      });
    } catch (fallbackError) {
      console.error("Fallback search also failed:", fallbackError);
      return NextResponse.json(
        { error: "Search temporarily unavailable" },
        { status: 500 },
      );
    }
  }
}

export async function GET() {
  return NextResponse.json({
    message: "AI Search API for Wig Store",
    usage: 'POST with { "query": "your wig request", "userId": "optional" }',
    examples: [
      "I want a long straight wig for work",
      "Need a curly wig for daily use",
      "Looking for a natural black wig for wedding",
      "short protective style",
    ],
  });
}
