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

  // 🎲 Polyhedral Dice Bag States
  const [activeDieType, setActiveDieType] = useState<"d4" | "d6" | "d8" | "d10" | "d12" | "d20">("d20");
  const [rollNote, setRollNote] = useState<string>("");
  const [rollHistory, setRollHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem("irl_roll_history");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });
  const [rollingVal, setRollingVal] = useState<number>(20);

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

  const handleRollDice = (statName?: keyof StatBlock) => {
    if (isRolling || !character) return;
    setIsRolling(true);
    setRollResult(null);

    const updatedXP = character.xp + 15;
    let nextL = character.level;
    if (updatedXP >= 100) nextL += 1;

    const updatedSheet = { ...character, xp: updatedXP % 100, level: nextL };
    handleSaveCharacter(updatedSheet);

    const sides = parseInt(activeDieType.substring(1)) || 20;

    // Rapid spinning visual counter
    let spinCount = 0;
    const spinner = setInterval(() => {
      setRollingVal(Math.floor(Math.random() * sides) + 1);
      spinCount++;
      if (spinCount >= 10) {
        clearInterval(spinner);
      }
    }, 50);

    setTimeout(() => {
      const natural = Math.floor(Math.random() * sides) + 1;
      setRollingVal(natural);

      let mod = 0;
      let statLabel = "Pure Check";
      if (statName) {
        const val = character.stats[statName];
        mod = Math.floor((val - 10) / 2);
        statLabel = STAT_DESCRIPTIONS[statName].label;
      }

      const total = natural + mod;
      
      let bracket = "success";
      let msg = statName ? `Successfully checked ${statLabel}! (+15 XP)` : `Rolled ${activeDieType}! (+15 XP)`;
      
      if (natural === sides) { 
        bracket = "crit-success"; 
        msg = `NATURAL CRITICAL! Amazing performance on your ${activeDieType}! (+15 XP)`; 
      } else if (natural === 1) { 
        bracket = "crit-fail"; 
        msg = `CRITICAL FAILURE on ${activeDieType}! Clumsiness got the best of you. (+15 XP)`; 
      } else {
        const threshold = Math.ceil(sides * 0.55);
        if (total < threshold) {
          bracket = "fail"; 
          msg = `Check was sub-optimal, but you learn through struggle. (+15 XP)`; 
        }
      }

      const outcome = { statName: statLabel, natural, modifier: mod, total, bracket, message: msg };
      setRollResult(outcome);

      // Append Roll History
      const newHistoryLog = {
        id: "roll-" + Math.random().toString(36).substring(2, 9),
        diceType: activeDieType,
        natural,
        modifier: mod,
        total,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        note: rollNote.trim() || (statName ? `Checked ${statLabel}` : `Standard Check`),
        associatedStat: statName ? STAT_DESCRIPTIONS[statName].label : undefined
      };

      setRollHistory(prev => {
        const next = [newHistoryLog, ...prev].slice(0, 40);
        localStorage.setItem("irl_roll_history", JSON.stringify(next));
        return next;
      });

      // Clear the roll note for next turn
      setRollNote("");
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
    <div className="min-h-screen bg-brand-beige text-stone-800 antialiased">
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
          <div className="flex flex-wrap items-center gap-2 mb-4 bg-brand-card p-3 rounded-xl border border-[#eaddca] shadow-sm">
            <span className="text-[10px] font-mono uppercase text-amber-900 flex items-center gap-1 font-bold">
              <Users className="w-3.5 h-3.5 text-amber-800" /> Active Guild Members:
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
                  className="text-xs px-3 py-1.5 rounded-md font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:scale-[1.02]"
                  style={{
                    backgroundColor: isActive ? charClassColor : "rgba(250, 246, 238, 0.7)",
                    borderColor: isActive ? charClassColor : "#eaddca",
                    color: isActive ? "#ffffff" : "#4a3c2c"
                  }}
                >
                  {c.avatar === "custom_uploaded" && c.avatarImage ? (
                    <span className="w-5 h-5 rounded-full overflow-hidden inline-block border border-[#eaddca] bg-brand-card">
                      <img 
                        src={c.avatarImage} 
                        alt="" 
                        className="w-full h-full object-cover" 
                        style={{ transform: `translate(${c.avatarConfig?.x || 0}px, ${c.avatarConfig?.y || 0}px) scale(${c.avatarConfig?.scale || 1.2}) rotate(${c.avatarConfig?.rotate || 0}deg)` }} 
                      />
                    </span>
                  ) : (
                    <span>{getAvatarEmoji(c.avatar)}</span>
                  )}
                  <span>{c.name} (Lvl {c.level})</span>
                </button>
              );
            })}
            <button
              onClick={() => setIsAddingNewCharacter(true)}
              className="text-xs bg-brand-card border border-dashed border-[#d2c2ad] hover:bg-[#f9f4e8] px-3 py-1 rounded-md flex items-center gap-1 transition-all ml-auto cursor-pointer font-bold"
              style={{ color: classColor, borderColor: `${classColor}50` }}
            >
              <Plus className="w-3.5 h-3.5" /> Join Party Profile
            </button>
          </div>

          {/* Header Dashboard Grid */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-brand-card p-5 rounded-2xl border border-[#eaddca] shadow-sm">
            <div className="flex items-center gap-4 text-left">
              <div 
                className="p-1 rounded-xl border relative w-16 h-16 flex items-center justify-center bg-brand-beige border-[#eaddca] shadow-inner shrink-0"
                style={{ borderColor: `${classColor}55` }}
              >
                {character.avatar === "custom_uploaded" && character.avatarImage ? (
                  <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center bg-brand-beige">
                    <img 
                      src={character.avatarImage} 
                      alt="" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover pointer-events-none select-none max-w-full max-h-full"
                      style={{ transform: `translate(${character.avatarConfig?.x || 0}px, ${character.avatarConfig?.y || 0}px) scale(${character.avatarConfig?.scale || 1.2}) rotate(${character.avatarConfig?.rotate || 0}deg)` }}
                    />
                  </div>
                ) : (
                  <span className="text-4xl">{getAvatarEmoji(character.avatar)}</span>
                )}
                <span 
                  className="absolute -bottom-1.5 -right-1 text-white text-[10px] font-mono px-1.5 rounded-full font-bold"
                  style={{ backgroundColor: classColor }}
                >
                  Lvl {character.level}
                </span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-display font-black text-stone-900">{character.name}</h1>
                  <span 
                    className="text-[11.5px] font-mono px-2 py-0.5 rounded border font-extrabold"
                    style={{ backgroundColor: `${classColor}15`, color: classColor, borderColor: `${classColor}35` }}
                  >
                    {character.race} • {character.role}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="text-xs text-amber-900 font-mono font-bold">Guild: {character.faction}</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-24 h-1.5 bg-[#eaddca] rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-500" style={{ width: `${character.xp}%`, backgroundColor: classColor }} />
                    </div>
                    <span className="text-[10px] text-amber-950 font-mono font-bold">{character.xp}/100 XP</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button 
                onClick={() => setDevMode(!devMode)}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all cursor-pointer font-extrabold font-mono shadow-sm"
                style={devMode ? {
                  backgroundColor: `${classColor}20`,
                  borderColor: classColor,
                  color: classColor
                } : {
                  backgroundColor: "#fcf8f0",
                  borderColor: "#eaddca",
                  color: "#5c4033"
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
                className="text-xs text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-2 rounded-lg border border-amber-300 font-extrabold transition-all cursor-pointer shadow-sm"
              >
                Banish Profile
              </button>
            </div>
          </div>

          {/* Navigation Bar Header */}
          <div className="flex border-b border-[#eaddca] gap-4 mb-6">
            <button 
               onClick={() => setActiveTab("sheet")} 
               className={`pb-3 text-sm font-extrabold cursor-pointer transition-all ${activeTab === "sheet" ? "border-b-2" : "text-amber-900/60 hover:text-amber-955"}`}
               style={{ color: activeTab === "sheet" ? classColor : undefined, borderBottomColor: activeTab === "sheet" ? classColor : "transparent" }}
            >
              Attributes Grid
            </button>
            <button 
               onClick={() => setActiveTab("dm")} 
               className={`pb-3 text-sm font-extrabold cursor-pointer transition-all ${activeTab === "dm" ? "border-b-2" : "text-amber-900/60 hover:text-amber-955"}`}
               style={{ color: activeTab === "dm" ? classColor : undefined, borderBottomColor: activeTab === "dm" ? classColor : "transparent" }}
            >
              AI DM Advice
            </button>
            <button 
               onClick={() => setActiveTab("markdown")} 
               className={`pb-3 text-sm font-extrabold cursor-pointer transition-all ${activeTab === "markdown" ? "border-b-2" : "text-amber-900/60 hover:text-amber-955"}`}
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
                    <div className="bg-[#f5eeda]/80 border border-dashed border-amber-800/30 p-5 rounded-2xl flex flex-col gap-4 text-left shadow-inner">
                      <div className="flex border-b border-[#eaddca] gap-3 pb-2">
                        <button onClick={() => setDevTab("sheet-override")} className={`text-xs font-mono pb-1 cursor-pointer font-bold ${devTab === "sheet-override" ? "text-amber-950 border-b-2 border-amber-700" : "text-stone-500 hover:text-stone-700"}`}>Active Override</button>
                        <button onClick={() => setDevTab("class-forge")} className={`text-xs font-mono pb-1 cursor-pointer font-bold ${devTab === "class-forge" ? "text-amber-950 border-b-2 border-amber-700" : "text-stone-500 hover:text-stone-700"}`}>Class Creator</button>
                        <button onClick={() => setDevTab("race-forge")} className={`text-xs font-mono pb-1 cursor-pointer font-bold ${devTab === "race-forge" ? "text-amber-950 border-b-2 border-amber-700" : "text-stone-500 hover:text-stone-700"}`}>Race Creator</button>
                      </div>

                      {devTab === "sheet-override" && (
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-left">
                          <div>
                            <label className="block text-amber-950/80 mb-1 font-mono font-bold">Rename Sheet</label>
                            <input type="text" value={character.name} onChange={(e) => handleUpdateDirectSheet({ ...character, name: e.target.value })} className="w-full bg-brand-card border border-[#eaddca] p-2 rounded text-[#2a2015] text-xs focus:outline-none focus:border-amber-600 font-medium font-mono shadow-sm" />
                          </div>
                          <div>
                            <label className="block text-amber-950/80 mb-1 font-mono font-bold">Modify Faction</label>
                            <input type="text" value={character.faction} onChange={(e) => handleUpdateDirectSheet({ ...character, faction: e.target.value })} className="w-full bg-brand-card border border-[#eaddca] p-2 rounded text-[#2a2015] text-xs focus:outline-none focus:border-amber-600 font-medium font-mono shadow-sm" />
                          </div>
                          <div>
                            <label className="block text-amber-950/80 mb-1 font-mono font-bold">Cosmetic Class Color Override</label>
                            <div className="flex gap-2 items-center">
                              <input 
                                type="color" 
                                value={character.accentColor || classColor} 
                                onChange={(e) => handleUpdateDirectSheet({ ...character, accentColor: e.target.value })} 
                                className="w-10 h-8 bg-brand-card border border-[#eaddca] rounded cursor-pointer shrink-0 shadow-sm" 
                              />
                              <input 
                                type="text" 
                                value={character.accentColor || classColor} 
                                onChange={(e) => handleUpdateDirectSheet({ ...character, accentColor: e.target.value })} 
                                className="w-full bg-brand-card border border-[#eaddca] p-2 rounded text-[#2a2015] text-xs font-mono focus:outline-none focus:border-amber-600 shadow-sm font-bold" 
                              />
                            </div>
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
                              className="bg-brand-card text-xs text-[#2a2015] border border-[#eaddca] p-2 rounded focus:outline-none focus:border-amber-600 font-bold shadow-sm" 
                            />
                            <input 
                              type="text" 
                              placeholder="Catchy Tagline" 
                              value={forgeClassTagline} 
                              onChange={(e) => setForgeClassTagline(e.target.value)} 
                              className="bg-brand-card text-xs text-[#2a2015] border border-[#eaddca] p-2 rounded focus:outline-none focus:border-amber-600 shadow-sm" 
                            />
                            
                            <select 
                              value={forgeClassHigh} 
                              onChange={(e) => setForgeClassHigh(e.target.value as any)} 
                              className="bg-brand-card text-xs text-stone-700 border border-[#eaddca] p-2 rounded cursor-pointer shadow-sm font-semibold focus:outline-none focus:border-amber-600"
                            >
                              {Object.keys(STAT_DESCRIPTIONS).map(s => <option key={s} value={s}>Highest: {STAT_DESCRIPTIONS[s as keyof StatBlock].label}</option>)}
                            </select>
                            
                            <select 
                              value={forgeClassLow} 
                              onChange={(e) => setForgeClassLow(e.target.value as any)} 
                              className="bg-brand-card text-xs text-stone-700 border border-[#eaddca] p-2 rounded cursor-pointer shadow-sm font-semibold focus:outline-none focus:border-amber-600"
                            >
                              {Object.keys(STAT_DESCRIPTIONS).map(s => <option key={s} value={s}>Lowest/Flaw: {STAT_DESCRIPTIONS[s as keyof StatBlock].label}</option>)}
                            </select>
Logic
                            <div className="flex items-center gap-1.5 bg-brand-card border border-[#eaddca] p-2 rounded relative shadow-sm">
                              <span className="text-[9px] font-mono text-stone-500 uppercase font-black pl-1">Color:</span>
                              <input 
                                type="color" 
                                value={forgeClassColor} 
                                onChange={(e) => setForgeClassColor(e.target.value)} 
                                className="w-8 h-6 bg-transparent border-0 cursor-pointer focus:outline-none shrink-0" 
                                title="Pick archetype theme color"
                              />
                              <span className="text-[10px] font-mono text-stone-600 font-bold overflow-hidden text-ellipsis whitespace-nowrap">{forgeClassColor}</span>
                            </div>

                            <div className="flex gap-1">
                              <button 
                                onClick={handleSaveArchetype} 
                                className="flex-1 text-white text-xs font-extrabold font-mono p-2 rounded cursor-pointer transition-all active:scale-95 shadow-sm"
                                style={{ backgroundColor: classColor }}
                              >
                                {editingArchetypeId ? "Save" : "+ Forge"}
                              </button>
                              {editingArchetypeId && (
                                <button onClick={() => { setEditingArchetypeId(null); setForgeClassName(""); setForgeClassTagline(""); setForgeClassDesc(""); setForgeClassColor("#fbbf24"); }} className="bg-amber-100/70 hover:bg-amber-200 text-stone-700 text-xs font-black p-2 px-3 rounded cursor-pointer border border-[#eaddca]" title="Cancel Edit">✕</button>
                              )}
                            </div>
                          </div>

                          <input 
                            type="text" 
                            placeholder="Brief Role Description / Overview" 
                            value={forgeClassDesc} 
                            onChange={(e) => setForgeClassDesc(e.target.value)} 
                            className="w-full bg-brand-card text-xs text-[#2a2015] border border-[#eaddca] p-2 rounded focus:outline-none focus:border-amber-600 shadow-sm" 
                          />

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {archetypes.map(a => (
                              <div 
                                key={a.id} 
                                className="text-[10px] bg-brand-card px-2.5 py-1.5 rounded-lg flex items-center gap-2 border border-[#eaddca] shadow-sm"
                                style={{ borderColor: `${a.color || "#eaddca"}80` }}
                              >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color || "#94a3b8" }} />
                                <span className="font-extrabold" style={{ color: a.color || "#475569" }}>{a.name}</span>
                                <span className="text-stone-400 font-bold">({a.highest.substring(0,3).toUpperCase()} / {a.lowest.substring(0,3).toUpperCase()})</span>
                                <button 
                                  onClick={() => handleEditArchetype(a)} 
                                  className="text-amber-700 hover:text-amber-900 text-[10px] font-bold cursor-pointer ml-1"
                                  style={{ color: a.color }}
                                >
                                  Edit
                                </button>
                                <button onClick={() => handleDeleteArchetype(a.id)} className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer" title="Delete role class">✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 🌟 Dynamic Race Management Module with full CRUD */}
                      {devTab === "race-forge" && (
                        <div className="flex flex-col gap-3">
                          <h4 className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-800">
                            {editingRaceId ? "🔧 EDITING EXISTING COMMUNITY BLUEPRINT" : "✨ CREATE A NEW COMMUNITY BLUEPRINT"}
                          </h4>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-2">
                            <input 
                              type="text" 
                              placeholder="Race Label" 
                              value={forgeRaceName} 
                              onChange={(e) => setForgeRaceName(e.target.value)} 
                              className="bg-brand-card text-xs text-[#2a2015] border border-[#eaddca] p-2 rounded focus:outline-none focus:border-amber-600 font-bold shadow-sm" 
                            />
                            <input 
                              type="text" 
                              placeholder="Catchy Tagline" 
                              value={forgeRaceTagline} 
                              onChange={(e) => setForgeRaceTagline(e.target.value)} 
                              className="bg-brand-card text-xs text-[#2a2015] border border-[#eaddca] p-2 rounded focus:outline-none focus:border-amber-600 shadow-sm" 
                            />
                            <input 
                              type="text" 
                              placeholder="Emoji Icon (e.g. 🦄)" 
                              value={forgeRaceIcon} 
                              onChange={(e) => setForgeRaceIcon(e.target.value)} 
                              className="bg-brand-card text-xs text-[#2a2015] border border-[#eaddca] p-2 rounded text-center focus:outline-none focus:border-amber-600 shadow-sm" 
                            />
                            
                            <select 
                              value={forgeRaceBonusStat} 
                              onChange={(e) => setForgeRaceBonusStat(e.target.value as any)} 
                              className="bg-brand-card text-xs text-stone-700 border border-[#eaddca] p-2 rounded cursor-pointer shadow-sm font-semibold focus:outline-none focus:border-amber-600"
                            >
                              {Object.keys(STAT_DESCRIPTIONS).map(s => <option key={s} value={s}>Bonus: {STAT_DESCRIPTIONS[s as keyof StatBlock].label}</option>)}
                            </select>

                            <input 
                              type="number" 
                              min="1" 
                              max="5" 
                              value={forgeRaceBonusAmount} 
                              onChange={(e) => setForgeRaceBonusAmount(Number(e.target.value))} 
                              className="bg-brand-card text-xs text-[#2a2015] border border-[#eaddca] p-2 rounded text-center focus:outline-none focus:border-amber-600 shadow-sm font-bold" 
                              title="Ability score bonus amount"
                            />

                            <div className="flex gap-1 justify-between items-center bg-brand-card shadow-sm">
                              <button onClick={handleSaveRace} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black font-mono p-2 rounded cursor-pointer transition-all active:scale-95 shadow-sm">
                                {editingRaceId ? "Save" : "+ Forge"}
                              </button>
                              {editingRaceId && (
                                <button onClick={() => { setEditingRaceId(null); setForgeRaceName(""); setForgeRaceTagline(""); setForgeRaceDesc(""); setForgeRaceIcon("✨"); }} className="bg-amber-100/75 hover:bg-amber-200 text-stone-700 text-xs font-black p-2 px-3 rounded cursor-pointer border border-[#eaddca]" title="Cancel Edit">✕</button>
                              )}
                            </div>
                          </div>

                          <input 
                            type="text" 
                            placeholder="Racial Traits Overview" 
                            value={forgeRaceDesc} 
                            onChange={(e) => setForgeRaceDesc(e.target.value)} 
                            className="w-full bg-brand-card text-xs text-[#2a2015] border border-[#eaddca] p-2 rounded focus:outline-none focus:border-amber-600 shadow-sm" 
                          />

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {races.map(r => {
                              const bonusEntries = Object.entries(r.bonuses || {});
                              const bonusStr = bonusEntries.map(([s, v]) => `+${v} ${s.substring(0,3).toUpperCase()}`).join(", ");
                              return (
                                <div key={r.id} className="text-[10px] bg-brand-card border border-[#eaddca] text-stone-700 px-2.5 py-1.5 rounded-lg flex items-center gap-2 shadow-sm font-semibold">
                                  <span>{r.icon}</span>
                                  <span className="font-extrabold">{r.name}</span>
                                  <span className="text-emerald-700 font-mono">({bonusStr})</span>
                                  <button onClick={() => handleEditRace(r)} className="text-amber-800 hover:text-amber-950 text-[10px] font-extrabold cursor-pointer ml-1">Edit</button>
                                  <button onClick={() => handleDeleteRace(r.id)} className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer" title="Delete community blueprint">✕</button>
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
                          className={`p-4 bg-brand-card rounded-xl border-2 text-left select-none relative group transition-all shadow-sm h-full flex flex-col justify-between ${devMode ? "cursor-default" : "cursor-pointer hover:shadow-md"}`}
                          style={{
                            borderColor: devMode ? `${classColor}60` : "#eaddca"
                          }}
                          onMouseEnter={(e) => {
                            if (!devMode) e.currentTarget.style.borderColor = classColor;
                          }}
                          onMouseLeave={(e) => {
                            if (!devMode) e.currentTarget.style.borderColor = "#eaddca";
                          }}
                        >
                          
                          {/* 🔮 Dynamic Hover Tooltip Breakdown Card */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#2a2015] border border-[#1b120a] p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-[10px] font-mono flex flex-col gap-1 text-amber-50">
                            <div className="flex justify-between border-b border-[#4e3a24] pb-1 mb-1 font-display">
                              <span className="font-bold text-xs" style={{ color: classColor }}>{desc.label}</span>
                              <span className="text-amber-200/60 text-[9px]">CALCULATION</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-amber-100/80">Base Value:</span>
                              <span className="text-white font-bold">{baseValue}</span>
                            </div>
                            {raceBonus > 0 && (
                              <div className="flex justify-between text-amber-50">
                                <span className="text-amber-100/80 font-bold">Racial Bonus:</span>
                                <span className="font-bold font-mono" style={{ color: classColor }}>+{raceBonus}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-[#4e3a24] pt-1 mt-1 font-bold">
                              <span className="text-amber-100/80 font-bold">Total Score:</span>
                              <span className="text-white">{value}</span>
                            </div>
                            <div className="flex justify-between border-t border-[#4e3a24] pt-1 mt-1 font-bold" style={{ color: classColor }}>
                              <span>Modifier:</span>
                              <span>{mod >= 0 ? `+${mod}` : mod}</span>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[10px] font-mono text-amber-900/60 uppercase font-bold">{k.substring(0,3)}</span>
                              <span className="font-mono text-xs font-black" style={{ color: classColor }}>{mod >= 0 ? `+${mod}` : mod}</span>
                            </div>
                            <h4 className="font-display font-black text-stone-900 text-lg mb-0.5">{value}</h4>
                            <span className="text-xs text-stone-700 font-extrabold block mb-1">{desc.label}</span>
                            <p className="text-[10.5px] text-stone-500 leading-normal line-clamp-2 font-medium">{desc.utility}</p>
                          </div>
                          
                          {/* 🌟 Dynamic incremental modifiers in dev panels */}
                          {devMode && (
                            <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-[#eaddca]" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => { const nextStats = { ...character.stats, [k]: Math.max(1, value - 1) }; handleUpdateDirectSheet({ ...character, stats: nextStats }); }} className="px-2 py-0.5 bg-brand-beige text-stone-750 rounded text-xs font-mono font-bold hover:bg-[#eaddca]/80 cursor-pointer border border-[#eaddca] shadow-sm">-</button>
                              <span className="text-[8px] font-mono font-black tracking-wider" style={{ color: classColor }}>TWEAK</span>
                              <button onClick={() => { const nextStats = { ...character.stats, [k]: Math.min(30, value + 1) }; handleUpdateDirectSheet({ ...character, stats: nextStats }); }} className="px-2 py-0.5 bg-brand-beige text-stone-750 rounded text-xs font-mono font-bold hover:bg-[#eaddca]/80 cursor-pointer border border-[#eaddca] shadow-sm">+</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 📜 Active Character Scribed Perks Management Section */}
                  <div className="mt-8 text-left border-t border-[#eaddca] pt-6">
                    <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                      <h3 className="font-display font-bold text-lg text-stone-900 flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-600" /> Scribed Character Perks
                      </h3>
                      <span className="text-[10px] font-mono text-amber-950 bg-[#eaddca]/40 border border-[#eaddca] px-2.5 py-0.5 rounded font-extrabold">
                        {character.perks.length} Passive Perks Active
                      </span>
                    </div>

                    {character.perks.length === 0 ? (
                      <p className="text-xs text-stone-600 italic mb-5">No corporate or social perks scribed. Formulate a perk below or use the AI DM Advice builder!</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4 mb-6">
                        {character.perks.map((p, idx) => (
                          <div 
                            key={idx} 
                            className={`p-4 bg-brand-card border rounded-xl flex justify-between items-start relative overflow-hidden transition-all group/perk shadow-sm ${
                              activeEditingPerkIndex === idx 
                                ? "border-amber-600 bg-amber-50/35" 
                                : "border-[#eaddca] hover:border-[#ccd2cd]/70"
                            }`}
                          >
                            <div className="flex-1 pr-6 text-left">
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <h4 className="font-display font-black text-amber-800 text-sm">{p.title}</h4>
                                <span className="text-[9px] font-mono text-stone-600 bg-brand-beige border border-[#eaddca] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                  Trigger: {p.trigger}
                                </span>
                              </div>
                              <p className="text-stone-900 text-xs font-mono font-bold mb-1 flex items-center gap-1.5">
                                <span className="text-amber-600 font-bold">★</span> {p.effect}
                              </p>
                              <p className="text-stone-500 text-xs italic">"{p.description}"</p>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <button 
                                onClick={() => handleEditPerkClick(idx)}
                                className="text-stone-700 hover:text-stone-900 p-1 px-2.5 bg-brand-beige border border-[#eaddca] rounded hover:scale-105 transition-all text-[10px] font-mono font-bold cursor-pointer shadow-sm"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeletePerkClick(idx)}
                                className="text-rose-600 hover:text-rose-800 p-1.5 bg-brand-beige border border-[#eaddca] rounded hover:scale-105 transition-all cursor-pointer shadow-sm"
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
                    <div className="bg-brand-card border border-[#eaddca] rounded-2xl p-5 mt-4 shadow-sm animate-fade-in text-left">
                      <h4 className="text-xs font-mono text-amber-700 font-black uppercase mb-3 flex items-center justify-between">
                        <span>{activeEditingPerkIndex !== null ? "📝 Edit Scribed Perk" : "✨ Scribe Custom Perk"}</span>
                        {activeEditingPerkIndex !== null && (
                          <button 
                            onClick={() => { setActiveEditingPerkIndex(null); setPerkTitle(""); setPerkTrigger("Passive"); setPerkEffect(""); setPerkDescription(""); }} 
                            className="text-stone-400 hover:text-stone-700 font-bold text-xs uppercase cursor-pointer"
                          >
                            ✕ Cancel Edit
                          </button>
                        )}
                      </h4>

                      <div className="grid sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[10px] font-mono text-stone-500 uppercase mb-1 font-bold">Perk Title</label>
                          <input 
                            type="text" 
                            placeholder="e.g., Tactical Procrastinator" 
                            value={perkTitle}
                            onChange={(e) => setPerkTitle(e.target.value)}
                            className="w-full bg-brand-beige border border-[#eaddca] p-2.5 rounded-xl text-xs text-[#2a2015] focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium placeholder-stone-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-stone-500 uppercase mb-1 font-bold">Trigger Condition</label>
                          <input 
                            type="text" 
                            placeholder="e.g., Passive, or Ordering takeout" 
                            value={perkTrigger}
                            onChange={(e) => setPerkTrigger(e.target.value)}
                            className="w-full bg-brand-beige border border-[#eaddca] p-2.5 rounded-xl text-xs text-[#2a2015] focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium placeholder-stone-400"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 mb-3 font-mono">
                        <div>
                          <label className="block text-[10px] font-mono text-stone-500 uppercase mb-1 font-bold">Modifier Effect</label>
                          <input 
                            type="text" 
                            placeholder="e.g., Advantage on Wisdom checks under pressure" 
                            value={perkEffect}
                            onChange={(e) => setPerkEffect(e.target.value)}
                            className="w-full bg-brand-beige border border-[#eaddca] p-2.5 rounded-xl text-xs text-[#2a2015] focus:outline-none focus:border-amber-600 focus:bg-white font-medium placeholder-stone-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-stone-500 uppercase mb-1 font-bold">Flavor Description / Joke</label>
                          <input 
                            type="text" 
                            placeholder="e.g., Under maximum panic, your reflexes and room reading are unmatched." 
                            value={perkDescription}
                            onChange={(e) => setPerkDescription(e.target.value)}
                            className="w-full bg-brand-beige border border-[#eaddca] p-2.5 rounded-xl text-xs text-[#2a2015] focus:outline-none focus:border-amber-600 focus:bg-white font-medium placeholder-stone-400"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={handleSavePerk}
                        disabled={!perkTitle.trim() || !perkEffect.trim()}
                        className="w-full text-white py-2.5 rounded-xl text-xs font-black transition-all uppercase cursor-pointer disabled:opacity-40 disabled:hover:opacity-60 shadow-sm"
                        style={{ backgroundColor: classColor }}
                      >
                        {activeEditingPerkIndex !== null ? "✓ Save and Scribe Perk Changes" : "+ Scribe Perk to Character Sheet"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "dm" && (
                <div className="bg-brand-card border border-[#eaddca] rounded-2xl flex flex-col h-[400px] overflow-hidden shadow-sm">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-brand-beige/70 text-stone-800 text-left">
                    {chatMessages.map(m => (
                      <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-md p-3 rounded-2xl text-xs shadow-sm ${m.sender === "user" ? "bg-amber-600 text-white font-extrabold rounded-tr-none" : "bg-brand-card text-stone-800 border border-[#eaddca] rounded-tl-none font-medium"}`}><p className="whitespace-pre-wrap">{m.text}</p></div>
                      </div>
                    ))}
                    {isDmThinking && <div className="text-xs text-amber-800 animate-pulse font-bold tracking-tight">The DM is flipping through manual logs...</div>}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="p-3 bg-brand-card border-t border-[#eaddca] flex gap-2">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="My roommate is tilted about dishes, help!" className="flex-1 bg-brand-beige border border-[#eaddca] p-2 rounded text-xs text-stone-850 focus:outline-none focus:border-amber-600 transition-all focus:bg-white" />
                    <button type="submit" className="px-4 text-white font-extrabold text-xs rounded-lg cursor-pointer shadow-sm active:scale-95 transition-all" style={{ backgroundColor: classColor }}>Send</button>
                  </form>
                </div>
              )}

              {activeTab === "markdown" && (
                <div className="bg-brand-card border border-[#eaddca] rounded-2xl p-5 font-mono text-xs text-stone-800 max-h-[350px] overflow-y-auto shadow-sm text-left">
                  <div className="flex justify-end mb-3">
                    <button onClick={() => { navigator.clipboard.writeText(generateMarkdownString()); setCopyStatus(true); setTimeout(() => setCopyStatus(false), 2000); }} className="text-[10px] bg-brand-beige hover:bg-[#ebdcb9] text-amber-800 px-3 py-1.5 rounded-lg border border-[#eaddca] font-black uppercase transition-all shadow-sm active:scale-95 cursor-pointer">{copyStatus ? "✓ Copied!" : "Copy to Scrolls"}</button>
                  </div>
                  <pre className="whitespace-pre-wrap text-left bg-brand-beige/40 p-4 rounded-xl border border-[#eaddca] text-stone-700 shadow-inner font-mono text-[10.5px] leading-relaxed select-all">{generateMarkdownString()}</pre>
                </div>
              )}
            </div>

            {/* Advanced Polyhedral Dice Bag Tray & Campaign history */}
            <div className="lg:col-span-4 flex flex-col gap-5 text-left">
              
              {/* Dice Scriptorium Bag */}
              <div className="bg-brand-card border border-[#eaddca] p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-display font-black text-sm text-stone-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <Dice5 className="w-4 h-4" style={{ color: classColor }} />
                    Polyhedral Dice Bag
                  </h4>
                  <span className="text-[10px] font-mono bg-[#eaddca]/40 border border-[#eaddca] text-amber-950 px-2 py-0.5 rounded uppercase font-bold">
                    BAG OPEN
                  </span>
                </div>

                <p className="text-[11px] text-stone-600 mb-3 leading-normal font-medium">
                  Select a polyhedral shape below, scribe your check details, then tap the die or any stat card to challenge fate:
                </p>

                {/* Clickable Shape Selectors */}
                <div className="grid grid-cols-6 gap-1.5 mb-4 font-mono font-black text-xs">
                  {(["d4", "d6", "d8", "d10", "d12", "d20"] as const).map(d => {
                    const isSelected = activeDieType === d;
                    return (
                      <button
                        key={d}
                        onClick={() => {
                          setActiveDieType(d);
                          setRollResult(null);
                        }}
                        className="py-1.5 rounded-lg border text-center cursor-pointer transition-all uppercase font-black shadow-sm"
                        style={{
                          backgroundColor: isSelected ? classColor : "#ebdcb9",
                          borderColor: isSelected ? classColor : "#eaddca",
                          color: isSelected ? "#ffffff" : "#475569"
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>

                {/* Roll Objective Note Input */}
                <div className="mb-4">
                  <label className="block text-[10px] font-mono text-stone-500 uppercase font-black mb-1">
                    ROLL OBJECTIVE NOTE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bluffing bar bouncer for free VIP access..."
                    value={rollNote}
                    onChange={(e) => setRollNote(e.target.value)}
                    className="w-full bg-brand-beige font-medium text-xs text-[#2a2015] border border-[#eaddca] p-2.5 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white transition-all placeholder-stone-400"
                  />
                </div>

                {/* Big Interactive Rolling Die */}
                <div className="flex flex-col items-center justify-center py-6 bg-brand-beige rounded-xl border border-[#eaddca] relative overflow-hidden group">
                  <div className="absolute top-1.5 left-2 font-mono text-[8px] text-amber-900/60 font-bold uppercase">
                    Shape: {activeDieType}
                  </div>
                  
                  <button
                    disabled={isRolling}
                    onClick={() => handleRollDice()}
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center font-mono font-black select-none border-2 shadow-sm relative transition-all duration-300 transform cursor-pointer active:scale-95 ${
                      isRolling ? "animate-pulse" : "hover:scale-105"
                    }`}
                    style={{
                      borderColor: classColor,
                      boxShadow: `0 4px 15px ${classColor}15`,
                      backgroundColor: "#ffffff",
                      color: classColor
                    }}
                  >
                    {isRolling ? (
                      <span className="text-2xl animate-spin inline-block">🎲</span>
                    ) : (
                      <span className="text-3xl tracking-tighter">{rollingVal}</span>
                    )}
                  </button>

                  <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mt-3 select-none font-black text-center px-4">
                    {isRolling ? "TUNING PROBABILITIES..." : "TAP DIE TO ROLL PURE CHECK"}
                  </span>
                </div>

                {/* Scriptorium result card overlay */}
                {rollResult && (
                  <div 
                    className="mt-4 p-4 rounded-xl border text-center transition-all shadow-sm"
                    style={{
                      backgroundColor: `${rollResult.bracket === "crit-success" ? "#06b6d4" : rollResult.bracket === "crit-fail" ? "#ef4444" : rollResult.bracket === "success" ? classColor : "#cbd5e1"}09`,
                      borderColor: `${rollResult.bracket === "crit-success" ? "#06b6d4" : rollResult.bracket === "crit-fail" ? "#ef4444" : rollResult.bracket === "success" ? classColor : "#ebdcb9"}bf`
                    }}
                  >
                    <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold" style={{ color: classColor }}>
                      Result: {rollResult.statName}
                    </span>
                    <div 
                      className="text-4xl font-mono font-black my-1.5"
                      style={{ color: rollResult.bracket === "crit-success" ? "#06b6d4" : rollResult.bracket === "crit-fail" ? "#ef4444" : classColor }}
                    >
                      {rollResult.total}
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono mb-2">
                      ({rollResult.natural} on {activeDieType}) {rollResult.modifier >= 0 ? `+ ${rollResult.modifier} Mod` : `- ${Math.abs(rollResult.modifier)} Mod`}
                    </div>
                    <p className="text-xs text-stone-600 italic leading-relaxed font-mono font-medium">
                      "{rollResult.message}"
                    </p>
                  </div>
                )}
              </div>

              {/* Campaign Roll History Ledger */}
              <div className="bg-brand-card border border-[#eaddca] p-5 rounded-2xl flex flex-col shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b border-[#eaddca] pb-2.5">
                  <h4 className="font-display font-black text-xs text-stone-900 uppercase tracking-wider">
                    📜 Real-World Roll History Ledger
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-amber-950 bg-[#eaddca]/40 border border-[#eaddca] px-2.5 py-0.5 rounded">
                    {rollHistory.length} logs
                  </span>
                </div>

                {rollHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-stone-600 italic">Roll history ledger is currently empty.</p>
                    <p className="text-[10.5px] text-stone-500 font-mono mt-1 font-bold">Make characters or checks to record deeds.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {rollHistory.map((h, i) => {
                      const isCrit = h.natural === parseInt(h.diceType.substring(1));
                      const isFail = h.natural === 1;
                      return (
                        <div 
                          key={h.id || i}
                          className="p-3 bg-brand-beige/50 border border-[#eaddca] rounded-xl flex items-center justify-between gap-3 text-xs text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1 text-[10px] font-mono">
                              <span 
                                className="font-extrabold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide bg-brand-card shadow-sm"
                                style={{
                                  color: isCrit ? "#06b6d4" : isFail ? "#ef4444" : classColor,
                                  border: `1px solid ${isCrit ? "rgba(6,182,212,0.3)" : isFail ? "rgba(239,68,68,0.3)" : `${classColor}25`}`
                                }}
                              >
                                {h.diceType.toUpperCase()}
                              </span>
                              <span className="text-stone-850 font-extrabold">
                                {h.associatedStat ? h.associatedStat : "RAW"}
                              </span>
                              <span className="text-stone-500 font-semibold">{h.timestamp}</span>
                            </div>
                            <p className="text-[10.5px] text-stone-600 font-mono truncate italic leading-relaxed font-bold">
                              "{h.note}"
                            </p>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <div 
                               className="text-base font-mono font-black"
                               style={{ color: isCrit ? "#06b6d4" : isFail ? "#ef4444" : "#2a2015" }}
                            >
                              {h.total}
                            </div>
                            <div className="text-[9px] text-stone-500 font-mono font-medium">
                              ({h.natural} nat)
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}