// /app/api/summarize/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { transcript, prompt } = await req.json();

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${prompt}\n\nTranscript:\n${transcript}` }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // Debug log (to see what Gemini returns)
    console.log("Gemini API response:", JSON.stringify(data, null, 2));

    // Extract summary safely
    const summary =
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      data.candidates?.[0]?.output ??
      "No summary generated.";

    return NextResponse.json({ summary });
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
