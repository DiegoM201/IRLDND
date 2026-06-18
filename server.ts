import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy initialize Gemini API client to prevent crashing on boot if key is missing
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST APIs
// 1. Generate Perks API
app.post("/api/generate-perks", async (req, res) => {
  try {
    const { archetype, highestStat, lowestStat, customInput, stats } = req.body;
    
    const ai = getAi();
    const prompt = `You are a creative D&D-style game designer creating custom perks for a real-life comedy character sheet.
We need exactly 2 "IRL Passive Perks" based on the following user characteristics:
- Archetype: ${archetype || "Unknown"}
- Highest Stat: ${highestStat || "Wisdom"}
- Lowest Stat: ${lowestStat || "Strength"}
- User details/hobbies: "${customInput || "Doting coder, loves snacks, hates waking up early"}"
- Stats details: Strength (${stats?.strength || 10}), Dexterity (${stats?.dexterity || 10}), Constitution (${stats?.constitution || 10}), Intelligence (${stats?.intelligence || 10}), Wisdom (${stats?.wisdom || 10}), Charisma (${stats?.charisma || 10})

Please generate exactly 2 hilarious, creative, and mechanically fun real-world perks that map to these traits.
Each perk must have:
- A catchy and witty title (e.g., "Pizza Conjurer", "Adrenaline Nap", "Stack Overflow Alchemist", "Rule Shark")
- A real-world trigger condition and bonus modifier mapped to the 6 stats (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma).
- A funny mechanical description explaining how it plays out in everyday life (advantage, penalty, or social check).

Return this response in valid JSON matching the schema of an array of perks.`;

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
              title: { type: Type.STRING, description: "Catcy, funny name of the perk" },
              effect: { type: Type.STRING, description: "The funny game mechanics or modifier description (e.g., +2 to Charisma when offering food)" },
              description: { type: Type.STRING, description: "A humorous and witty explanation of how it affects their daily real life" },
              trigger: { type: Type.STRING, description: "Specific real-world trigger (e.g., Ordering takeout, reading documentation)" }
            },
            required: ["title", "effect", "description", "trigger"]
          }
        },
        systemInstruction: "You are the ultimate witty D&D Game Master who translates mundane real-world quirks into legendary gamer traits. Keep your tone lighthearted, humorous, and full of tabletop RPG jokes."
      }
    });

    const text = response.text || "[]";
    res.json(JSON.parse(text.trim()));
  } catch (error: any) {
    console.error("Error generating perks:", error);
    res.status(500).json({ 
      error: error.message || "Failed to generate perks from the Dungeon Master",
      fallback: [
        {
          title: "Caffeine Overdrive",
          effect: "+2 to Dexterity when double-fisting hot beverages",
          description: "Your fingers move with the speed of light, but you must pass a DC 12 Constitution check to avoid dropping your mug.",
          trigger: "Consuming coffee or energy drinks"
        },
        {
          title: "Slayer of Jars",
          effect: "Advantage on Strength checks when opening tight lids",
          description: "Through sheer willpower and rubber grip pads, you are the designated jar opener of the household.",
          trigger: "Someone hands you a vacuum-sealed container"
        }
      ]
    });
  }
});

// 2. DM Advice Chat API
app.post("/api/dm-help", async (req, res) => {
  try {
    const { character, message, history } = req.body;
    
    const ai = getAi();
    
    const prompt = `The player is asking for advice on how to handle a real-life situation using their custom IRL Character Sheet.
--- PLAYER SHEET ---
Name: ${character.name || "Adventurer"}
Archetype: ${character.role || "The Wildcard"}
Level: ${character.level || 1}
STATS:
- Strength: ${character.stats.strength} (Mod: ${Math.floor((character.stats.strength - 10) / 2)})
- Dexterity: ${character.stats.dexterity} (Mod: ${Math.floor((character.stats.dexterity - 10) / 2)})
- Constitution: ${character.stats.constitution} (Mod: ${Math.floor((character.stats.constitution - 10) / 2)})
- Intelligence: ${character.stats.intelligence} (Mod: ${Math.floor((character.stats.intelligence - 10) / 2)})
- Wisdom: ${character.stats.wisdom} (Mod: ${Math.floor((character.stats.wisdom - 10) / 2)})
- Charisma: ${character.stats.charisma} (Mod: ${Math.floor((character.stats.charisma - 10) / 2)})

PERKS:
${(character.perks || []).map((p: any) => `- ${p.title}: ${p.effect} (${p.description})`).join("\n")}

--- SCENARIO / USER QUERY ---
"${message}"

Provide a highly entertaining, D&D-flavored response telling them EXACTLY how to resolve this.
1. Suggest a specific Stat Check they should roll (e.g., "Pass a DC 14 Wisdom (Insight) check to see if your dad is actually mad about the lawn").
2. Tell them how their Perks could help or hinder them.
3. Keep the advice incredibly funny, framing normal life as a tabletop RPG encounter. Write in the voice of a classic, whimsical, and slightly sarcastic Dungeon Master.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an affectionate, snarky, and brilliant Dungeon Master running an IRL Campaign. All of real life is an interactive board game to you. Frame your suggestions with DC (Difficulty Class) checks and stat math. Keep responses under 180 words, concise and punchy."
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in DM help:", error);
    res.status(500).json({ error: error.message || "Failed to communicate with the Dungeon Master." });
  }
});

// Setup Vite Dev server or static files serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
