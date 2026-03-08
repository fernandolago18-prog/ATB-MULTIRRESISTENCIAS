export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { base64Image, mimeType } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'La API Key de Gemini no está configurada en las variables de entorno de Vercel.' });
  }

  const prompt = `Analiza esta imagen de un antibiograma clínico. Extrae TODOS los antibióticos visibles con sus valores de CMI (Concentración Mínima Inhibitoria) y su categoría de sensibilidad (S=Sensible, I=Intermedio, R=Resistente).

Devuelve EXCLUSIVAMENTE un JSON array con objetos que tengan estos campos:
- "antibiotic": nombre del antibiótico
- "mic": valor de CMI como string (ejemplo: "0.5", "<=0.25", ">=16")
- "sir": categoría ("S", "I", o "R")

Ejemplo de formato de respuesta:
[{"antibiotic":"Amikacina","mic":"4","sir":"S"},{"antibiotic":"Meropenem","mic":">=16","sir":"R"}]

Devuelve SOLO el JSON, sin texto adicional, sin markdown, sin bloques de código.`;

  try {
    console.log("Calling Gemini API with model gemini-1.5-flash...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Google API Error Body:", JSON.stringify(err));
      return res.status(response.status).json({ 
        error: err.error?.message || `Error HTTP ${response.status} de la API de Google`,
        details: err.error || null
      });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'No se encontraron datos de antibiograma en la respuesta de la IA' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
       return res.status(500).json({ error: 'Formato de respuesta inesperado desde la IA' });
    }

    const results = parsed.map(item => ({
      antibiotic: item.antibiotic || '',
      mic: String(item.mic || ''),
      sir: (item.sir || '').toUpperCase()
    }));

    return res.status(200).json(results);

  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error.message || "Error interno del servidor conectando con Gemini" });
  }
}
