import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    if (!image)
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 },
      );

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${image}` },
            },
            {
              type: "text",
              text: `You are a wig expert. Analyze this image and describe the wig in natural language focusing on:
- Hair type: straight, wavy, body wave, deep wave, water wave, kinky curly, or coily
- Approximate length: short (14-16in), medium (18-20in), or long (22-26in)
- Color: Natural Black, Jet Black, Brown, Blonde, Burgundy, or 613 Blonde

Return ONLY a short search phrase like "long straight black wig" or "medium body wave blonde wig".
If this is not a wig image, return "wig".`,
            },
          ],
        },
      ],
      max_tokens: 50,
    });

    const query =
      response.choices[0]?.message?.content?.trim() || "wig";
    return NextResponse.json({ query });
  } catch (error) {
    console.error("Image search error:", error);
    return NextResponse.json({ query: "wig" });
  }
}
