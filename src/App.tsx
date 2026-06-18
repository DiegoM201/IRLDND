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
  const [archetypes, setArchetypes] = useState<any[]>(() => {
    const saved = localStorage.getItem("irl_archetypes_list");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_ARCHETYPES; }
    }
    return DEFAULT_ARCHETYPES;
  });

  const [races, setRaces] = useState<any[]>(() => {
    const saved = localStorage.getItem("irl_races_list");
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
  const [forgeClassColor, setForgeClassColor] = useState("#fbbf24");

  const [forgeRaceName, setForgeRaceName] = useState("");
  const [forgeRaceTagline, setForgeRaceTagline] = useState("");
  const [forgeRaceDesc, setForgeRaceDesc] = useState("");
  const [forgeRaceIcon, setForgeRaceIcon] = useState("✨");
  const [forgeRaceBonusStat, setForgeRaceBonusStat] = useState<keyof StatBlock>("charisma");
  const [forgeRaceBonusAmount, setForgeRaceBonusAmount] = useState(2);

  // Editing state trackers for Forge
  const [editingArchetypeId, setEditingArchetypeId] = useState<string | null>(null);
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);

  // Manual perk additions
  const [perkTitle, setPerkTitle] = useState("");
  const [perkEffect, setPerkEffect] = useState("");
  const [perkDescription, setPerkDescription] = useState("");
  const [perkTrigger, setPerkTrigger] = useState("Passive");
  const [activeEditingPerkIndex, setActiveEditingPerkIndex] = useState<number | null>(null);

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
  const classColor = character?.accentColor || archetypes.find(a => a.name === character?.role || a.id === character?.role)?.color || "#fbbf24";

  const getAvatarEmoji = (k: string) => {
    const mapping: Record<string, string> = {
      king: "👑", nails: "💅", shades: "🕶️", lips: "💋", devil: "😈",
      unicorn: "🦄", lightning: "⚡", gem: "💎", peach: "🍑", fire: "🔥",
      rainbow: "🌈", cowboy: "🤠", "wiz-boy": "🧙‍♂️", knight: "🛡️", rogue: "🥷",
      wild: "🦁", goblin: "👺", intellect: "🧠", coder: "💻", coffee: "☕"
    };
    return mapping[k] || "✨";
  };

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

  // 🌟 Unified Archetype (Class) CRUD Handlers
  const handleSaveArchetype = () => {
    if (!forgeClassName.trim()) return;
    
    let nextList;
    if (editingArchetypeId) {
      // Update
      nextList = archetypes.map(a => {
        if (a.id === editingArchetypeId) {
          return {
            ...a,
            name: forgeClassName.trim(),
            tagline: forgeClassTagline.trim() || "A completely unique role layout.",
            description: forgeClassDesc.trim() || "No dynamic overview provided.",
            highest: forgeClassHigh,
            lowest: forgeClassLow,
            color: forgeClassColor
          };
        }
        return a;
      });
      setEditingArchetypeId(null);
    } else {
      // Create
      const newItem = {
        id: "class-" + Date.now(),
        name: forgeClassName.trim(),
        tagline: forgeClassTagline.trim() || "A completely unique role layout.",
        description: forgeClassDesc.trim() || "No dynamic overview provided.",
        highest: forgeClassHigh,
        lowest: forgeClassLow,
        icon: "Sparkles",
        color: forgeClassColor
      };
      nextList = [...archetypes, newItem];
    }
    
    setArchetypes(nextList);
    localStorage.setItem("irl_archetypes_list", JSON.stringify(nextList));
    
    // Clear form
    setForgeClassName("");
    setForgeClassTagline("");
    setForgeClassDesc("");
    setForgeClassHigh("intelligence");
    setForgeClassLow("charisma");
    setForgeClassColor("#fbbf24");
  };

  const handleDeleteArchetype = (id: string) => {
    const next = archetypes.filter(a => a.id !== id);
    setArchetypes(next);
    localStorage.setItem("irl_archetypes_list", JSON.stringify(next));
    if (editingArchetypeId === id) {
      setEditingArchetypeId(null);
      setForgeClassName("");
      setForgeClassTagline("");
      setForgeClassDesc("");
    }
  };

  const handleEditArchetype = (a: any) => {
    setEditingArchetypeId(a.id);
    setForgeClassName(a.name);
    setForgeClassTagline(a.tagline || "");
    setForgeClassDesc(a.description || "");
    setForgeClassHigh(a.highest || "intelligence");
    setForgeClassLow(a.lowest || "charisma");
    setForgeClassColor(a.color || "#fbbf24");
  };

  // 🌟 Unified Race CRUD Handlers
  const handleSaveRace = () => {
    if (!forgeRaceName.trim()) return;

    let nextList;
    if (editingRaceId) {
      // Update
      nextList = races.map(r => {
        if (r.id === editingRaceId) {
          return {
            ...r,
            name: forgeRaceName.trim(),
            tagline: forgeRaceTagline.trim() || "A new identity lineage.",
            description: forgeRaceDesc.trim() || "Custom attributes apply.",
            icon: forgeRaceIcon || "✨",
            bonuses: { [forgeRaceBonusStat]: Number(forgeRaceBonusAmount) }
          };
        }
        return r;
      });
      setEditingRaceId(null);
    } else {
      // Create
      const newItem = {
        id: "race-" + Date.now(),
        name: forgeRaceName.trim(),
        tagline: forgeRaceTagline.trim() || "A new identity lineage.",
        description: forgeRaceDesc.trim() || "Custom attributes apply.",
        icon: forgeRaceIcon || "✨",
        bonuses: { [forgeRaceBonusStat]: Number(forgeRaceBonusAmount) }
      };
      nextList = [...races, newItem];
    }

    setRaces(nextList);
    localStorage.setItem("irl_races_list", JSON.stringify(nextList));

    // Clear form
    setForgeRaceName("");
    setForgeRaceTagline("");
    setForgeRaceDesc("");
    setForgeRaceIcon("✨");
    setForgeRaceBonusStat("charisma");
    setForgeRaceBonusAmount(2);
  };

  const handleDeleteRace = (id: string) => {
    const next = races.filter(r => r.id !== id);
    setRaces(next);
    localStorage.setItem("irl_races_list", JSON.stringify(next));
    if (editingRaceId === id) {
      setEditingRaceId(null);
      setForgeRaceName("");
      setForgeRaceTagline("");
      setForgeRaceDesc("");
      setForgeRaceIcon("✨");
    }
  };

  const handleEditRace = (r: any) => {
    setEditingRaceId(r.id);
    setForgeRaceName(r.name);
    setForgeRaceTagline(r.tagline || "");
    setForgeRaceDesc(r.description || "");
    setForgeRaceIcon(r.icon || "✨");
    
    const bonusEntries = Object.entries(r.bonuses || {});
    if (bonusEntries.length > 0) {
      const [bStat, bAmt] = bonusEntries[0];
      setForgeRaceBonusStat(bStat as keyof StatBlock);
      setForgeRaceBonusAmount(bAmt as number);
    } else {
      setForgeRaceBonusStat("charisma");
      setForgeRaceBonusAmount(2);
    }
  };

  // 🌟 Active Character Perk CRUD Handlers
  const handleSavePerk = () => {
    if (!character || !perkTitle.trim() || !perkEffect.trim()) return;

    const newPerk: Perk = {
      title: perkTitle.trim(),
      trigger: perkTrigger.trim() || "Passive",
      effect: perkEffect.trim(),
      description: perkDescription.trim() || "A humorously peculiar character trait."
    };

    let updatedPerks = [...character.perks];
    if (activeEditingPerkIndex !== null) {
      updatedPerks[activeEditingPerkIndex] = newPerk;
      setActiveEditingPerkIndex(null);
    } else {
      updatedPerks.push(newPerk);
    }

    const updatedSheet = { ...character, perks: updatedPerks };
    handleUpdateDirectSheet(updatedSheet);

    // Reset forms
    setPerkTitle("");
    setPerkTrigger("Passive");
    setPerkEffect("");
    setPerkDescription("");
  };

  const handleEditPerkClick = (idx: number) => {
    if (!character) return;
    const p = character.perks[idx];
    setActiveEditingPerkIndex(idx);
    setPerkTitle(p.title);
    setPerkTrigger(p.trigger);
    setPerkEffect(p.effect);
    setPerkDescription(p.description);
  };

  const handleDeletePerkClick = (idx: number) => {
    if (!character) return;
    const updatedPerks = character.perks.filter((_, i) => i !== idx);
    const updatedSheet = { ...character, perks: updatedPerks };
    handleUpdateDirectSheet(updatedSheet);
    if (activeEditingPerkIndex === idx) {
      setActiveEditingPerkIndex(null);
      setPerkTitle("");
      setPerkTrigger("Passive");
      setPerkEffect("");
      setPerkDescription("");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] antialiased">
      <div className="h-1 w-full transition-all duration-300" style={{ backgroundColor: classColor }} />
      
      {(characters.length === 0 || isAddingNewCharacter) ? (
        <Wizard 
          onComplete={handleSaveCharacter} 
          availableArchetypes={archetypes}
          availableRaces={races}
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
            {characters.map((c, index) => {
              const isActive = activeCharacterIndex === index;
              const charClassColor = c.accentColor || archetypes.find(a => a.name === c.role || a.id === c.role)?.color || "#fbbf24";
              return (
                <button
                  key={c.id || index}
                  onClick={() => {
                    setActiveCharacterIndex(index);
                    localStorage.setItem("irl_active_char_idx", index.toString());
                  }}
                  className="text-xs px-3 py-1 rounded-md font-bold border transition-all cursor-pointer"
                  style={{
                    backgroundColor: isActive ? charClassColor : "rgba(24, 24, 27, 0.6)",
                    borderColor: isActive ? charClassColor : "#27272a",
                    color: isActive ? "#09090b" : "#a1a1aa"
                  }}
                >
                  {getAvatarEmoji(c.avatar)} {c.name} (Lvl {c.level})
                </button>
              );
            })}
            <button
              onClick={() => setIsAddingNewCharacter(true)}
              className="text-xs bg-zinc-900 border border-dashed border-zinc-700 hover:text-white px-3 py-1 rounded-md flex items-center gap-1 transition-all ml-auto cursor-pointer"
              style={{ color: classColor, borderColor: `${classColor}40` }}
            >
              <Plus className="w-3.5 h-3.5" /> Join Party Profile
            </button>
          </div>

          {/* Header Dashboard Grid */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-zinc-900/60 p-5 rounded-2xl border border-zinc-850">
            <div className="flex items-center gap-4">
              <div 
                className="text-4xl p-3 rounded-xl border relative"
                style={{ backgroundColor: `${classColor}15`, borderColor: `${classColor}35` }}
              >
                {getAvatarEmoji(character.avatar)}
                <span 
                  className="absolute -bottom-1.5 -right-1 text-black text-[10px] font-mono px-1.5 rounded-full font-bold"
                  style={{ backgroundColor: classColor }}
                >
                  Lvl {character.level}
                </span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-display font-extrabold text-white">{character.name}</h1>
                  <span 
                    className="text-[11.5px] font-mono px-2 py-0.5 rounded border font-extrabold"
                    style={{ backgroundColor: `${classColor}15`, color: classColor, borderColor: `${classColor}40` }}
                  >
                    {character.race} • {character.role}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="text-xs text-zinc-400 font-mono">Guild: {character.faction}</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-500" style={{ width: `${character.xp}%`, backgroundColor: classColor }} />
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono font-bold">{character.xp}/100 XP</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button 
                onClick={() => setDevMode(!devMode)}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all cursor-pointer font-extrabold font-mono"
                style={devMode ? {
                  backgroundColor: `${classColor}15`,
                  borderColor: classColor,
                  color: classColor
                } : {
                  backgroundColor: "#09090b",
                  borderColor: "#27272a",
                  color: "#a1a1aa"
                }}
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
            <button 
              onClick={() => setActiveTab("sheet")} 
              className={`pb-3 text-sm font-semibold cursor-pointer transition-all ${activeTab === "sheet" ? "border-b-2" : "text-zinc-400 hover:text-zinc-200"}`}
              style={{ color: activeTab === "sheet" ? classColor : undefined, borderBottomColor: activeTab === "sheet" ? classColor : "transparent" }}
            >
              Attributes Grid
            </button>
            <button 
              onClick={() => setActiveTab("dm")} 
              className={`pb-3 text-sm font-semibold cursor-pointer transition-all ${activeTab === "dm" ? "border-b-2" : "text-zinc-400 hover:text-zinc-200"}`}
              style={{ color: activeTab === "dm" ? classColor : undefined, borderBottomColor: activeTab === "dm" ? classColor : "transparent" }}
            >
              AI DM Advice
            </button>
            <button 
              onClick={() => setActiveTab("markdown")} 
              className={`pb-3 text-sm font-semibold cursor-pointer transition-all ${activeTab === "markdown" ? "border-b-2" : "text-zinc-400 hover:text-zinc-200"}`}
              style={{ color: activeTab === "markdown" ? classColor : undefined, borderBottomColor: activeTab === "markdown" ? classColor : "transparent" }}
            >
              Markdown Export
            </button>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 flex flex-col gap-6">
              {activeTab === "sheet" && (
                <div className="flex flex-col gap-6">
                  
                  {/* 🛠️ Expanded Dev Mode Overrides Panel */}
                  {devMode && (
                    <div className="bg-amber-950/15 border border-dashed border-amber-500/40 p-5 rounded-2xl flex flex-col gap-4 text-left">
                      <div className="flex border-b border-zinc-850 gap-3 pb-2">
                        <button onClick={() => setDevTab("sheet-override")} className={`text-xs font-mono pb-1 cursor-pointer ${devTab === "sheet-override" ? "text-amber-400 font-bold border-b border-amber-400" : "text-zinc-500 hover:text-zinc-300"}`}>Active Override</button>
                        <button onClick={() => setDevTab("class-forge")} className={`text-xs font-mono pb-1 cursor-pointer ${devTab === "class-forge" ? "text-amber-400 font-bold border-b border-amber-400" : "text-zinc-500 hover:text-zinc-300"}`}>Class Creator</button>
                        <button onClick={() => setDevTab("race-forge")} className={`text-xs font-mono pb-1 cursor-pointer ${devTab === "race-forge" ? "text-amber-400 font-bold border-b border-amber-400" : "text-zinc-500 hover:text-zinc-300"}`}>Race Creator</button>
                      </div>

                      {devTab === "sheet-override" && (
                        <div className="grid sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-zinc-400 mb-1 font-mono font-medium">Rename Sheet</label>
                            <input type="text" value={character.name} onChange={(e) => handleUpdateDirectSheet({ ...character, name: e.target.value })} className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-zinc-400 mb-1 font-mono font-medium">Modify Faction</label>
                            <input type="text" value={character.faction} onChange={(e) => handleUpdateDirectSheet({ ...character, faction: e.target.value })} className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none" />
                          </div>
                        </div>
                      )}

                      {/* 🌟 Dynamic Class Management Module with full CRUD */}
                      {devTab === "class-forge" && (
                        <div className="flex flex-col gap-3">
                          <h4 
                            className="text-[10px] uppercase font-mono font-bold tracking-wider"
                            style={{ color: classColor }}
                          >
                            {editingArchetypeId ? "🔧 EDITING EXISTING ROLE BLUEPRINT" : "✨ CREATE A NEW ROLE BLUEPRINT"}
                          </h4>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-2">
                            <input 
                              type="text" 
                              placeholder="Class Name" 
                              value={forgeClassName} 
                              onChange={(e) => setForgeClassName(e.target.value)} 
                              className="bg-zinc-950 text-xs text-white border border-zinc-850 p-2 rounded focus:outline-none focus:border-amber-500" 
                              style={{ focusBorderColor: classColor }}
                            />
                            <input 
                              type="text" 
                              placeholder="Catchy Tagline" 
                              value={forgeClassTagline} 
                              onChange={(e) => setForgeClassTagline(e.target.value)} 
                              className="bg-zinc-950 text-xs text-white border border-zinc-850 p-2 rounded focus:outline-none focus:border-amber-500" 
                            />
                            
                            <select 
                              value={forgeClassHigh} 
                              onChange={(e) => setForgeClassHigh(e.target.value as any)} 
                              className="bg-zinc-950 text-xs text-zinc-300 border border-zinc-850 p-2 rounded cursor-pointer"
                            >
                              {Object.keys(STAT_DESCRIPTIONS).map(s => <option key={s} value={s}>Highest: {STAT_DESCRIPTIONS[s as keyof StatBlock].label}</option>)}
                            </select>
                            
                            <select 
                              value={forgeClassLow} 
                              onChange={(e) => setForgeClassLow(e.target.value as any)} 
                              className="bg-zinc-950 text-xs text-zinc-300 border border-zinc-850 p-2 rounded cursor-pointer"
                            >
                              {Object.keys(STAT_DESCRIPTIONS).map(s => <option key={s} value={s}>Lowest/Flaw: {STAT_DESCRIPTIONS[s as keyof StatBlock].label}</option>)}
                            </select>

                            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-850 p-2 rounded relative">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase font-black pl-1">Color:</span>
                              <input 
                                type="color" 
                                value={forgeClassColor} 
                                onChange={(e) => setForgeClassColor(e.target.value)} 
                                className="w-8 h-6 bg-transparent border-0 cursor-pointer focus:outline-none shrink-0" 
                                title="Pick archetype theme color"
                              />
                              <span className="text-[10px] font-mono text-zinc-400 overflow-hidden text-ellipsis whitespace-nowrap">{forgeClassColor}</span>
                            </div>

                            <div className="flex gap-1">
                              <button 
                                onClick={handleSaveArchetype} 
                                className="flex-1 text-zinc-950 text-xs font-extrabold font-mono p-2 rounded cursor-pointer"
                                style={{ backgroundColor: classColor }}
                              >
                                {editingArchetypeId ? "Save" : "+ Forge"}
                              </button>
                              {editingArchetypeId && (
                                <button onClick={() => { setEditingArchetypeId(null); setForgeClassName(""); setForgeClassTagline(""); setForgeClassDesc(""); setForgeClassColor("#fbbf24"); }} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold p-2 px-3 rounded cursor-pointer" title="Cancel Edit">✕</button>
                              )}
                            </div>
                          </div>

                          <input 
                            type="text" 
                            placeholder="Brief Role Description / Overview" 
                            value={forgeClassDesc} 
                            onChange={(e) => setForgeClassDesc(e.target.value)} 
                            className="w-full bg-zinc-950 text-xs text-white border border-zinc-850 p-2 rounded focus:outline-none focus:border-amber-500" 
                          />

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {archetypes.map(a => (
                              <div 
                                key={a.id} 
                                className="text-[10px] bg-zinc-900 px-2.5 py-1.5 rounded-lg flex items-center gap-2 border"
                                style={{ borderColor: `${a.color || "#3f3f46"}40` }}
                              >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color || "#3f3f46" }} />
                                <span className="font-extrabold" style={{ color: a.color || "#ffffff" }}>{a.name}</span>
                                <span className="text-zinc-500">({a.highest.substring(0,3).toUpperCase()} / {a.lowest.substring(0,3).toUpperCase()})</span>
                                <button 
                                  onClick={() => handleEditArchetype(a)} 
                                  className="text-amber-400 hover:text-amber-300 text-[10px] font-bold cursor-pointer ml-1"
                                  style={{ color: a.color }}
                                >
                                  Edit
                                </button>
                                <button onClick={() => handleDeleteArchetype(a.id)} className="text-red-400 hover:text-red-300 cursor-pointer" title="Delete role class">✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 🌟 Dynamic Race Management Module with full CRUD */}
                      {devTab === "race-forge" && (
                        <div className="flex flex-col gap-3">
                          <h4 className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-500">
                            {editingRaceId ? "🔧 EDITING EXISTING COMMUNITY BLUEPRINT" : "✨ CREATE A NEW COMMUNITY BLUEPRINT"}
                          </h4>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-2">
                            <input 
                              type="text" 
                              placeholder="Race Label" 
                              value={forgeRaceName} 
                              onChange={(e) => setForgeRaceName(e.target.value)} 
                              className="bg-zinc-950 text-xs text-white border border-zinc-850 p-2 rounded focus:outline-none focus:border-amber-500" 
                            />
                            <input 
                              type="text" 
                              placeholder="Catchy Tagline" 
                              value={forgeRaceTagline} 
                              onChange={(e) => setForgeRaceTagline(e.target.value)} 
                              className="bg-zinc-950 text-xs text-white border border-zinc-850 p-2 rounded focus:outline-none focus:border-amber-500" 
                            />
                            <input 
                              type="text" 
                              placeholder="Emoji Icon (e.g. 🦄)" 
                              value={forgeRaceIcon} 
                              onChange={(e) => setForgeRaceIcon(e.target.value)} 
                              className="bg-zinc-950 text-xs text-white border border-zinc-850 p-2 rounded text-center focus:outline-none focus:border-amber-500" 
                            />
                            
                            <select 
                              value={forgeRaceBonusStat} 
                              onChange={(e) => setForgeRaceBonusStat(e.target.value as any)} 
                              className="bg-zinc-950 text-xs text-zinc-300 border border-zinc-850 p-2 rounded cursor-pointer"
                            >
                              {Object.keys(STAT_DESCRIPTIONS).map(s => <option key={s} value={s}>Bonus: {STAT_DESCRIPTIONS[s as keyof StatBlock].label}</option>)}
                            </select>

                            <input 
                              type="number" 
                              min="1" 
                              max="5" 
                              value={forgeRaceBonusAmount} 
                              onChange={(e) => setForgeRaceBonusAmount(Number(e.target.value))} 
                              className="bg-zinc-950 text-xs text-white border border-zinc-850 p-2 rounded text-center focus:outline-none focus:border-amber-500" 
                              title="Ability score bonus amount"
                            />

                            <div className="flex gap-1 justify-between items-center">
                              <button onClick={handleSaveRace} className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-extrabold font-mono p-2 rounded cursor-pointer">
                                {editingRaceId ? "Save Change" : "+ Forge"}
                              </button>
                              {editingRaceId && (
                                <button onClick={() => { setEditingRaceId(null); setForgeRaceName(""); setForgeRaceTagline(""); setForgeRaceDesc(""); setForgeRaceIcon("✨"); }} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold p-2 px-3 rounded cursor-pointer" title="Cancel Edit">✕</button>
                              )}
                            </div>
                          </div>

                          <input 
                            type="text" 
                            placeholder="Racial Traits Overview" 
                            value={forgeRaceDesc} 
                            onChange={(e) => setForgeRaceDesc(e.target.value)} 
                            className="w-full bg-zinc-950 text-xs text-white border border-zinc-850 p-2 rounded focus:outline-none focus:border-amber-500" 
                          />

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {races.map(r => {
                              const bonusEntries = Object.entries(r.bonuses || {});
                              const bonusStr = bonusEntries.map(([s, v]) => `+${v} ${s.substring(0,3).toUpperCase()}`).join(", ");
                              return (
                                <div key={r.id} className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1.5 rounded-lg flex items-center gap-2">
                                  <span>{r.icon}</span>
                                  <span className="font-semibold">{r.name}</span>
                                  <span className="text-green-400 font-mono">({bonusStr})</span>
                                  <button onClick={() => handleEditRace(r)} className="text-amber-400 hover:text-amber-300 text-[10px] font-bold cursor-pointer ml-1">Edit</button>
                                  <button onClick={() => handleDeleteRace(r.id)} className="text-red-400 hover:text-red-300 cursor-pointer" title="Delete community blueprint">✕</button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(STAT_DESCRIPTIONS).map(([key, desc]) => {
                      const k = key as keyof StatBlock; 
                      const value = character.stats[k]; 
                      const mod = Math.floor((value - 10) / 2);
                      
                      // Calculate base score by looking up the selected race's bonuses from our unified state
                      const characterRace = races.find(r => r.name === character.race) || races.find(r => r.name.toLowerCase() === character.race.toLowerCase());
                      const raceBonus = characterRace?.bonuses?.[k] || 0;
                      const baseValue = value - raceBonus;

                      return (
                        <div 
                          key={k} 
                          onClick={() => { if (!devMode) handleRollDice(k); }} 
                          className={`p-4 bg-zinc-900/40 rounded-xl border text-left select-none relative group transition-all ${devMode ? "cursor-default" : "cursor-pointer"}`}
                          style={{
                            borderColor: devMode ? `${classColor}40` : "#27272a"
                          }}
                          onMouseEnter={(e) => {
                            if (!devMode) e.currentTarget.style.borderColor = classColor;
                          }}
                          onMouseLeave={(e) => {
                            if (!devMode) e.currentTarget.style.borderColor = "#27272a";
                          }}
                        >
                          
                          {/* 🔮 Dynamic Hover Tooltip Breakdown Card */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-950 border border-zinc-805 p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-[10px] font-mono flex flex-col gap-1 text-zinc-300">
                            <div className="flex justify-between border-b border-zinc-800 pb-1 mb-1 font-display">
                              <span className="font-bold text-xs" style={{ color: classColor }}>{desc.label}</span>
                              <span className="text-zinc-500 text-[9px]">CALCULATION</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Base Value:</span>
                              <span className="text-white font-bold">{baseValue}</span>
                            </div>
                            {raceBonus > 0 && (
                              <div className="flex justify-between text-zinc-300">
                                <span className="text-zinc-500">Racial Bonus ({character.race}):</span>
                                <span className="font-bold font-mono" style={{ color: classColor }}>+{raceBonus}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-zinc-900 pt-1 mt-1 font-bold">
                              <span className="text-zinc-400">Total Score:</span>
                              <span className="text-white">{value}</span>
                            </div>
                            <div className="flex justify-between border-t border-zinc-900 pt-1 mt-1 font-bold" style={{ color: classColor }}>
                              <span>Modifier:</span>
                              <span>{mod >= 0 ? `+${mod}` : mod}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">{k.substring(0,3)}</span>
                            <span className="font-mono text-xs font-bold" style={{ color: classColor }}>{mod >= 0 ? `+${mod}` : mod}</span>
                          </div>
                          <h4 className="font-display font-extrabold text-white text-base">{value}</h4>
                          <span className="text-xs text-zinc-400 font-medium block mb-1">{desc.label}</span>
                          <p className="text-[10px] text-zinc-500 leading-normal line-clamp-2">{desc.utility}</p>
                          
                          {/* 🌟 Dynamic incremental modifiers in dev panels */}
                          {devMode && (
                            <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-zinc-800" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => { const nextStats = { ...character.stats, [k]: Math.max(1, value - 1) }; handleUpdateDirectSheet({ ...character, stats: nextStats }); }} className="px-2 py-0.5 bg-zinc-950 text-white rounded text-xs font-mono font-bold hover:bg-zinc-800 cursor-pointer border border-zinc-800">-</button>
                              <span className="text-[8px] font-mono font-bold tracking-wider" style={{ color: classColor }}>TWEAK</span>
                              <button onClick={() => { const nextStats = { ...character.stats, [k]: Math.min(30, value + 1) }; handleUpdateDirectSheet({ ...character, stats: nextStats }); }} className="px-2 py-0.5 bg-zinc-950 text-white rounded text-xs font-mono font-bold hover:bg-zinc-800 cursor-pointer border border-zinc-800">+</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 📜 Active Character Scribed Perks Management Section */}
                  <div className="mt-8 text-left border-t border-zinc-850 pt-6">
                    <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                      <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" /> Scribed Character Perks
                      </h3>
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded font-bold">
                        {character.perks.length} Passive Perks Active
                      </span>
                    </div>

                    {character.perks.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic mb-5">No corporate or social perks scribed. Formulate a perk below or use the AI DM Advice builder!</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4 mb-6">
                        {character.perks.map((p, idx) => (
                          <div 
                            key={idx} 
                            className={`p-4 bg-zinc-900/40 border rounded-xl flex justify-between items-start relative overflow-hidden transition-all group/perk ${
                              activeEditingPerkIndex === idx 
                                ? "border-amber-500 shadow-lg shadow-amber-500/5 bg-amber-950/10" 
                                : "border-zinc-850 hover:border-zinc-700"
                            }`}
                          >
                            <div className="flex-1 pr-6 text-left">
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <h4 className="font-display font-extrabold text-amber-400 text-sm">{p.title}</h4>
                                <span className="text-[9px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-850 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                  Trigger: {p.trigger}
                                </span>
                              </div>
                              <p className="text-zinc-200 text-xs font-mono font-semibold mb-1 flex items-center gap-1.5">
                                <span className="text-amber-500 font-bold">★</span> {p.effect}
                              </p>
                              <p className="text-zinc-400 text-xs italic leading-relaxed">"{p.description}"</p>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <button 
                                onClick={() => handleEditPerkClick(idx)}
                                className="text-amber-400 hover:text-amber-300 p-1 bg-zinc-950 border border-zinc-850 rounded hover:scale-105 transition-all text-[10px] font-mono font-bold px-2 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeletePerkClick(idx)}
                                className="text-red-400 hover:text-red-300 p-1.5 bg-zinc-950 border border-zinc-850 rounded hover:scale-105 transition-all cursor-pointer"
                                title="Banish perk"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Perk Writer / Writer Dashboard Form */}
                    <div className="bg-zinc-950/70 border border-zinc-850 rounded-2xl p-5 mt-4">
                      <h4 className="text-xs font-mono text-amber-400 font-black uppercase mb-3 flex items-center justify-between">
                        <span>{activeEditingPerkIndex !== null ? "📝 Edit Scribed Perk" : "✨ Scribe Custom Perk"}</span>
                        {activeEditingPerkIndex !== null && (
                          <button 
                            onClick={() => { setActiveEditingPerkIndex(null); setPerkTitle(""); setPerkTrigger("Passive"); setPerkEffect(""); setPerkDescription(""); }} 
                            className="text-zinc-500 hover:text-white font-bold text-xs uppercase cursor-pointer"
                          >
                            ✕ Cancel Edit
                          </button>
                        )}
                      </h4>

                      <div className="grid sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1 font-bold">Perk Title</label>
                          <input 
                            type="text" 
                            placeholder="e.g., Tactical Procrastinator" 
                            value={perkTitle}
                            onChange={(e) => setPerkTitle(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1 font-bold">Trigger Condition</label>
                          <input 
                            type="text" 
                            placeholder="e.g., Passive, or Ordering takeout" 
                            value={perkTrigger}
                            onChange={(e) => setPerkTrigger(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1 font-bold">Modifier Effect</label>
                          <input 
                            type="text" 
                            placeholder="e.g., Advantage on Wisdom checks under pressure" 
                            value={perkEffect}
                            onChange={(e) => setPerkEffect(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1 font-bold">Flavor Description / Joke</label>
                          <input 
                            type="text" 
                            placeholder="e.g., Under maximum panic, your reflexes and room reading are unmatched." 
                            value={perkDescription}
                            onChange={(e) => setPerkDescription(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={handleSavePerk}
                        disabled={!perkTitle.trim() || !perkEffect.trim()}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 py-2.5 rounded-xl text-xs font-black transition-all uppercase cursor-pointer disabled:opacity-40 disabled:hover:bg-amber-500"
                      >
                        {activeEditingPerkIndex !== null ? "✓ Save and Scribe Perk Changes" : "+ Scribe Perk to Character Sheet"}
                      </button>
                    </div>
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