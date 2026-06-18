import React, { useState } from "react";
import { 
  BookOpen, Flame, Shield, Sparkles, Coins, Calculator, 
  ChevronRight, ChevronLeft, User, Brain, X,
  Heart, Eye, Activity, MessageSquare, Dumbbell, Wand2, 
  Dice5, Check, Loader2 
} from "lucide-react";
import { STAT_DESCRIPTIONS, StatBlock, CharacterSheet, Perk } from "../types";

interface WizardProps {
  onComplete: (sheet: CharacterSheet) => void;
  availableArchetypes: any[]; // Dynamic values from Dev Panel
  availableRaces: any[];
  onCancel?: () => void;
  showCancelButton?: boolean;
}

const AVATAR_OPTIONS = [
  { key: "king", emoji: "👑", bg: "bg-amber-100 border-amber-300", label: "Monarch" },
  { key: "nails", emoji: "💅", bg: "bg-pink-100 border-pink-300", label: "Diva" },
  { key: "shades", emoji: "🕶️", bg: "bg-slate-100 border-slate-300", label: "Cool" },
  { key: "lips", emoji: "💋", bg: "bg-red-100 border-red-300", label: "Fatal" },
  { key: "devil", emoji: "😈", bg: "bg-purple-100 border-purple-300", label: "Impish" },
  { key: "unicorn", emoji: "🦄", bg: "bg-fuchsia-100 border-fuchsia-300", label: "Mythic" },
  { key: "lightning", emoji: "⚡", bg: "bg-yellow-100 border-yellow-300", label: "Storm" },
  { key: "gem", emoji: "💎", bg: "bg-cyan-100 border-cyan-300", label: "Diamond" },
  { key: "peach", emoji: "🍑", bg: "bg-orange-100 border-orange-350", label: "Peach" },
  { key: "fire", emoji: "🔥", bg: "bg-red-100 border-orange-300", label: "Fierce" },
  { key: "rainbow", emoji: "🌈", bg: "bg-indigo-100 border-indigo-300", label: "Pride" },
  { key: "cowboy", emoji: "🤠", bg: "bg-amber-140/50 border-amber-300", label: "Outlaw" },
  { key: "wiz-boy", emoji: "🧙‍♂️", bg: "bg-purple-100 border-purple-300", label: "Mage" },
  { key: "knight", emoji: "🛡️", bg: "bg-slate-100 border-slate-300", label: "Defender" },
  { key: "rogue", emoji: "🥷", bg: "bg-emerald-100 border-emerald-300", label: "Infiltrator" }
];

export default function Wizard({ onComplete, availableArchetypes, availableRaces, onCancel, showCancelButton }: WizardProps) {
  const [step, setStep] = useState<number>(1);
  
  const [selectedArchetype, setSelectedArchetype] = useState<string>(availableArchetypes[0]?.id || "top");
  const [selectedRace, setSelectedRace] = useState<string>(availableRaces[0]?.id || "twink"); 
  const [highestStat, setHighestStat] = useState<keyof StatBlock>("strength");
  const [lowestStat, setLowestStat] = useState<keyof StatBlock>("wisdom");
  
  const getInitialStandardArray = (high: keyof StatBlock, low: keyof StatBlock): StatBlock => {
    const keys: (keyof StatBlock)[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
    const otherKeys = keys.filter(k => k !== high && k !== low);
    const initial: Partial<StatBlock> = {};
    initial[high] = 15;
    initial[low] = 8;
    const remainingVals = [14, 13, 12, 10];
    otherKeys.forEach((k, idx) => {
      initial[k] = remainingVals[idx];
    });
    return initial as StatBlock;
  };

  const [customStats, setCustomStats] = useState<StatBlock>({
    strength: 13, dexterity: 12, constitution: 10, intelligence: 15, wisdom: 14, charisma: 8
  });

  const [textAllocation, setTextAllocation] = useState("");
  const [parseResult, setParseResult] = useState<{ success: boolean; text: string } | null>(null);

  const [quirkInput, setQuirkInput] = useState<string>("");
  const [isGeneratingPerks, setIsGeneratingPerks] = useState<boolean>(false);
  const [generatedPerks, setGeneratedPerks] = useState<Perk[]>([
    {
      title: "Mundane Overthinker",
      effect: "+2 to Intelligence on tasks that should take 5 seconds",
      description: "You spend 45 minutes deciding which dish soap is the most 'logical' option.",
      trigger: "Buying grocery essentials"
    },
    {
      title: "Tactical Procrastinator",
      effect: "Advantage on Dexterity checks when deadline is < 1 hour",
      description: "Under maximum panic, your reflexes and focus are unmatched.",
      trigger: "Assignments due soon"
    }
  ]);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [charName, setCharName] = useState<string>("");
  const [nameError, setNameError] = useState<string>("");
  const [faction, setFaction] = useState<string>("Modern Adventurers");
  const [avatar, setAvatar] = useState<string>("coder");

  // 📜 Scribe custom perk states
  const [perkTitle, setPerkTitle] = useState("");
  const [perkTrigger, setPerkTrigger] = useState("");
  const [perkEffect, setPerkEffect] = useState("");
  const [perkDescription, setPerkDescription] = useState("");

  // 🖼️ Image Scriptorium States
  const [avatarMode, setAvatarMode] = useState<"emoji" | "scriptorium">("emoji");
  const [uploadedBase64, setUploadedBase64] = useState<string>("");
  const [avatarScale, setAvatarScale] = useState<number>(1.2);
  const [avatarRotate, setAvatarRotate] = useState<number>(0);
  const [avatarX, setAvatarX] = useState<number>(0);
  const [avatarY, setAvatarY] = useState<number>(0);

  const archetypeDetails = availableArchetypes.find(a => a.id === selectedArchetype) || availableArchetypes[0];
  const raceDetails = availableRaces.find(r => r.id === selectedRace) || availableRaces[0];

  const handleArchetypeSelectDirect = (id: string) => {
    setSelectedArchetype(id);
    const matched = availableArchetypes.find(a => a.id === id);
    if (matched) {
      setHighestStat(matched.highest || "intelligence");
      setLowestStat(matched.lowest || "charisma");
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!charName.trim()) {
        setNameError("Hold your horses, adventurer! Your Character Sheet needs a name.");
        return;
      }
      setNameError("");
      const baseStats = getInitialStandardArray(highestStat, lowestStat);
      setCustomStats(baseStats);
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleStandardArrayChange = (targetStat: keyof StatBlock, newValue: number) => {
    const currentValue = customStats[targetStat];
    if (currentValue === newValue) return;
    
    const otherStat = (Object.keys(customStats) as (keyof StatBlock)[]).find(
      key => customStats[key] === newValue
    );
    
    setCustomStats(prev => {
      const next = { ...prev };
      next[targetStat] = newValue;
      if (otherStat) next[otherStat] = currentValue;
      return next;
    });
  };

  const handleParseTextAllocation = () => {
    setParseResult(null);
    const text = textAllocation.trim();
    if (!text) {
      setParseResult({ success: false, text: "The scribe needs some text to translate!" });
      return;
    }

    const statMapping: { [key: string]: keyof StatBlock } = {
      str: "strength", strength: "strength", dex: "dexterity", dexterity: "dexterity",
      con: "constitution", constitution: "constitution", int: "intelligence", intelligence: "intelligence",
      wis: "wisdom", wisdom: "wisdom", cha: "charisma", charisma: "charisma"
    };

    const allocated: Partial<StatBlock> = {};
    const usedScores = new Set<number>();

    Object.keys(statMapping).forEach(key => {
      const idx = text.toLowerCase().indexOf(key);
      if (idx !== -1) {
        const surroundingText = text.slice(Math.max(0, idx - 20), Math.min(text.length, idx + key.length + 20));
        const numMatch = surroundingText.match(/\b(15|14|13|12|10|8)\b/);
        if (numMatch) {
          const val = parseInt(numMatch[1]);
          const targetStat = statMapping[key];
          if (targetStat && !usedScores.has(val) && !allocated[targetStat]) {
            allocated[targetStat] = val;
            usedScores.add(val);
          }
        }
      }
    });

    const parsedKeys = Object.keys(allocated) as (keyof StatBlock)[];
    if (parsedKeys.length === 0) {
      setParseResult({
        success: false,
        text: "Could not decode standard array values linked with stats. Example: 'Strength 15, Dex 14...'"
      });
      return;
    }

    const standardScores = [15, 14, 13, 12, 10, 8];
    const unusedScores = standardScores.filter(score => !usedScores.has(score));
    const allStats: (keyof StatBlock)[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
    const unparsedStats = allStats.filter(stat => !allocated[stat]);

    const finalStats = { ...customStats };
    parsedKeys.forEach(k => { finalStats[k] = allocated[k]!; });
    unparsedStats.forEach((stat, index) => {
      if (index < unusedScores.length) finalStats[stat] = unusedScores[index];
    });

    setCustomStats(finalStats);
    setParseResult({
      success: true,
      text: `Scribed: ${parsedKeys.map(k => `${STAT_DESCRIPTIONS[k].label} (${allocated[k]})`).join(", ")}!`
    });
  };

  const generatePerksFromDM = async () => {
    setIsGeneratingPerks(true);
    setGenerationError(null);
    try {
      const response = await fetch("/api/generate-perks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archetype: archetypeDetails?.name || "The Wildcard",
          race: raceDetails?.name || "Twink",
          highestStat,
          lowestStat,
          customInput: quirkInput,
          stats: customStats
        })
      });
      if (!response.ok) throw new Error("Dungeon Master is calculating. Enjoy fallback perks!");
      const data = await response.json();
      if (Array.isArray(data)) setGeneratedPerks(data);
    } catch (err: any) {
      setGenerationError(err.message || "Failed to generate perks.");
    } finally {
      setIsGeneratingPerks(false);
    }
  };

  const handleFinish = () => {
    if (!charName.trim()) {
      setNameError("Hold your horses, adventurer! Your Character Sheet needs a name.");
      return;
    }
    setNameError("");

    // 🌟 Calculate and Apply Ability Score Bonuses from Race dynamically!
    const ultimateStats = { ...customStats };
    if (raceDetails && raceDetails.bonuses) {
      Object.entries(raceDetails.bonuses).forEach(([statName, bonusAmount]) => {
        const key = statName as keyof StatBlock;
        if (ultimateStats[key] !== undefined) {
          ultimateStats[key] += (bonusAmount as number);
        }
      });
    }

    onComplete({
      id: Math.random().toString(36).substring(2, 9), // Set tracking key
      name: charName,
      role: archetypeDetails?.name || "Verse",
      race: raceDetails?.name || "Twink", 
      level: 1,
      xp: 0,
      stats: ultimateStats,
      perks: generatedPerks,
      customDetails: quirkInput,
      avatar: avatarMode === "scriptorium" && uploadedBase64 ? "custom_uploaded" : avatar,
      avatarImage: avatarMode === "scriptorium" ? uploadedBase64 : undefined,
      avatarConfig: avatarMode === "scriptorium" ? {
        scale: avatarScale,
        x: avatarX,
        y: avatarY,
        rotate: avatarRotate
      } : undefined,
      faction: faction || "Freelance Party",
      accentColor: archetypeDetails?.color || "#f43f5e"
    });
  };

  const renderIcon = (iconName: string, className = "w-5 h-5 text-yellow-500", style?: React.CSSProperties) => {
    switch (iconName) {
      case "BookOpen": return <BookOpen className={className} style={style} />;
      case "Flame": return <Flame className={className} style={style} />;
      case "Shield": return <Shield className={className} style={style} />;
      case "Sparkles": return <Sparkles className={className} style={style} />;
      case "Coins": return <Coins className={className} style={style} />;
      case "Calculator": return <Calculator className={className} style={style} />;
      default: return <Sparkles className={className} style={style} />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 bg-white border border-slate-200 rounded-3xl shadow-sm text-slate-800 text-left mt-6" id="wizard-container">
      {showCancelButton && onCancel && (
        <button onClick={onCancel} className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer font-bold font-mono">
          <X className="w-3.5 h-3.5" /> Close Creation Roster
        </button>
      )}

      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-black tracking-tight text-slate-800 mb-1 flex items-center justify-center gap-2">
          <Dice5 className="w-7 h-7 text-amber-500" />
          IRL CHARACTER GENERATOR
        </h1>
        <p className="text-slate-500 text-sm max-w-lg mx-auto font-medium">Map your actual habits, triumphs, and flaws into an interactive Tabletop RPG layout.</p>
        
        <div className="flex justify-center items-center gap-1.5 mt-6 max-w-xs mx-auto">
          {Array.from({ length: 3 }).map((_, idx) => (
            <React.Fragment key={idx}>
              <div className={`h-1.5 rounded-full transition-all ${step > idx ? "bg-amber-500 w-12" : "bg-slate-200 w-6"}`} />
              {idx < 2 && <div className={`h-[1px] w-4 ${step > idx + 1 ? "bg-amber-600" : "bg-slate-200"}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div>
        {/* Step 1: Assembly Phase */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 flex flex-col gap-5">
              <h3 className="font-display font-black text-sm text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-2">
                Step 1: Identity Assembly
              </h3>

              {/* Character Details & Faction */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Adventurer Name</label>
                  <input 
                    type="text" 
                    value={charName} 
                    onChange={(e) => setCharName(e.target.value)} 
                    placeholder="Diego the Coffee Sorcerer" 
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium placeholder-slate-400" 
                  />
                  {nameError && <p className="text-rose-500 text-xs mt-1 font-bold">⚠️ {nameError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Guild / Faction Name</label>
                  <input 
                    type="text" 
                    value={faction} 
                    onChange={(e) => setFaction(e.target.value)} 
                    placeholder="Tech Room Syndicate" 
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium placeholder-slate-400" 
                  />
                </div>
              </div>

              {/* Class Blueprint Selector */}
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2 font-bold">Choose Class Blueprint</label>
                <div className="grid md:grid-cols-2 gap-3 max-h-[195px] overflow-y-auto pr-1 border border-slate-200 rounded-xl p-2.5 bg-white shadow-inner">
                  {availableArchetypes.map((theme) => {
                    const isSelected = selectedArchetype === theme.id;
                    const itemColor = theme.color || "#e4e4e7";
                    return (
                      <div 
                        key={theme.id} 
                        onClick={() => handleArchetypeSelectDirect(theme.id)} 
                        className="p-3 rounded-lg border transition-all cursor-pointer text-left"
                        style={{ 
                          borderColor: isSelected ? itemColor : "#e2e8f0",
                          backgroundColor: isSelected ? `${itemColor}10` : "rgba(248, 250, 252, 0.8)"
                        }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          {renderIcon(theme.icon, "w-4 h-4", isSelected ? { color: itemColor } : { color: "#64748b" })}
                          {isSelected && (
                            <span 
                              className="text-white text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-black"
                              style={{ backgroundColor: itemColor }}
                            >
                              Selected
                            </span>
                          )}
                        </div>
                        <h4 
                          className="font-display font-black text-sm mb-0.5"
                          style={{ color: isSelected ? itemColor : "#334155" }}
                        >
                          {theme.name}
                        </h4>
                        <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-1">{theme.tagline}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Race Alignment Selector */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest font-bold">Select Race Alignment</label>
                  <span className="text-[10px] text-green-600 font-mono font-bold">Adds unique modifiers!</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1">
                  {availableRaces.map((r) => {
                    const isSelected = selectedRace === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRace(r.id)}
                        className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected ? "bg-amber-500/10 border-amber-500 shadow-sm" : "bg-white border-slate-200 hover:border-slate-350"
                        }`}
                        title={r.description}
                      >
                        <div>
                          <span className="text-lg block mb-0.5">{r.icon || "✨"}</span>
                          <span className="text-xs block font-bold text-slate-800 truncate">{r.name}</span>
                          <span className="text-[8.5px] block text-slate-400 mt-0.5 line-clamp-1">{r.tagline}</span>
                        </div>
                        {/* Ability modifier badges */}
                        <div className="text-[8px] text-green-600 font-mono font-bold mt-1.5 bg-green-50 py-0.5 rounded border border-green-200/50">
                          {Object.entries(r.bonuses || {}).map(([sKey, bVal]) => `+${bVal}${sKey.substring(0,3).toUpperCase()}`).join(" ")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Avatar Selector Panel */}
              <div>
                <div className="flex border-b border-slate-250 gap-4 mb-3.5">
                  <button 
                    type="button"
                    onClick={() => setAvatarMode("emoji")} 
                    className={`pb-2 text-xs font-mono font-bold cursor-pointer transition-all ${avatarMode === "emoji" ? "text-slate-800 border-b-2" : "text-slate-400 hover:text-slate-600"}`}
                    style={{ borderBottomColor: avatarMode === "emoji" ? (archetypeDetails?.color || "#f43f5e") : "transparent" }}
                  >
                    🛡️ Emoji Node Roster
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAvatarMode("scriptorium")} 
                    className={`pb-2 text-xs font-mono font-bold cursor-pointer transition-all ${avatarMode === "scriptorium" ? "text-slate-800 border-b-2" : "text-slate-400 hover:text-slate-600"}`}
                    style={{ borderBottomColor: avatarMode === "scriptorium" ? (archetypeDetails?.color || "#f43f5e") : "transparent" }}
                  >
                    🖼️ Image Scriptorium
                  </button>
                </div>

                {avatarMode === "emoji" ? (
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Choose Persona Emoji Node</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-1">
                      {AVATAR_OPTIONS.map((opt) => (
                        <div 
                          key={opt.key} 
                          onClick={() => setAvatar(opt.key)} 
                          className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${avatar === opt.key ? "bg-white border-opacity-100 shadow-sm" : "bg-white border-slate-200 hover:scale-[1.02]"}`}
                          style={{ 
                            borderColor: avatar === opt.key ? (archetypeDetails?.color || "#f43f5e") : undefined,
                            backgroundColor: avatar === opt.key ? `${archetypeDetails?.color || "#f43f5e"}10` : undefined
                          }}
                        >
                          <span className="text-xl block mb-0.5">{opt.emoji}</span>
                          <span className="text-[9px] block text-slate-500 font-bold">{opt.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-6 bg-white border border-slate-200 p-4 rounded-xl text-left shadow-inner">
                    {/* Left: Upload and Sliders */}
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1 font-bold">Local Image File</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === "string") {
                                  setUploadedBase64(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="text-xs text-slate-500 block w-full file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-mono file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer" 
                        />
                      </div>

                      <div className="space-y-2 font-mono text-[9px] text-slate-500 mt-2">
                        <div>
                          <div className="flex justify-between mb-0.5">
                            <span className="font-bold">SCALE: {avatarScale.toFixed(1)}x</span>
                            <span className="text-slate-400">0.5x - 3.0x</span>
                          </div>
                          <input 
                            type="range" 
                            min="0.5" 
                            max="3.0" 
                            step="0.1" 
                            value={avatarScale} 
                            onChange={(e) => setAvatarScale(parseFloat(e.target.value))} 
                            className="w-full accent-amber-500 h-1 bg-slate-200 rounded cursor-pointer" 
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-0.5">
                            <span className="font-bold">ROTATION: {avatarRotate}°</span>
                            <span className="text-slate-400">0° - 360°</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="360" 
                            value={avatarRotate} 
                            onChange={(e) => setAvatarRotate(parseInt(e.target.value))} 
                            className="w-full accent-amber-500 h-1 bg-slate-200 rounded cursor-pointer" 
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-0.5">
                            <span className="font-bold">X OFFSET: {avatarX}px</span>
                            <span className="text-slate-400">-100px - 100px</span>
                          </div>
                          <input 
                            type="range" 
                            min="-100" 
                            max="100" 
                            value={avatarX} 
                            onChange={(e) => setAvatarX(parseInt(e.target.value))} 
                            className="w-full accent-amber-500 h-1 bg-slate-200 rounded cursor-pointer" 
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-0.5">
                            <span className="font-bold">Y OFFSET: {avatarY}px</span>
                            <span className="text-slate-400">-100px - 100px</span>
                          </div>
                          <input 
                            type="range" 
                            min="-100" 
                            max="100" 
                            value={avatarY} 
                            onChange={(e) => setAvatarY(parseInt(e.target.value))} 
                            className="w-full accent-amber-500 h-1 bg-slate-200 rounded cursor-pointer" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: Scriptorium Preview */}
                    <div className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 font-bold">Live Token Crop Target</span>
                      <div 
                        className="relative w-28 h-28 rounded-full border-2 overflow-hidden flex items-center justify-center bg-white"
                        style={{ borderColor: archetypeDetails?.color || "#f43f5e" }}
                      >
                        {uploadedBase64 ? (
                          <img 
                            src={uploadedBase64} 
                            alt="Scriptorium Source Avatar" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover pointer-events-none select-none max-w-full max-h-full"
                            style={{ transform: `translate(${avatarX}px, ${avatarY}px) scale(${avatarScale}) rotate(${avatarRotate}deg)` }}
                          />
                        ) : (
                          <div className="text-center p-2 flex flex-col items-center gap-1">
                            <span className="text-2xl">🥷</span>
                            <span className="text-[8px] font-mono text-slate-500">Pending Upload...</span>
                          </div>
                        )}
                      </div>
                      {uploadedBase64 && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setAvatarScale(1.0);
                            setAvatarRotate(0);
                            setAvatarX(0);
                            setAvatarY(0);
                          }}
                          className="mt-2 text-[9px] font-mono text-slate-400 hover:text-slate-700 underline cursor-pointer"
                        >
                          Reset Transform Controls
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
            
            <div className="flex justify-end mt-2">
              <button onClick={handleNextStep} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer">
                Distribute Stats <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Stats Allocation */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Required Standard Array:</span>
              {[15, 14, 13, 12, 10, 8].map(score => (
                <span key={score} className={`text-xs font-mono font-black px-2.5 py-1 rounded-md border ${Object.values(customStats).includes(score) ? "bg-amber-500/10 border-amber-500/30 text-amber-600 font-bold" : "bg-zinc-100 text-zinc-400 line-through opacity-50"}`}>{score}</span>
              ))}
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-2.5">
              <h4 className="text-xs font-mono text-amber-600 font-bold uppercase">⚡ Keyboard Scriptorium</h4>
              <p className="text-[10px] text-slate-500 leading-normal font-medium">To save time, paste your stats allocation on a single line! Example: <i>"WIS 15, STR 14, CON 13"</i></p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={textAllocation} 
                  onChange={(e) => setTextAllocation(e.target.value)} 
                  placeholder="e.g., Charisma 15, Intelligence 14, Strength 13..." 
                  className="flex-1 bg-white border border-slate-200 p-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-400" 
                />
                <button onClick={handleParseTextAllocation} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl uppercase font-mono">Scribe</button>
              </div>
              {parseResult && (
                <p className={`text-xs font-mono ${parseResult.success ? "text-green-600" : "text-rose-500"}`}>{parseResult.text}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(STAT_DESCRIPTIONS).map(([key, desc]) => {
                const statKey = key as keyof StatBlock;
                const value = customStats[statKey];
                return (
                  <div key={statKey} className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl shadow-sm text-left">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-display font-black text-slate-700 text-sm">{desc.label}</span>
                      <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded text-green-700 bg-green-50 border border-green-200/50">+{Math.floor((value - 10) / 2)} modifier</span>
                    </div>
                    <select 
                      value={value} 
                      onChange={(e) => handleStandardArrayChange(statKey, parseInt(e.target.value))} 
                      className="w-full bg-white border border-slate-200 text-slate-700 font-mono text-xs p-2.5 rounded-xl focus:outline-none focus:border-slate-400 cursor-pointer"
                    >
                      {[15, 14, 13, 12, 10, 8].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between mt-4">
              <button onClick={handlePrevStep} className="text-slate-500 hover:text-slate-800 font-bold text-sm flex items-center gap-1 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Go Back</button>
              <button onClick={handleNextStep} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer">Custom Perks <ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* Step 3: Perks Customizer */}
        {step === 3 && (
          <div className="flex flex-col gap-6" id="wizard-step-3">
            <div className="grid md:grid-cols-2 gap-6">
              {/* AI DM Perk Synthesizer */}
              <div className="bg-slate-50/40 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between gap-4">
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider font-extrabold mb-2" style={{ color: archetypeDetails?.color || "#0284c7" }}>🔮 AI DM Perk Synthesizer</h4>
                  <p className="text-slate-500 text-xs leading-relaxed mb-4">Input custom real-world hobbies, quirks, or hyper-fixations to let the Dungeon Master forge bespoke passive rules.</p>
                  <textarea 
                    value={quirkInput} 
                    onChange={(e) => setQuirkInput(e.target.value)} 
                    placeholder="E.g., I am a web developer who lives on cold brew, stays up till 3 AM coding, and hoards mechanical keyboards..." 
                    className="w-full h-24 bg-white border border-slate-200 p-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-400" 
                  />
                </div>
                <button 
                  onClick={generatePerksFromDM} 
                  disabled={isGeneratingPerks} 
                  className="w-full px-5 py-2.5 bg-white hover:bg-slate-50 border text-slate-700 font-display font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                  style={{ borderColor: `${archetypeDetails?.color || "#0284c7"}50` }}
                >
                  {isGeneratingPerks ? <Loader2 className="w-4 h-4 animate-spin text-slate-650" /> : <Wand2 className="w-4 h-4" style={{ color: archetypeDetails?.color || "#0284c7" }} />} Synthesize AI Perks
                </button>
              </div>

              {/* Manual Scriptorium */}
              <div className="bg-slate-50/40 border border-slate-200 p-5 rounded-2xl flex flex-col gap-3">
                <h4 className="text-xs font-mono uppercase tracking-wider font-extrabold" style={{ color: archetypeDetails?.color || "#a855f7" }}>📜 Scribe Custom Perk Matrix</h4>
                <div className="grid grid-cols-2 gap-2.5 text-left text-xs">
                  <div>
                    <label className="block text-[9px] uppercase font-mono text-slate-500 font-black mb-0.5">Perk Title</label>
                    <input 
                      type="text" 
                      value={perkTitle} 
                      onChange={(e) => setPerkTitle(e.target.value)} 
                      placeholder="e.g., Rule Shark" 
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg text-slate-800 focus:outline-none focus:border-slate-400" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-mono text-slate-500 font-black mb-0.5">Trigger Condition</label>
                    <input 
                      type="text" 
                      value={perkTrigger} 
                      onChange={(e) => setPerkTrigger(e.target.value)} 
                      placeholder="e.g., During debates" 
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg text-slate-800 focus:outline-none focus:border-slate-400" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] uppercase font-mono text-slate-500 font-black mb-0.5">Modifier/Stat Effect</label>
                    <input 
                      type="text" 
                      value={perkEffect} 
                      onChange={(e) => setPerkEffect(e.target.value)} 
                      placeholder="e.g., +2 on Intelligence checks when arguing line 4" 
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg text-slate-800 focus:outline-none focus:border-slate-400" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] uppercase font-mono text-slate-500 font-black mb-0.5">Humor Description</label>
                    <input 
                      type="text" 
                      value={perkDescription} 
                      onChange={(e) => setPerkDescription(e.target.value)} 
                      placeholder="e.g., You read details perfectly but annoy your fellows." 
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg text-slate-800 focus:outline-none focus:border-slate-400" 
                    />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (!perkTitle.trim() || !perkEffect.trim()) return;
                    const newPerk = {
                      title: perkTitle.trim(),
                      trigger: perkTrigger.trim() || "Always Active",
                      effect: perkEffect.trim(),
                      description: perkDescription.trim() || "A customized rule written into your destiny."
                    };
                    setGeneratedPerks([...generatedPerks, newPerk]);
                    setPerkTitle("");
                    setPerkTrigger("");
                    setPerkEffect("");
                    setPerkDescription("");
                  }}
                  disabled={!perkTitle.trim() || !perkEffect.trim()}
                  className="w-full mt-1.5 py-2 text-white font-mono text-xs font-black rounded-lg uppercase cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95 shadow-sm"
                  style={{ backgroundColor: archetypeDetails?.color || "#a855f7" }}
                >
                  + Scribe Perk
                </button>
              </div>
            </div>

            {/* Quirk list */}
            <div>
              <h3 className="text-sm font-mono uppercase text-slate-500 font-bold mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: archetypeDetails?.color }} /> Active Perk Ledger ({generatedPerks.length})
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {generatedPerks.map((p, idx) => (
                  <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl relative group text-left shadow-sm" style={{ borderColor: `${archetypeDetails?.color || "#f43f5e"}30` }}>
                    <button 
                      onClick={() => setGeneratedPerks(generatedPerks.filter((_, i) => i !== idx))}
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-rose-500 cursor-pointer opacity-50 group-hover:opacity-100 transition-opacity text-xs"
                      title="Discard Perk"
                    >
                      ✕
                    </button>
                    <h4 className="font-display font-black text-slate-800 text-sm mb-1">{p.title}</h4>
                    <p className="text-xs font-mono font-bold mb-1" style={{ color: archetypeDetails?.color || "#f43f5e" }}>{p.effect}</p>
                    <p className="text-slate-650 text-[10.5px] font-mono leading-relaxed mb-0.5">
                      <span className="text-slate-400 uppercase text-[9px] font-bold">Trigger:</span> {p.trigger}
                    </p>
                    <p className="text-slate-550 text-xs italic">"{p.description}"</p>
                  </div>
                ))}
                {generatedPerks.length === 0 && (
                  <div className="md:col-span-2 py-8 border border-dashed border-slate-350 rounded-xl text-center text-slate-400 text-xs font-medium bg-slate-50/50">
                    No passive perks listed yet. Use AI or Scribe Custom Perk Matrix to add some!
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <button onClick={handlePrevStep} className="text-slate-500 hover:text-slate-800 font-bold text-sm flex items-center gap-1 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Go Back</button>
              <button onClick={handleFinish} className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer flex gap-1.5 items-center">
                Create Character Sheet <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
