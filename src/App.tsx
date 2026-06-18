import { useState, useRef, useEffect } from "react";
import { 
  Dice5, MessageSquareText, Shield, Award, Terminal, Copy, Check, LogOut, Send, Plus, Users, LayoutGrid, Trash2
} from "lucide-react";
import { CharacterSheet, StatBlock, Perk, STAT_DESCRIPTIONS, ChatMessage, DEFAULT_ARCHETYPES, DEFAULT_RACES } from "./types";
import Wizard from "./components/Wizard";

export default function App() {
  // 🌟 State 1: Multiple character tracking structure
  const [characters, setCharacters] = useState<CharacterSheet[]>(() => {
    const saved = localStorage.getItem("irl_characters_list");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    const legacySingle = localStorage.getItem("irl_character_sheet");
    if (legacySingle) {
      try { return [JSON.parse(legacySingle)]; } catch (e) { return []; }
    }
    return [];
  });

  const [activeCharacterIndex, setActiveCharacterIndex] = useState<number>(() => {
    const saved = localStorage.getItem("irl_active_char_idx");
    if (saved) {
      const parsed = parseInt(saved);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  });

  const [isAddingNewCharacter, setIsAddingNewCharacter] = useState<boolean>(false);

  // 🌟 State 2: Dynamic editable classes & races beyond character sheet parameters
  const [customArchetypes, setCustomArchetypes] = useState<any[]>(() => {
    const saved = localStorage.getItem("irl_custom_classes");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_ARCHETYPES; }
    }
    return DEFAULT_ARCHETYPES;
  });

  const [customRaces, setCustomRaces] = useState<any[]>(() => {
    const saved = localStorage.getItem("irl_custom_races");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_RACES; }
    }
    return DEFAULT_RACES;
  });

  const [activeTab, setActiveTab] = useState<"sheet" | "dm" | "markdown">("sheet");
  const [devTab, setDevTab] = useState<"sheet-override" | "class-forge" | "race-forge">("sheet-override");
  const [copyStatus, setCopyStatus] = useState<boolean>(false);
  const [devMode, setDevMode] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  
  // Custom Forge state forms
  const [forgeClassName, setForgeClassName] = useState("");
  const [forgeClassTagline, setForgeClassTagline] = useState("");
  const [forgeClassDesc, setForgeClassDesc] = useState("");
  const [forgeClassHigh, setForgeClassHigh] = useState<keyof StatBlock>("intelligence");
  const [forgeClassLow, setForgeClassLow] = useState<keyof StatBlock>("charisma");

  const [forgeRaceName, setForgeRaceName] = useState("");
  const [forgeRaceTagline, setForgeRaceTagline] = useState("");
  const [forgeRaceDesc, setForgeRaceDesc] = useState("");
  const [forgeRaceIcon, setForgeRaceIcon] = useState("✨");
  const [forgeRaceBonusStat, setForgeRaceBonusStat] = useState<keyof StatBlock>("charisma");
  const [forgeRaceBonusAmount, setForgeRaceBonusAmount] = useState(2);

  // Manual perk additions
  const [newPerkTitle, setNewPerkTitle] = useState("");
  const [newPerkEffect, setNewPerkEffect] = useState("");
  const [newPerkDescription, setNewPerkDescription] = useState("");
  const [newPerkTrigger, setNewPerkTrigger] = useState("");

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

  // Active sheet computed helper
  const character = characters[activeCharacterIndex] || null;

  const handleSaveCharacter = (sheet: CharacterSheet) => {
    let nextList = [...characters];
    if (isAddingNewCharacter) {
      nextList.push(sheet);
      setIsAddingNewCharacter(false);
      setActiveCharacterIndex(nextList.length - 1);
      localStorage.setItem("irl_active_char_idx", (nextList.length - 1).toString());
    } else {
      nextList[activeCharacterIndex] = sheet;
    }
    setCharacters(nextList);
    localStorage.setItem("irl_characters_list", JSON.stringify(nextList));
  };

  const handleUpdateDirectSheet = (updatedSheet: CharacterSheet) => {
    const nextList = [...characters];
    nextList[activeCharacterIndex] = updatedSheet;
    setCharacters(nextList);
    localStorage.setItem("irl_characters_list", JSON.stringify(nextList));
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

    const updatedSheet = { ...character, xp: updatedXP % 100, level: nextL };
    handleSaveCharacter(updatedSheet);

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

  // Add Dynamic Class Core function
  const handleCreateCustomClass = () => {
    if (!forgeClassName) return;
    const item = {
      id: "custom-" + Date.now(),
      name: forgeClassName,
      tagline: forgeClassTagline || "A completely unique role layout.",
      description: forgeClassDesc || "No dynamic overview provided.",
      highest: forgeClassHigh,
      lowest: forgeClassLow,
      icon: "Sparkles"
    };
    const next = [...customArchetypes, item];
    setCustomArchetypes(next);
    localStorage.setItem("irl_custom_classes", JSON.stringify(next));
    setForgeClassName(""); setForgeClassTagline(""); setForgeClassDesc("");
  };

  // Add Dynamic Race function
  const handleCreateCustomRace = () => {
    if (!forgeRaceName) return;
    const item = {
      id: "custom-race-" + Date.now(),
      name: forgeRaceName,
      tagline: forgeRaceTagline || "A new identity lineage.",
      description: forgeRaceDesc || "Custom attributes apply.",
      icon: forgeRaceIcon || "✨",
      bonuses: { [forgeRaceBonusStat]: forgeRaceBonusAmount }
    };
    const next = [...customRaces, item];
    setCustomRaces(next);
    localStorage.setItem("irl_custom_races", JSON.stringify(next));
    setForgeRaceName(""); setForgeRaceTagline(""); setForgeRaceDesc("");
  };

  const getAvatarEmoji = (k: string) => {
    if (k === "coder") return "💻"; if (k === "coffee") return "☕"; if (k === "rogue") return "🥷"; if (k === "wiz-boy") return "🧙‍♂️";
    if (k === "knight") return "🛡️"; if (k === "goblin") return "👺"; if (k === "intellect") return "🧠"; return "🦁";
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] antialiased">
      <div className="h-1 w-full bg-gradient-to-r from-amber-600 to-yellow-500" />
      
      {(characters.length === 0 || isAddingNewCharacter) ? (
        <Wizard 
          onComplete={handleSaveCharacter} 
          availableArchetypes={customArchetypes}
          availableRaces={customRaces}
          showCancelButton={characters.length > 0}
          onCancel={() => setIsAddingNewCharacter(false)}
        />
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
          
          {/* 🌟 Profile Manager Top Row */}
          <div className="flex flex-wrap items-center gap-2 mb-4 bg-zinc-950 p-3 rounded-xl border border-zinc-850">
            <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-zinc-400" /> Active Guild Members:
            </span>
            {characters.map((c, index) => (
              <button
                key={c.id || index}
                onClick={() => {
                  setActiveCharacterIndex(index);
                  localStorage.setItem("irl_active_char_idx", index.toString());
                }}
                className={`text-xs px-3 py-1 rounded-md font-medium border transition-all cursor-pointer ${
                  activeCharacterIndex === index 
                    ? "bg-amber-500 text-zinc-950 border-amber-400 font-bold" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {getAvatarEmoji(c.avatar)} {c.name} (Lvl {c.level})
              </button>
            ))}
            <button
              onClick={() => setIsAddingNewCharacter(true)}
              className="text-xs bg-zinc-900 border border-dashed border-zinc-700 hover:border-amber-400 text-amber-400 px-3 py-1 rounded-md flex items-center gap-1 transition-all ml-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Join Party Profile
            </button>
          </div>

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
                    {character.race} • {character.role}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 font-mono mt-1">Guild: {character.faction} • XP: {character.xp}/100</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button 
                onClick={() => setDevMode(!devMode)}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                  devMode ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-md font-extrabold" : "bg-zinc-950 border-zinc-850 text-zinc-400"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" /> DM System Workshop: {devMode ? "ON" : "OFF"}
              </button>

              <button 
                onClick={() => {
                  const remaining = characters.filter((_, i) => i !== activeCharacterIndex);
                  if (remaining.length === 0) {
                    localStorage.clear();
                    setCharacters([]);
                  } else {
                    setCharacters(remaining);
                    localStorage.setItem("irl_characters_list", JSON.stringify(remaining));
                    setActiveCharacterIndex(0);
                  }
                }} 
                className="text-xs text-zinc-500 hover:text-red-400 bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-850 cursor-pointer"
              >
                Banish Profile
              </button>
            </div>
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
                <div className="flex flex-col gap-6">
                  
                  {/* 🛠️ Expanded Dev Mode Overrides Panel */}
                  {devMode && (
                    <div className="bg-amber-950/15 border border-dashed border-amber-500/40 p-5 rounded-2xl flex flex-col gap-4">
                      <div className="flex border-b border-zinc-800 gap-3 pb-2">
                        <button onClick={() => setDevTab("sheet-override")} className={`text-xs font-mono pb-1 ${devTab === "sheet-override" ? "text-amber-400 font-bold border-b border-amber-400" : "text-zinc-500"}`}>Active Override</button>
                        <button onClick={() => setDevTab("class-forge")} className={`text-xs font-mono pb-1 ${devTab === "class-forge" ? "text-amber-400 font-bold border-b border-amber-400" : "text-zinc-500"}`}>Class Creator</button>
                        <button onClick={() => setDevTab("race-forge")} className={`text-xs font-mono pb-1 ${devTab === "race-forge" ? "text-amber-400 font-bold border-b border-amber-400" : "text-zinc-500"}`}>Race Creator</button>
                      </div>

                      {devTab === "sheet-override" && (
                        <div className="grid sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-zinc-400 mb-1">Rename Sheet</label>
                            <input type="text" value={character.name} onChange={(e) => handleUpdateDirectSheet({ ...character, name: e.target.value })} className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded text-white" />
                          </div>
                          <div>
                            <label className="block text-zinc-400 mb-1">Modify Faction</label>
                            <input type="text" value={character.faction} onChange={(e) => handleUpdateDirectSheet({ ...character, faction: e.target.value })} className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded text-white" />
                          </div>
                        </div>
                      )}

                      {/* 🌟 Dynamic Class Management Module */}
                      {devTab === "class-forge" && (
                        <div className="flex flex-col gap-3">
                          <div className="grid sm:grid-cols-3 gap-2">
                            <input type="text" placeholder="Archetype Title" value={forgeClassName} onChange={(e) => setForgeClassName(e.target.value)} className="bg-zinc-950 text-xs text-white border border-zinc-850 p-2 rounded" />
                            <input type="text" placeholder="Catchy Tagline" value={forgeClassTagline} onChange={(e) => setForgeClassTagline(e.target.value)} className="bg-zinc-950 text-xs text-white border border-zinc-850 p-2 rounded" />
                            <button onClick={handleCreateCustomClass} className="bg-amber-500 text-zinc-950 text-xs font-bold font-mono p-2 rounded cursor-pointer">+ Inject New Role</button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {customArchetypes.map(a => (
                              <span key={a.id} className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-1 rounded flex items-center gap-1">
                                {a.name}
                                {a.id.startsWith("custom") && (
                                  <Trash2 onClick={() => {
                                    const next = customArchetypes.filter(item => item.id !== a.id);
                                    setCustomArchetypes(next);
                                    localStorage.setItem("irl_custom_classes", JSON.stringify(next));
                                  }} className="w-3 h-3 text-red-400 cursor-pointer hover:text-red-300" />
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 🌟 Dynamic Queer Race Management Module */}
                      {devTab === "race-forge" && (
                        <div className="flex flex-col gap-3">
                          <div className="grid sm:grid-cols-4 gap-2">
                            <input type="text" placeholder="Race Label" value={forgeRaceName} onChange={(e) => setForgeRaceName(e.target.value)} className="bg-zinc-950 text-xs text-white border border-zinc-850 p-2 rounded" />
                            <input type="text" placeholder="Emoji Icon" value={forgeRaceIcon} onChange={(e) => setForgeRaceIcon(e.target.value)} className="w-16 bg-zinc-950 text-xs text-white border border-zinc-850 p-2 rounded text-center" />
                            <select value={forgeRaceBonusStat} onChange={(e) => setForgeRaceBonusStat(e.target.value as any)} className="bg-zinc-950 text-xs text-zinc-300 border border-zinc-850 p-2 rounded cursor-pointer">
                              {Object.keys(STAT_DESCRIPTIONS).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button onClick={handleCreateCustomRace} className="bg-amber-500 text-zinc-950 text-xs font-bold font-mono p-2 rounded cursor-pointer">+ Inject Race</button>
                          </div>
                          <input type="text" placeholder="Racial Description" value={forgeRaceDesc} onChange={(e) => setForgeRaceDesc(e.target.value)} className="w-full bg-zinc-950 text-xs text-white border border-zinc-850 p-2 rounded" />
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {customRaces.map(r => (
                              <span key={r.id} className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-1 rounded flex items-center gap-1">
                                {r.icon} {r.name}
                                {r.id.startsWith("custom") && (
                                  <Trash2 onClick={() => {
                                    const next = customRaces.filter(item => item.id !== r.id);
                                    setCustomRaces(next);
                                    localStorage.setItem("irl_custom_races", JSON.stringify(next));
                                  }} className="w-3 h-3 text-red-400 cursor-pointer hover:text-red-300" />
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(STAT_DESCRIPTIONS).map(([key, desc]) => {
                      const k = key as keyof StatBlock; const value = character.stats[k]; const mod = Math.floor((value - 10) / 2);
                      return (
                        <div key={k} onClick={() => { if (!devMode) handleRollDice(k); }} className={`p-4 bg-zinc-900/40 rounded-xl border text-left select-none relative group ${devMode ? "border-amber-500/20" : "border-zinc-850 hover:border-amber-500 transition-all cursor-pointer"}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">{k.substring(0,3)}</span>
                            <span className="font-mono text-xs font-bold text-green-400">{mod >= 0 ? `+${mod}` : mod}</span>
                          </div>
                          <h4 className="font-display font-bold text-white text-base">{value}</h4>
                          <span className="text-xs text-zinc-400 font-medium block mb-1">{desc.label}</span>
                          <p className="text-[10px] text-zinc-500 leading-normal line-clamp-2">{desc.utility}</p>
                          
                          {/* 🌟 Dynamic incremental modifiers in dev panels */}
                          {devMode && (
                            <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-zinc-800" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => { const nextStats = { ...character.stats, [k]: Math.max(1, value - 1) }; handleUpdateDirectSheet({ ...character, stats: nextStats }); }} className="px-2 py-0.5 bg-zinc-800 text-white rounded text-xs font-mono font-bold hover:bg-zinc-700 cursor-pointer">-</button>
                              <span className="text-[8px] font-mono font-bold text-amber-500 tracking-wider">TWEAK</span>
                              <button onClick={() => { const nextStats = { ...character.stats, [k]: Math.min(30, value + 1) }; handleUpdateDirectSheet({ ...character, stats: nextStats }); }} className="px-2 py-0.5 bg-zinc-800 text-white rounded text-xs font-mono font-bold hover:bg-zinc-700 cursor-pointer">+</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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