// supabase/functions/transcribe-audio/index.ts
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  try {
    const { audio, language = "en" } = await req.json();

    if (!audio || typeof audio !== "string") {
      return new Response(
        JSON.stringify({ error: "No audio data provided" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    console.log(`Processing audio transcription for language: ${language} ...`);

    // Base64 -> Uint8Array (supports large payloads)
    const binary = atob(audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    // Build multipart form
    const form = new FormData();
    const mime = "audio/webm"; // your recorder yields webm/opus
    const audioBlob = new Blob([bytes], { type: mime });
    form.append("file", audioBlob, "audio.webm");

    // Choose model (keep your original model name)
    form.append("model", "gpt-4o-transcribe");

    // Help the model with language hint
    form.append("language", language === "th" ? "th" : "en");

    const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openAIApiKey}` },
      body: form,
    });

    if (!resp.ok) {
      const errTxt = await resp.text();
      console.error("Transcription API error:", errTxt);
      return new Response(
        JSON.stringify({ error: `Transcription failed: ${errTxt}` }),
        { status: resp.status, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const data = await resp.json();
    const text: string = (data?.text ?? "").trim();
    console.log("Transcription result:", text);

    // Optional: reject low-content to prevent "." from reaching the client
    if (text.length < 2 || /^[\p{P}\p{Z}\p{C}]+$/u.test(text)) {
      return new Response(
        JSON.stringify({ error: "No meaningful speech detected", text }),
        { status: 422, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
    );

  } catch (e) {
    console.error("Error in transcription function:", e);
    return new Response(
      JSON.stringify({ error: String(e?.message ?? e) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
