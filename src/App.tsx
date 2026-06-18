import { useState, useRef, useEffect } from "react";
import { 
  Dice5, MessageSquareText, Shield, Award, Terminal, Copy, Check, LogOut, Send 
} from "lucide-react";
import { CharacterSheet, StatBlock, Perk, STAT_DESCRIPTIONS, ChatMessage } from "./types";
import Wizard from "./components/Wizard";

export default function App() {
  const [character, setCharacter] = useState<CharacterSheet | null>(() => {
    const saved = localStorage.getItem("irl_character_sheet");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<"sheet" | "dm" | "markdown">("sheet");
  const [copyStatus, setCopyStatus] = useState<boolean>(false);
  const [devMode, setDevMode] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  
  const [rollResult, setRollResult] = useState<{
    statName: string; natural: number; modifier: number; total: number; bracket: string; message: string;
  } | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome", sender: "dm",
      text: "Greetings, noble traveler! Throw any mundane encounter or task at me and I will formulate the RPG response rules you must execute!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isDmThinking, setIsDmThinking] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, isDmThinking]);

  const handleSaveCharacter = (sheet: CharacterSheet) => {
    setCharacter(sheet);
    localStorage.setItem("irl_character_sheet", JSON.stringify(sheet));
  };

  const generateMarkdownString = (): string => {
    if (!character) return "";
    const modOf = (v: number) => {
      const m = Math.floor((v - 10) / 2);
      return m >= 0 ? `+${m}` : `${m}`;
    };
    return `# IRL Character Sheet: ${character.name}
## Profile Information
- **Race Blueprint**: ${character.race || "Twink"}
- **Archetype**: ${character.role}
- **Current Level**: Level ${character.level}
- **Faction**: ${character.faction}

## Real-World Stats
| Stat | Score | Modifier | Utility |
| :--- | :---: | :---: | :--- |
| **STR** | ${character.stats.strength} | ${modOf(character.stats.strength)} | Heavy loads, stubborn jars |
| **DEX** | ${character.stats.dexterity} | ${modOf(character.stats.dexterity)} | Reaction times, setups |
| **CON** | ${character.stats.constitution} | ${modOf(character.stats.constitution)} | Late-night marathons |
| **INT** | ${character.stats.intelligence} | ${modOf(character.stats.intelligence)} | Rules comprehension |
| **WIS** | ${character.stats.wisdom} | ${modOf(character.stats.wisdom)} | Room perception, tilt checks |
| **CHA** | ${character.stats.charisma} | ${modOf(character.stats.charisma)} | Takeout negotiations |

## Perks
${character.perks.map(p => `- **${p.title}**: ${p.effect} ("${p.description}")`).join("\n")}`;
  };

  const handleRollDice = (statName: keyof StatBlock) => {
    if (isRolling || !character) return;
    setIsRolling(true);
    setRollResult(null);

    const updatedXP = character.xp + 15;
    let nextL = character.level;
    if (updatedXP >= 100) nextL += 1;

    const newSheet = { ...character, xp: updatedXP % 100, level: nextL };
    setCharacter(newSheet);
    localStorage.setItem("irl_character_sheet", JSON.stringify(newSheet));

    setTimeout(() => {
      const d20 = Math.floor(Math.random() * 20) + 1;
      const val = character.stats[statName];
      const mod = Math.floor((val - 10) / 2);
      const total = d20 + mod;
      
      let bracket = "success";
      let msg = `Successfully checked ${statName}! (+15 XP)`;
      if (d20 === 20) { bracket = "crit-success"; msg = `NATURAL 20! Absolute legendary execution! (+15 XP)`; }
      else if (d20 === 1) { bracket = "crit-fail"; msg = `CRITICAL FAILURE! Clumsiness strikes. (+15 XP)`; }
      else if (total < 12) { bracket = "fail"; msg = `Check failed. You learn through failure. (+15 XP)`; }

      setRollResult({ statName: STAT_DESCRIPTIONS[statName].label, natural: d20, modifier: mod, total, bracket, message: msg });
      setIsRolling(false);
    }, 600);
  };

  const handleSendMessage = async (e: any) => {
    e.preventDefault();
    if (!chatInput.trim() || isDmThinking || !character) return;

    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { id: Math.random().toString(), sender: "user", text: msg, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setIsDmThinking(true);

    try {
      const response = await fetch("/api/dm-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character, message: msg, history: chatMessages.slice(-4) })
      });
      const resData = await response.json();
      setChatMessages(prev => [...prev, { id: Math.random().toString(), sender: "dm", text: resData.text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch {
      setIsDmThinking(false);
    } finally {
      setIsDmThinking(false);
    }
  };

  const getAvatarEmoji = (k: string) => {
    if (k === "coder") return "💻"; if (k === "coffee") return "☕"; if (k === "rogue") return "🥷"; if (k === "wiz-boy") return "🧙‍♂️";
    if (k === "knight") return "🛡️"; if (k === "goblin") return "👺"; if (k === "intellect") return "🧠"; return "🦁";
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] antialiased">
      <div className="h-1 w-full bg-gradient-to-r from-amber-600 to-yellow-500" />
      
      {!character ? (
        <Wizard onComplete={handleSaveCharacter} />
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
          {/* Header Dashboard Grid */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-zinc-900/60 p-5 rounded-2xl border border-zinc-850">
            <div className="flex items-center gap-4">
              <div className="text-4xl p-3 bg-amber-500/10 rounded-xl relative">
                {getAvatarEmoji(character.avatar)}
                <span className="absolute -bottom-1.5 -right-1 bg-amber-500 text-black text-[10px] font-mono px-1.5 rounded-full font-bold">Lvl {character.level}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-display font-bold text-white">{character.name}</h1>
                  <span className="text-[11px] bg-amber-500/10 text-amber-400 font-mono px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                    {character.race} • {character.role}  {/* 🌟 Injected Race Blueprint readout */}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 font-mono mt-1">Guild: {character.faction} • XP: {character.xp}/100</div>
              </div>
            </div>
            <button onClick={() => { setCharacter(null); localStorage.removeItem("irl_character_sheet"); }} className="text-xs text-zinc-500 hover:text-red-400 bg-zinc-950 px-3 py-1.5 rounded border border-zinc-850 cursor-pointer">Re-roll Sheet</button>
          </div>

          {/* Navigation Bar Header */}
          <div className="flex border-b border-zinc-850 gap-4 mb-6">
            <button onClick={() => setActiveTab("sheet")} className={`pb-3 text-sm font-semibold cursor-pointer ${activeTab === "sheet" ? "text-amber-500 border-b-2 border-amber-500" : "text-zinc-400"}`}>Attributes Grid</button>
            <button onClick={() => setActiveTab("dm")} className={`pb-3 text-sm font-semibold cursor-pointer ${activeTab === "dm" ? "text-amber-500 border-b-2 border-amber-500" : "text-zinc-400"}`}>AI DM Advice</button>
            <button onClick={() => setActiveTab("markdown")} className={`pb-3 text-sm font-semibold cursor-pointer ${activeTab === "markdown" ? "text-amber-500 border-b-2 border-amber-500" : "text-zinc-400"}`}>Markdown Export</button>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 flex flex-col gap-6">
              {activeTab === "sheet" && (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(STAT_DESCRIPTIONS).map(([key, desc]) => {
                    const k = key as keyof StatBlock; const value = character.stats[k]; const mod = Math.floor((value - 10) / 2);
                    return (
                      <div key={k} onClick={() => handleRollDice(k)} className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-850 hover:border-amber-500 transition-all text-left cursor-pointer select-none">
                        <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">{k.substring(0,3)}</span><span className="font-mono text-xs font-bold text-green-400">{mod >= 0 ? `+${mod}` : mod}</span></div>
                        <h4 className="font-display font-bold text-white text-base">{value}</h4>
                        <span className="text-xs text-zinc-400 font-medium block mb-1">{desc.label}</span>
                        <p className="text-[10px] text-zinc-500 leading-normal line-clamp-2">{desc.utility}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === "dm" && (
                <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl flex flex-col h-[400px] overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map(m => (
                      <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-md p-3 rounded-xl text-xs ${m.sender === "user" ? "bg-amber-500 text-black font-semibold" : "bg-zinc-900 text-zinc-300 border border-zinc-800"}`}><p className="whitespace-pre-wrap">{m.text}</p></div>
                      </div>
                    ))}
                    {isDmThinking && <div className="text-xs text-zinc-500 animate-pulse">The DM is flipping through manual logs...</div>}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="p-3 bg-zinc-900 border-t border-zinc-850 flex gap-2">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="My roommate is tilted about dishes, help!" className="flex-1 bg-zinc-950 border border-zinc-800 p-2 rounded text-xs text-zinc-200 focus:outline-none" />
                    <button type="submit" className="px-4 bg-amber-500 text-black font-bold text-xs rounded-lg cursor-pointer">Send</button>
                  </form>
                </div>
              )}

              {activeTab === "markdown" && (
                <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 font-mono text-xs text-zinc-300 max-h-[350px] overflow-y-auto">
                  <div className="flex justify-end mb-2">
                    <button onClick={() => { navigator.clipboard.writeText(generateMarkdownString()); setCopyStatus(true); setTimeout(() => setCopyStatus(false), 2000); }} className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20">{copyStatus ? "Copied!" : "Copy Clipboard"}</button>
                  </div>
                  <pre className="whitespace-pre-wrap text-left">{generateMarkdownString()}</pre>
                </div>
              )}
            </div>

            {/* Dice Tray Container Display */}
            <div className="lg:col-span-4 bg-zinc-900/60 border border-zinc-850 p-4 rounded-2xl h-fit">
              <h4 className="font-display font-bold text-sm text-white mb-3">IRL Dice Tray</h4>
              {rollResult ? (
                <div className="text-center p-3 bg-zinc-950 rounded-xl border border-zinc-850">
                  <span className="text-[10px] uppercase font-mono text-zinc-500">Result: {rollResult.statName}</span>
                  <div className="text-3xl font-mono font-black text-amber-400 my-1">{rollResult.total}</div>
                  <div className="text-[10px] text-zinc-400 font-mono mb-2">({rollResult.natural} on d20) + ({rollResult.modifier} Mod)</div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed italic">"{rollResult.message}"</p>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic text-center p-4">Initiate checks by tapping any stat box module!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}