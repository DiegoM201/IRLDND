import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is required");
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }
  return aiClient;
}

// 1. Generate Perks API Endpoint
app.post("/api/generate-perks", async (req, res) => {
  try {
    const { archetype, race, highestStat, lowestStat, customInput, stats } = req.body; // 🌟 Destructures race choice
    
    const ai = getAi();
    const prompt = `You are a creative D&D game designer creating comedy passive abilities for an IRL character sheet app.
The user belongs to the following customized identity profile:
- Queer Race Blueprint: ${race || "Twink"} (This uses lighthearted LGBTQ+ subculture slang descriptions)
- Character Archetype: ${archetype || "The Wildcard"}
- Highest Attribute: ${highestStat || "Wisdom"}
- Lowest Attribute: ${lowestStat || "Strength"}
- Hobbies / Context: "${customInput || "Enjoys coffee, table games, staying up late"}"

Please generate exactly 2 hilarious, creative, and mechanically sound real-world perks tailored directly around their Chosen Queer Race (${race}) and their Archetype. 
Each perk must match this exact schema:
- A catchy name.
- A functional game trigger and modifier description matching real life.
- A witty flavor description detailing how this trait operates during everyday hangouts or errands.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              effect: { type: Type.STRING, description: "Game modifier effect, e.g. +2 to Wisdom when selecting coffee" },
              description: { type: Type.STRING },
              trigger: { type: Type.STRING }
            },
            required: ["title", "effect", "description", "trigger"]
          }
        },
        systemInstruction: "You are an affectionate, brilliant Tabletop RPG game master. Combine D&D stat mechanics with funny, lighthearted nods to queer community terminology (Twink, Twunk, Twas, Otter, Bear) respectfully and hilariously."
      }
    });

    res.json(JSON.parse((response.text || "[]").trim()));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. DM Advice Chat Endpoint
app.post("/api/dm-help", async (req, res) => {
  try {
    const { character, message } = req.body;
    const ai = getAi();
    
    const prompt = `The player is asking for situational real-world campaign advice.
--- SHEET STATS ---
Name: ${character.name}
Race Blueprint: ${character.race || "Twink"}  <-- 🌟 Custom Queer context fed to chat pipeline
Archetype: ${character.role}
Level: ${character.level}
Strength: ${character.stats.strength} | Dexterity: ${character.stats.dexterity} | Constitution: ${character.stats.constitution} | Intelligence: ${character.stats.intelligence} | Wisdom: ${character.stats.wisdom} | Charisma: ${character.stats.charisma}

--- SITUATION ---
"${message}"

Provide a punchy, D&D-flavored response under 160 words. Sardonically suggest a custom Difficulty Class (DC) scale check (e.g., 'Pass a DC 14 Wisdom check to survive the meeting'). Weave their queer race identity and attribute blocks directly into your ruling!`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a witty, sarcastic, and supportive tabletop Dungeon Master. Treat all mundane real-world tasks as tactical grid encounters."
      }
    });

    res.json({ text: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`Server executing cleanly on port ${PORT}`));
}

startServer();
