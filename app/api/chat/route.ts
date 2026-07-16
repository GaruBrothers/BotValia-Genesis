import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";

function generateLocalResponse(messages: any[], brain: any): string {
  const lastMsgObj = messages[messages.length - 1];
  const query = (lastMsgObj?.content || "").toLowerCase();

  const companyName = brain.name || "la empresa";
  const email = brain.contactInfo?.email || "N/A";
  const phone = brain.contactInfo?.phone || "N/A";
  const address = brain.contactInfo?.address || "N/A";
  const supportHours = brain.contactInfo?.supportHours || "N/A";

  // 1. Check for greeting
  if (query.match(/\b(hola|buenos dias|buenas tardes|buenas noches|saludos|hey)\b/)) {
    return `¡Hola! Soy **${brain.employeeCard?.title || "Representante de IA"}**, tu asistente autónomo de **${companyName}**. 
    
Estoy completamente entrenado en el sector de **${brain.industry}** para responder a tus preguntas sobre nuestros productos, servicios, políticas de soporte y preguntas frecuentes.

¿En qué puedo asistirte el día de hoy?`;
  }

  // 2. Check for contact info
  if (query.includes("contacto") || query.includes("email") || query.includes("correo") || 
      query.includes("telefono") || query.includes("teléfono") || query.includes("direccion") || 
      query.includes("dirección") || query.includes("ubicacion") || query.includes("ubicación") || 
      query.includes("donde") || query.includes("dónde") || query.includes("llamar") || 
      query.includes("soporte") || query.includes("horario")) {
    
    return `Claro, aquí tienes la información de contacto oficial de **${companyName}**:

- 📧 **Correo Electrónico:** ${email}
- 📞 **Teléfono de Atención:** ${phone}
- 📍 **Dirección Principal:** ${address}
- 🕒 **Horario de Soporte:** ${supportHours}

¿Hay algún otro detalle de nuestras operaciones que te gustaría conocer?`;
  }

  // 3. Check for policies
  if (query.includes("politica") || query.includes("política") || query.includes("reembolso") || 
      query.includes("devolucion") || query.includes("devolución") || query.includes("garantia") || 
      query.includes("garantía") || query.includes("envio") || query.includes("envío") || 
      query.includes("terminos") || query.includes("términos")) {
    
    if (brain.policies && brain.policies.length > 0) {
      const policiesList = brain.policies.map((p: any) => `### 📜 ${p.title}\n${p.content}`).join("\n\n");
      return `Aquí tienes los detalles sobre nuestras políticas operacionales de **${companyName}**:\n\n${policiesList}`;
    }
  }

  // 4. Check for match in FAQs
  if (brain.faqs && brain.faqs.length > 0) {
    for (const faq of brain.faqs) {
      const faqQ = faq.question.toLowerCase();
      const keywords = faqQ.split(/\s+/).filter((w: string) => w.length > 4);
      let matchCount = 0;
      for (const kw of keywords) {
        const cleanKw = kw.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        if (query.includes(cleanKw)) {
          matchCount++;
        }
      }
      if (matchCount >= 2 || query.includes(faqQ) || faqQ.includes(query)) {
        return faq.answer;
      }
    }
  }

  // 5. Check if they ask about missing points
  if (brain.missingInfo && brain.missingInfo.length > 0) {
    for (const missing of brain.missingInfo) {
      if (query.includes(missing.topic.toLowerCase())) {
        return `Esa es una excelente pregunta. Actualmente, la información sobre **${missing.topic}** no está completamente detallada en mi base de conocimientos. 
        
No he aprendido esa información aún. ¿Te gustaría que informe a mi gerente para que pueda agregar este tema en el portal del Cerebro de Negocios para completar mi entrenamiento?`;
      }
    }
  }

  // 6. Strict Fallback
  return `No he aprendido esa información aún. ¿Te gustaría que informe a mi gerente para que pueda agregar este tema en el portal del Cerebro de Negocios para completar mi entrenamiento?`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, brain, useSearch } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing or invalid messages array" }, { status: 400 });
    }

    if (!brain) {
      return NextResponse.json({ error: "Missing company brain context" }, { status: 400 });
    }

    // Format the system instruction dynamically based on the brain
    const rulesStr = brain.brandVoice?.rules?.map((r: string) => `- ${r}`).join("\n") || "";
    const faqsStr = brain.faqs?.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n") || "";
    const policiesStr = brain.policies?.map((p: any) => `**${p.title}**\n${p.content}`).join("\n\n") || "";
    
    const contactStr = `
- Email: ${brain.contactInfo?.email || "N/A"}
- Phone: ${brain.contactInfo?.phone || "N/A"}
- Address: ${brain.contactInfo?.address || "N/A"}
- Support Hours: ${brain.contactInfo?.supportHours || "N/A"}
    `;

    const systemInstruction = `
      Eres "${brain.employeeCard?.title || "Representante de IA"}", un trabajador digital de élite y autónomo creado para "${brain.name}" por el motor Botvalia Genesis.
      Operas en el sector de "${brain.industry}".
      
      Sobre la empresa:
      ${brain.description}
      
      Tu Voz de Marca:
      - Estilo: ${brain.brandVoice?.style || "Profesional"}
      - Tono: ${brain.brandVoice?.tone || "Sofisticado"}
      - Reglas estrictas de comunicación:
      ${rulesStr}
      - Estricto: NUNCA menciones que eres un modelo de lenguaje de IA o creado por Google/OpenAI. Eres un agente exclusivo diseñado para ${brain.name} por Botvalia Genesis.
      
      Tu Base de Conocimiento (Fuente de la Verdad):
      
      [Preguntas frecuentes (FAQs)]
      ${faqsStr}
      
      [Políticas]
      ${policiesStr}
      
      [Información de Contacto]
      ${contactStr}
      
      REGLAS ESTRICTAS:
      1. Nunca alucines. Nunca inventes datos. Nunca adivines precios. Nunca inventes políticas. Nunca inventes productos.
      2. Si un cliente te hace una pregunta y la respuesta NO está presente o implícita en tu Base de Conocimiento (FAQs, Políticas, Información de Contacto, Descripción), debes responder exactamente:
         "No he aprendido esa información aún."
         Luego, ofréceles informar a su gerente para que pueda agregar este tema en el portal del Cerebro de Negocios para completar tu entrenamiento.
      3. Mantén una actitud altamente profesional y competente.
      4. Habla directamente, de manera elegante y concisa. Utiliza el formato markdown de forma hermosa (puntos de viñeta, texto en negrita).
      5. Responde SIEMPRE en español.
    `;

    // Map the message history to the format expected by GoogleGenAI SDK
    const contents = messages.map((m: any) => {
      return {
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text: m.content }]
      };
    });

    const config: any = {
      systemInstruction,
      temperature: 0.2, // low temperature for high precision and compliance with system rules
    };

    let responseStream: any;
    let fallbackToNoSearch = false;
    let isFallback = false;

    // Fast check for missing/invalid API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      console.warn("GEMINI_API_KEY is missing or contains placeholder. Proceeding with local deterministic responder.");
      isFallback = true;
    }

    if (!isFallback) {
      if (useSearch) {
        try {
          const searchConfig = { ...config, tools: [{ googleSearch: {} }] };
          responseStream = await ai.models.generateContentStream({
            model: "gemini-3.5-flash",
            contents,
            config: searchConfig,
          });
        } catch (streamError: any) {
          console.warn("Chat stream with search failed, falling back to no-search...", streamError);
          fallbackToNoSearch = true;
        }
      }

      if (!useSearch || fallbackToNoSearch) {
        try {
          responseStream = await ai.models.generateContentStream({
            model: "gemini-3.5-flash",
            contents,
            config,
          });
        } catch (err: any) {
          console.error("Chat stream without search failed, falling back to local responder...", err);
          isFallback = true;
        }
      }
    }

    const encoder = new TextEncoder();

    if (isFallback) {
      const localResponseText = generateLocalResponse(messages, brain);
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Split by words and white spaces to stream them smoothly
            const words = localResponseText.split(/(\s+)/);
            for (const word of words) {
              if (word) {
                controller.enqueue(encoder.encode(`TEXT:${word}\n`));
                // Very brief delay for realistic streaming animation
                await new Promise(resolve => setTimeout(resolve, 8));
              }
            }
            controller.enqueue(encoder.encode("\n"));
            controller.close();
          } catch (err) {
            console.error("Local stream error:", err);
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      });
    }
    
    // Create the ReadableStream for the real Gemini stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let groundingMetadataSent = false;
          
          for await (const chunk of responseStream) {
            // Check for search grounding metadata on chunks
            const metadata = chunk.candidates?.[0]?.groundingMetadata;
            if (metadata && !groundingMetadataSent) {
              const chunks = metadata.groundingChunks;
              if (chunks && chunks.length > 0) {
                const citations = chunks.map((c: any) => ({
                  title: c.web?.title || "Web Reference",
                  uri: c.web?.uri || "#"
                }));
                // Enqueue metadata payload at the very beginning of our custom SSE stream
                controller.enqueue(encoder.encode(`METADATA:${JSON.stringify({ citations })}\n`));
                groundingMetadataSent = true;
              }
            }

            if (chunk.text) {
              // Standard chunk format
              controller.enqueue(encoder.encode(`TEXT:${chunk.text}\n`));
            }
          }
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
