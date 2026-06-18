import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Dumbbell, Activity, Heart, Brain, Eye, MessageSquare, 
  Wand2, Edit3, Sparkles, Copy, Check, LogOut, ArrowRight,
  Dice5, MessageSquareText, HelpCircle, Shield, Award, RefreshCw, Send, Terminal
} from "lucide-react";
import { CharacterSheet, StatBlock, Perk, STAT_DESCRIPTIONS, ChatMessage } from "./types";
import Wizard from "./components/Wizard";

export default function App() {
  const [character, setCharacter] = useState<CharacterSheet | null>(() => {
    const saved = localStorage.getItem("irl_character_sheet");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<"sheet" | "dm" | "markdown">("sheet");
  const [copyStatus, setCopyStatus] = useState<boolean>(false);
  
  // Dev & manual overrides mode
  const [devMode, setDevMode] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [newPerkTitle, setNewPerkTitle] = useState("");
  const [newPerkEffect, setNewPerkEffect] = useState("");
  const [newPerkDescription, setNewPerkDescription] = useState("");
  const [newPerkTrigger, setNewPerkTrigger] = useState("");
  const [perkError, setPerkError] = useState("");
  
  // Interactive Dice Rolling state
  const [rollResult, setRollResult] = useState<{
    statName: string;
    natural: number;
    modifier: number;
    total: number;
    bracket: "crit-fail" | "fail" | "success" | "crit-success";
    message: string;
  } | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  // DM Chat window state
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: "welcome",
        sender: "dm",
        text: "Greetings, noble modern traveler! I am your AI Dungeon Master. What real-world quest, tedious errand, or social encounter are we strategizing today? Throw any task at me and I will tell you which rolls and perks you need to deploy!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [isDmThinking, setIsDmThinking] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isDmThinking]);

  // Persist character sheet in local storage
  const handleSaveCharacter = (sheet: CharacterSheet) => {
    setCharacter(sheet);
    localStorage.setItem("irl_character_sheet", JSON.stringify(sheet));
  };

  const handleResetCharacter = () => {
    setShowResetConfirm(true);
  };

  const executeResetCharacter = () => {
    setCharacter(null);
    localStorage.removeItem("irl_character_sheet");
    setRollResult(null);
    setShowResetConfirm(false);
    setChatMessages([
      {
        id: "welcome",
        sender: "dm",
        text: "Greetings, noble modern traveler! I am your AI Dungeon Master. What real-world quest, tedious errand, or social encounter are we strategizing today? Throw any task at me and I will tell you which rolls and perks you need to deploy!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Convert the sheet into a perfectly formatted markdown table
  const generateMarkdownString = (): string => {
    if (!character) return "";
    
    const modifierOf = (val: number) => {
      const mod = Math.floor((val - 10) / 2);
      return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    return `# IRL Character Sheet: ${character.name}

## Profile Information
- **Archetype**: ${character.role}
- **Current Level**: Level ${character.level}
- **Active Faction**: ${character.faction}

## Real-World Stats

| Stat | Score | Modifier | Everyday Life Utility |
| :--- | :---: | :---: | :--- |
| **Strength (STR)** | ${character.stats.strength} | ${modifierOf(character.stats.strength)} | Lifting heavy gear, opening stubborn airtight jars |
| **Dexterity (DEX)** | ${character.stats.dexterity} | ${modifierOf(character.stats.dexterity)} | Video game reflexes, physical board game setups |
| **Constitution (CON)** | ${character.stats.constitution} | ${modifierOf(character.stats.constitution)} | Endurance for late-night gaming, food immunity |
| **Intelligence (INT)** | ${character.stats.intelligence} | ${modifierOf(character.stats.intelligence)} | Rulebook comprehension, optimal routes, trivia |
| **Wisdom (WIS)** | ${character.stats.wisdom} | ${modifierOf(character.stats.wisdom)} | Reading the social room, tilted friend detection |
| **Charisma (CHA)** | ${character.stats.charisma} | ${modifierOf(character.stats.charisma)} | Pick-the-game persuasion, food ordering tactics |

## IRL Passive Perks
${character.perks.map(perk => `- **${perk.title}**: ${perk.effect}  
  *"${perk.description}"* (Trigger: ${perk.trigger})`).join("\n")}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateMarkdownString());
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  // Roll D20 Simulation
  const handleRollDice = (statName: keyof StatBlock) => {
    if (isRolling || !character) return;
    setIsRolling(true);
    setRollResult(null);

    // Dynamic Level/XP increment for roll!
    const updatedXP = character.xp + 15;
    let nextLevel = character.level;
    let levelUpMessage = "";
    if (updatedXP >= 100) {
      nextLevel += 1;
      levelUpMessage = "🌟 LEVEL UP! You reached Level " + nextLevel + "!";
    }
    const newSheet = {
      ...character,
      xp: updatedXP % 100,
      level: nextLevel
    };
    setCharacter(newSheet);
    localStorage.setItem("irl_character_sheet", JSON.stringify(newSheet));

    setTimeout(() => {
      const d20 = Math.floor(Math.random() * 20) + 1;
      const val = character.stats[statName];
      const mod = Math.floor((val - 10) / 2);
      const totalScore = d20 + mod;
      
      let bracket: "crit-fail" | "fail" | "success" | "crit-success" = "success";
      let msg = "";

      if (d20 === 20) {
        bracket = "crit-success";
        msg = `LEGENDARY ROLL! Critical success! You perform the ${statName}-related action flawlessly. Jars fly open, roommates yield, and your reflexes are supernatural. (+15 XP)`;
      } else if (d20 === 1) {
        bracket = "crit-fail";
        msg = `CRITICAL FAILURE! Oh dear. You stub your toe, stutter your words, or drop your mug. You gain experience mostly from being humbled. (+15 XP)`;
      } else if (totalScore >= 12) {
        bracket = "success";
        msg = `SUCCESS! Solid roll. You cleanly complete the target task. The room is read, the heavy box is moved safely, or the perfect delivery joint is selected. (+15 XP)`;
      } else {
        bracket = "fail";
        msg = `MINOR SETBACK! A bit clumsy or unpolished. You might need to ask a guild member for help or invest more focus next time. (+15 XP)`;
      }

      if (levelUpMessage) {
        msg += " " + levelUpMessage;
      }

      setRollResult({
        statName: STAT_DESCRIPTIONS[statName].label,
        natural: d20,
        modifier: mod,
        total: totalScore,
        bracket,
        message: msg
      });
      setIsRolling(false);
    }, 600);
  };

  // AI Chat submission to Gemini
  const handleSendMessage = async (e: any) => {
    e.preventDefault();
    if (!chatInput.trim() || isDmThinking || !character) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    
    // Add user message to history
    const userMessageObj: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: userMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMessageObj]);
    setIsDmThinking(true);

    try {
      const response = await fetch("/api/dm-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character,
          message: userMsg,
          history: chatMessages.slice(-5) // pass recent state
        })
      });
      if (!response.ok) throw new Error("The Dungeon Master seems to be shuffling some papers. Try again!");
      
      const resData = await response.json();
      
      setChatMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "dm",
          text: resData.text || "Your current traits seem perfectly tuned to bypass this obstacles!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "dm",
          text: `⚠️ [Dungeon Master Error]: "${err.message || "Failed to establish mind connection"}" - Use your default attributes to slide through this!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsDmThinking(false);
    }
  };

  // Get active emoji avatar
  const getAvatarEmoji = (key: string) => {
    switch (key) {
      case "wiz-boy": return "🧙‍♂️";
      case "knight": return "🛡️";
      case "rogue": return "🥷";
      case "wild": return "🦁";
      case "goblin": return "👺";
      case "intellect": return "🧠";
      case "coder": return "💻";
      case "coffee": return "☕";
      default: return "🧙‍♂️";
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Decorative top header strip */}
      <div className="h-1 w-full bg-gradient-to-r from-yellow-600 via-amber-500 to-amber-700" id="decorative-gold-line" />

      {/* Reset Character Confirm Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            id="reset-confirm-backdrop"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-zinc-900 border-2 border-red-500/30 p-6 rounded-2xl max-w-md w-full shadow-2xl text-center flex flex-col gap-4"
              id="reset-confirm-box"
            >
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <LogOut className="w-6 h-6 animate-pulse" />
              </div>

              <div>
                <h3 className="font-display font-black text-lg text-white">Retire Active Hero?</h3>
                <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
                  Are you absolutely certain you want to retire <span className="text-white font-bold">{character?.name}</span>? 
                  Your level, experiences, passive abilities, and custom D&D status attributes will be safely cleared and forgotten forever.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs font-semibold transition-all border border-zinc-700 cursor-pointer"
                >
                  No, Keep Character
                </button>
                <button
                  onClick={executeResetCharacter}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  Yes, Delete & Restart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      {!character ? (
        <Wizard onComplete={handleSaveCharacter} />
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12" id="character-workspace">
          
          {/* Top Banner Navigation */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-zinc-900/60 p-5 rounded-2xl border border-zinc-850" id="char-top-banner">
            <div className="flex items-center gap-4">
              <div className="text-4xl p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl relative">
                {getAvatarEmoji(character.avatar)}
                <span className="absolute -bottom-1.5 -right-1 bg-amber-500 text-black text-[10px] font-mono font-bold px-1.5 rounded-full border-2 border-zinc-900">
                  Lvl {character.level}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-display font-bold text-white tracking-tight" id="hero-name">
                    {character.name}
                  </h1>
                  <span className="text-xs bg-amber-500/10 text-amber-400 font-mono px-2 py-0.5 rounded border border-amber-500/30">
                    {character.role}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                  <span className="font-mono text-zinc-500">Faction:</span>
                  <span className="text-zinc-300 font-medium">{character.faction}</span>
                  <span className="text-zinc-600">•</span>
                  <Award className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-mono text-zinc-400">XP: {character.xp}/100</span>
                </div>
              </div>
            </div>

            {/* EXP Bar */}
            <div className="flex-1 max-w-xs px-2 hidden sm:block">
              <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                <span>XP Progress</span>
                <span>{character.xp}% to next Level</span>
              </div>
              <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                <div 
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${character.xp}%` }} 
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-end md:self-auto" id="char-actions">
              <button 
                id="toggle-dev-mode-btn"
                onClick={() => setDevMode(!devMode)}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                  devMode 
                    ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-md shadow-amber-500/5 font-extrabold" 
                    : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white"
                }`}
                title="Toggle manual attribute and perk override developer panel"
              >
                <Terminal className="w-3.5 h-3.5" /> Dev Mode: {devMode ? "ON" : "OFF"}
              </button>
              
              <button 
                id="reset-char-btn"
                onClick={handleResetCharacter}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-850 transition-colors cursor-pointer"
                title="Scribe a brand-new character sheet"
              >
                <LogOut className="w-3.5 h-3.5" /> Re-roll Sheet
              </button>
            </div>
          </div>

          {/* Navigation View Tabs */}
          <div className="flex border-b border-zinc-850 gap-4 mb-6" id="view-tabs">
            <button 
              id="tab-sheet-btn"
              onClick={() => setActiveTab("sheet")}
              className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer flex items-center gap-2 ${
                activeTab === "sheet" ? "text-amber-500" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Shield className="w-4 h-4" /> Active Attribute Sheet
              {activeTab === "sheet" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500" />
              )}
            </button>
            <button 
              id="tab-dm-btn"
              onClick={() => setActiveTab("dm")}
              className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer flex items-center gap-2 ${
                activeTab === "dm" ? "text-amber-500" : "text-zinc-400 hover:text-white"
              }`}
            >
              <MessageSquareText className="w-4 h-4" /> AI Dungeon Master Advice
              {activeTab === "dm" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500" />
              )}
            </button>
            <button 
              id="tab-markdown-btn"
              onClick={() => setActiveTab("markdown")}
              className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer flex items-center gap-2 ${
                activeTab === "markdown" ? "text-amber-500" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Terminal className="w-4 h-4" /> Raw D&D Export (Markdown)
              {activeTab === "markdown" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500" />
              )}
            </button>
          </div>

          {/* Workspace Content */}
          <div className="grid lg:grid-cols-12 gap-6" id="workspace-grid">
            
            {/* Left Side: Active Panel based on selected tab */}
            <div className="lg:col-span-8 flex flex-col gap-6" id="active-panel">
              {activeTab === "sheet" && (
                <div className="flex flex-col gap-6" id="panel-sheet">
                  
                  {/* Dev Mode Override Console */}
                  {devMode && (
                    <div className="bg-amber-950/15 border-2 border-dashed border-amber-500/40 p-5 rounded-2xl flex flex-col gap-4" id="dev-mode-editor">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-amber-400" />
                          <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider">Dungeon Master Console</h4>
                        </div>
                        <span className="text-[9px] font-mono bg-amber-500 text-black px-2 py-0.5 rounded font-extrabold uppercase">Manual Active</span>
                      </div>

                      <p className="text-xs text-zinc-400 font-sans">
                        🛠️ **Dev Mode Override**: Type any values to instantaneously rewrite your identity, tweak experience pools, or add custom passive abilities.
                      </p>

                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Hero Name</label>
                          <input 
                            type="text"
                            value={character.name}
                            onChange={(e) => {
                              const next = { ...character, name: e.target.value };
                              setCharacter(next);
                              localStorage.setItem("irl_character_sheet", JSON.stringify(next));
                            }}
                            className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Archetype / Role / Class</label>
                          <input 
                            type="text"
                            value={character.role}
                            onChange={(e) => {
                              const next = { ...character, role: e.target.value };
                              setCharacter(next);
                              localStorage.setItem("irl_character_sheet", JSON.stringify(next));
                            }}
                            className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Guild / Faction</label>
                          <input 
                            type="text"
                            value={character.faction}
                            onChange={(e) => {
                              const next = { ...character, faction: e.target.value };
                              setCharacter(next);
                              localStorage.setItem("irl_character_sheet", JSON.stringify(next));
                            }}
                            className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Character Level</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              min="1"
                              max="100"
                              value={character.level}
                              onChange={(e) => {
                                const next = { ...character, level: Math.max(1, parseInt(e.target.value) || 1) };
                                setCharacter(next);
                                localStorage.setItem("irl_character_sheet", JSON.stringify(next));
                              }}
                              className="bg-zinc-950 border border-zinc-850 p-2 rounded text-xs text-white focus:outline-none focus:border-amber-500 font-mono w-20"
                            />
                            <div className="flex gap-1">
                              <button 
                                onClick={() => {
                                  const next = { ...character, level: Math.max(1, character.level - 1) };
                                  setCharacter(next);
                                  localStorage.setItem("irl_character_sheet", JSON.stringify(next));
                                }}
                                className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded text-xs cursor-pointer"
                              >
                                -
                              </button>
                              <button 
                                onClick={() => {
                                  const next = { ...character, level: character.level + 1 };
                                  setCharacter(next);
                                  localStorage.setItem("irl_character_sheet", JSON.stringify(next));
                                }}
                                className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded text-xs cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Experience Points (XP)</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              min="0"
                              max="99"
                              value={character.xp}
                              onChange={(e) => {
                                const next = { ...character, xp: Math.max(0, Math.min(99, parseInt(e.target.value) || 0)) };
                                setCharacter(next);
                                localStorage.setItem("irl_character_sheet", JSON.stringify(next));
                              }}
                              className="bg-zinc-950 border border-zinc-850 p-2 rounded text-xs text-white focus:outline-none focus:border-amber-500 font-mono w-20"
                            />
                            <div className="flex gap-1">
                              <button 
                                onClick={() => {
                                  const next = { ...character, xp: Math.max(0, character.xp - 10) };
                                  setCharacter(next);
                                  localStorage.setItem("irl_character_sheet", JSON.stringify(next));
                                }}
                                className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded text-xs font-mono cursor-pointer"
                                title="-10 XP"
                              >
                                -10
                              </button>
                              <button 
                                onClick={() => {
                                  let nextL = character.level;
                                  let nextXP = character.xp + 10;
                                  if (nextXP >= 100) {
                                    nextL += 1;
                                    nextXP = nextXP % 100;
                                  }
                                  const next = { ...character, xp: nextXP, level: nextL };
                                  setCharacter(next);
                                  localStorage.setItem("irl_character_sheet", JSON.stringify(next));
                                }}
                                className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded text-xs font-mono cursor-pointer"
                                title="+10 XP"
                              >
                                +10
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Add Custom Perk Forge */}
                      <div className="border-t border-zinc-800 pt-4 mt-2">
                        <label className="block text-xs font-bold text-amber-400 mb-2">✨ Manual Perk Forge</label>
                        <div className="grid sm:grid-cols-2 gap-3 mb-3">
                          <input 
                            type="text"
                            placeholder="Perk Title (e.g. Pizza Conjurer)"
                            value={newPerkTitle}
                            onChange={(e) => setNewPerkTitle(e.target.value)}
                            className="bg-zinc-950 border border-zinc-850 p-2 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                          />
                          <input 
                            type="text"
                            placeholder="Game Effect (e.g. +2 to Charisma when ordering food)"
                            value={newPerkEffect}
                            onChange={(e) => setNewPerkEffect(e.target.value)}
                            className="bg-zinc-950 border border-zinc-850 p-2 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3 mb-3">
                          <input 
                            type="text"
                            placeholder="Humorous Description"
                            value={newPerkDescription}
                            onChange={(e) => setNewPerkDescription(e.target.value)}
                            className="bg-zinc-950 border border-zinc-850 p-2 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                          />
                          <input 
                            type="text"
                            placeholder="Trigger Condition (e.g. Consuming cold takeout)"
                            value={newPerkTrigger}
                            onChange={(e) => setNewPerkTrigger(e.target.value)}
                            className="bg-zinc-950 border border-zinc-850 p-2 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        {perkError && (
                          <div className="text-red-400 text-xs bg-red-950/20 px-3 py-2 rounded border border-red-900/30 font-semibold mb-3">
                            ⚠️ {perkError}
                          </div>
                        )}
                        <button
                          onClick={() => {
                            if (!newPerkTitle.trim() || !newPerkEffect.trim()) {
                              setPerkError("Please fill in at least the Perk Title and the Game Effect!");
                              return;
                            }
                            setPerkError("");
                            const added: Perk = {
                              title: newPerkTitle.trim(),
                              effect: newPerkEffect.trim(),
                              description: newPerkDescription.trim() || "No customized flavor text recorded.",
                              trigger: newPerkTrigger.trim() || "Passive"
                            };
                            const next = { ...character, perks: [...character.perks, added] };
                            setCharacter(next);
                            localStorage.setItem("irl_character_sheet", JSON.stringify(next));
                            // reset
                            setNewPerkTitle("");
                            setNewPerkEffect("");
                            setNewPerkDescription("");
                            setNewPerkTrigger("");
                          }}
                          className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs py-2 px-4 rounded transition-all flex items-center justify-center gap-1 cursor-pointer w-full shadow"
                        >
                          + Scribe Custom Perk into Active Sheet
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-display font-bold text-lg text-white">IRL Core Stats {devMode ? "(Override Mode Active!)" : "(Click any stat to roll D20!)"}</h3>
                      <span className="text-xs text-zinc-500 font-mono">Roll mod = Math.floor((Attribute - 10) / 2)</span>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4" id="stats-click-grid">
                      {Object.entries(STAT_DESCRIPTIONS).map(([key, desc]) => {
                        const statKey = key as keyof StatBlock;
                        const value = character.stats[statKey];
                        const modifier = Math.floor((value - 10) / 2);

                        return (
                          <div 
                            key={statKey}
                            id={`stat-card-${statKey}`}
                            onClick={() => {
                              if (!devMode) {
                                handleRollDice(statKey);
                              }
                            }}
                            disabled={isRolling}
                            className={`p-4 bg-zinc-900/40 rounded-xl border border-zinc-850 select-none group text-left relative overflow-hidden transition-all ${
                              devMode ? "border-amber-500/20" : "hover:border-amber-500/50 hover:bg-zinc-900/80 cursor-pointer"
                            } ${isRolling ? "pointer-events-none opacity-60" : ""}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="p-1 px-2 text-[10px] font-mono tracking-wider font-extrabold bg-zinc-805 text-zinc-400 group-hover:text-amber-400 uppercase rounded">
                                {statKey.substring(0, 3)}
                              </span>
                              <div className="flex items-center gap-1">
                                {!devMode && <Dice5 className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 group-hover:scale-110 transition-all" />}
                                <span className={`font-mono text-xs font-bold leading-none px-1.5 py-0.5 rounded ${
                                  modifier >= 0 ? "text-green-400 bg-green-950/20" : "text-red-400 bg-red-950/20"
                                }`}>
                                  {modifier >= 0 ? `+${modifier}` : modifier}
                                </span>
                              </div>
                            </div>

                            <h4 className="font-display font-extrabold text-white text-base group-hover:text-amber-400 transition-colors">
                              {value}
                            </h4>
                            <span className="block text-xs font-mono font-bold text-zinc-400 mb-2">
                              {desc.label}
                            </span>
                            <p className="text-[10px] text-zinc-500 leading-normal line-clamp-2">
                              {desc.utility}
                            </p>

                            {/* Manual control increments if in developer mode */}
                            {devMode ? (
                              <div className="flex justify-between items-center mt-3 gap-1.5 pt-2 border-t border-zinc-800" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => {
                                    const updated = { ...character.stats, [statKey]: Math.max(1, value - 1) };
                                    const next = { ...character, stats: updated };
                                    setCharacter(next);
                                    localStorage.setItem("irl_character_sheet", JSON.stringify(next));
                                  }}
                                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white rounded font-mono text-xs cursor-pointer transition-all border border-zinc-700"
                                  title="Decrease Stat"
                                >
                                  -
                                </button>
                                <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider font-mono">Tweak</span>
                                <button
                                  onClick={() => {
                                    const updated = { ...character.stats, [statKey]: Math.min(30, value + 1) };
                                    const next = { ...character, stats: updated };
                                    setCharacter(next);
                                    localStorage.setItem("irl_character_sheet", JSON.stringify(next));
                                  }}
                                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-755 text-zinc-300 hover:text-white rounded font-mono text-xs cursor-pointer transition-all border border-zinc-700"
                                  title="Increase Stat"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              /* Hover prompt */
                              <div className="absolute inset-x-0 bottom-0 py-1 bg-amber-500/10 border-t border-amber-500/20 text-center text-[9px] font-mono text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                🎭 CLICK TO ROLL TEST
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Passive Perks Section */}
                  <div id="panel-perks">
                    <h3 className="font-display font-bold text-lg text-white mb-4">Scribed Passive Perks {devMode && "(Editable/Deletable!)"}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {character.perks.map((perk, keyIndex) => (
                        <div key={keyIndex} className="p-4 bg-zinc-900/60 border border-zinc-850 rounded-xl relative overflow-hidden flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-2 mr-16">
                              <h4 className="font-display font-bold text-amber-400 text-sm">{perk.title}</h4>
                              <span className="text-[9px] bg-amber-500/10 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/20">
                                Passive Ability
                              </span>
                            </div>
                            <p className="text-zinc-200 text-xs font-mono mb-2 leading-relaxed">
                              ⭐ <span className="font-bold text-green-400">{perk.effect}</span>
                            </p>
                            <p className="text-zinc-400 text-xs leading-relaxed italic border-l border-zinc-800 pl-2">
                              "{perk.description}"
                            </p>
                          </div>
                          
                          {devMode && (
                            <button
                              onClick={() => {
                                const updated = character.perks.filter((_, pIdx) => pIdx !== keyIndex);
                                const next = { ...character, perks: updated };
                                setCharacter(next);
                                localStorage.setItem("irl_character_sheet", JSON.stringify(next));
                              }}
                              className="absolute top-2 right-2 bg-red-950/20 text-red-400 hover:bg-red-950/50 hover:text-red-300 rounded text-[9px] font-mono px-2 py-0.5 border border-red-900/30 transition-all cursor-pointer"
                              title="Delete Perk from active character"
                            >
                              Slay Perk
                            </button>
                          )}

                          <div className="mt-4 pt-2.5 border-t border-zinc-850 text-[10px] text-zinc-500 font-mono">
                            Trigger condition: <span className="text-zinc-400">{perk.trigger}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {activeTab === "dm" && (
                <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl flex flex-col h-[520px] overflow-hidden" id="panel-dm">
                  {/* Chat Header */}
                  <div className="bg-zinc-900/90 border-b border-zinc-850 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
                        <Wand2 className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-white text-sm">Campaign Dungeon Master</h4>
                        <p className="text-[10px] text-zinc-500 font-mono">Analyzing {character.name}'s active sheets</p>
                      </div>
                    </div>
                    <span className="bg-green-500/15 text-green-400 text-[9px] font-mono tracking-wider font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1.5 border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Active DM
                    </span>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-scroller">
                    {chatMessages.map((msg) => {
                      const isUser = msg.sender === "user";
                      return (
                        <div 
                          key={msg.id}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-md p-3.5 rounded-xl text-xs leading-relaxed ${
                            isUser 
                              ? "bg-amber-500 text-black font-semibold rounded-br-none" 
                              : "bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-bl-none"
                          }`}>
                            <p className="font-sans whitespace-pre-wrap">{msg.text}</p>
                            <span className={`block text-[8px] mt-1.5 text-right font-mono uppercase tracking-wider ${
                              isUser ? "text-amber-950" : "text-zinc-500"
                            }`}>
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {isDmThinking && (
                      <div className="flex justify-start">
                        <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-xl rounded-bl-none flex items-center gap-2 text-xs text-zinc-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                          <span>The DM is consulting the manual rules...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendMessage} className="p-3 bg-zinc-900/90 border-t border-zinc-850 flex gap-2">
                    <input 
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask the DM: 'My roommate is tilted about dirty dishes, how do I proceed?'"
                      className="flex-1 bg-zinc-950 border border-zinc-800 px-3.5 py-2 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                    <button 
                      type="submit"
                      disabled={isDmThinking || !chatInput.trim()}
                      className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 rounded-lg transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {activeTab === "markdown" && (
                <div className="flex flex-col gap-4" id="panel-markdown">
                  <div className="flex justify-between items-center bg-zinc-900/60 p-4 rounded-xl border border-zinc-850">
                    <div>
                      <h4 className="font-display font-semibold text-white text-sm">Perfect D&D-Style Markdown Block</h4>
                      <p className="text-xs text-zinc-400">Copy this clean table formatting to share on forums, chats, or notes folders!</p>
                    </div>
                    <button 
                      onClick={copyToClipboard}
                      className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      {copyStatus ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Markdown
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-5 font-mono text-xs overflow-x-auto text-zinc-300 leading-relaxed max-h-[380px] overflow-y-auto" id="markdown-pre-view">
                    <pre className="whitespace-pre-wrap">{generateMarkdownString()}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Virtual Dice Roller Widget Panel */}
            <div className="lg:col-span-4 flex flex-col gap-6" id="dice-roller-panel">
              <div className="bg-zinc-900/60 border border-zinc-850 p-5 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-850">
                  <Dice5 className="w-5 h-5 text-amber-400" />
                  <h4 className="font-display font-bold text-white text-sm">IRL D20 Dice Tray</h4>
                </div>

                {rollResult ? (
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={rollResult.natural + "-" + rollResult.total}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl"
                      id="active-roll-view"
                    >
                      <div className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider mb-2">
                        You rolled: <span className="text-zinc-300">{rollResult.statName} Check</span>
                      </div>

                      {/* Large Rolling Indicator */}
                      <div className="flex justify-center items-center gap-2 mb-3">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex flex-col items-center justify-center shadow-lg relative">
                          <span className="text-2xl font-mono font-extrabold text-zinc-950 leading-none">
                            {rollResult.total}
                          </span>
                          <span className="text-[8px] font-sans font-extrabold text-amber-950 tracking-wider uppercase mt-1">
                            Total
                          </span>
                        </div>
                        <div className="text-zinc-400 font-mono text-xs">
                          =
                        </div>
                        <div className="p-3 bg-zinc-900 rounded-lg text-center leading-none border border-zinc-800">
                          <div className="text-white font-bold text-sm font-mono">{rollResult.natural}</div>
                          <div className="text-[8px] text-zinc-500 uppercase mt-0.5">D20</div>
                        </div>
                        <div className="text-zinc-400 font-mono text-xs">
                          +
                        </div>
                        <div className="p-3 bg-zinc-900 rounded-lg text-center leading-none border border-zinc-800">
                          <div className={`font-bold text-sm font-mono ${rollResult.modifier >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {rollResult.modifier >= 0 ? `+${rollResult.modifier}` : rollResult.modifier}
                          </div>
                          <div className="text-[8px] text-zinc-500 uppercase mt-0.5">MOD</div>
                        </div>
                      </div>

                      <div className="mb-2">
                        <span className={`text-[10px] font-mono tracking-widest font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                          rollResult.bracket === "crit-success" ? "bg-green-500/10 border-green-500/30 text-green-400" :
                          rollResult.bracket === "crit-fail" ? "bg-red-500/10 border-red-500/30 text-red-400" :
                          rollResult.bracket === "success" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                          "bg-zinc-800 border-zinc-700 text-zinc-400"
                        }`}>
                          {rollResult.bracket.replace("-", " ")}
                        </span>
                      </div>

                      <p className="text-zinc-300 text-xs font-sans leading-relaxed text-center px-1">
                        {rollResult.message}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="p-8 text-center bg-zinc-950/40 border border-zinc-850/60 border-dashed rounded-xl" id="empty-dice-tray">
                    <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-2.5 border border-zinc-805">
                      <HelpCircle className="w-5 h-5 text-zinc-500" />
                    </div>
                    <span className="block text-xs font-semibold text-zinc-400 mb-1">No rolls initiated</span>
                    <p className="text-[10px] text-zinc-500 leading-normal max-w-xs mx-auto">
                      Click on any Stat Card to roll a test. Try rolling your highest stat for success, or roll a dump stat to see if luck saves you!
                    </p>
                  </div>
                )}

                {isRolling && (
                  <div className="p-6 bg-zinc-950/80 rounded-xl flex flex-col items-center justify-center gap-3" id="active-rolling-overlay">
                    <Dice5 className="w-10 h-10 text-amber-400 animate-spin-roll" />
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest animate-pulse-slow">
                      Rolling real-world fate...
                    </span>
                  </div>
                )}
              </div>

              {/* Guide Card helper */}
              <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950 border border-zinc-850 p-5 rounded-2xl flex flex-col gap-3">
                <h4 className="font-display font-bold text-white text-xs uppercase tracking-wider">Social Party Perks Guide</h4>
                <div className="space-y-2 text-xs text-zinc-400 leading-relaxed">
                  <p>✨ Roling stats gives you <span className="font-semibold text-amber-400">+15 XP</span> every single time. Reach 100 XP to level up your IRL score!</p>
                  <p>💬 Use the DM advice tab to turn everyday dilemmas (chores, work meetings, coffee runs) into structured roleplay check lists.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Loader used in DM overlay */}
      {false && <Loader2 className="animate-spin text-zinc-400" />}

    </div>
  );
}

// Redefine Loader2 if needed or let Lucide build it
function Loader2({ className }: { className?: string }) {
  return (
    <svg 
      className={`animate-spin ${className || ""}`}
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
