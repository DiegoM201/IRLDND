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

const QUIZ_QUESTIONS = [
  {
    question: "You're ordering takeout with a group and nobody can decide. What's your play?",
    options: [
      { text: "Take charge, make the decision yourself, and tell everyone what they're getting.", archetype: "top" },
      { text: "Agree to whatever everyone else wants and offer to wait for the delivery at the door.", archetype: "bottom" },
      { text: "Suggest a hybrid custom order that lets everyone mix and match perfectly.", archetype: "verse" },
      { text: "Lead the discussion toward a highly versatile fusion spot with absolute confidence.", archetype: "versetop" },
      { text: "Swiftly coordinate who pays, what address to use, and handle any delivery errors.", archetype: "versebottom" },
      { text: "Diplomatically suggest ordering from separate nearby spots so everyone stays happy.", archetype: "side" },
      { text: "Hypnotize the room with passionate descriptions until they order exactly what you wanted.", archetype: "powerbottom" }
    ]
  },
  {
    question: "A friendly casual board game starts arguing over a specific card rule. Your reaction is:",
    options: [
      { text: "Firmly declare how we'll proceed so the game doesn't stall, keeping the pace physical.", archetype: "top" },
      { text: "Quietly accept whichever ruling is chosen and find a clever way to play defensively.", archetype: "bottom" },
      { text: "Synthesize both views into a balanced compromise that fits the current layout.", archetype: "verse" },
      { text: "Assert the rule with executive confidence but leave room to pivot if needed.", archetype: "versetop" },
      { text: "Adapt your engine on the fly to survive under either rule interpretation without stress.", archetype: "versebottom" },
      { text: "Focus purely on social boundaries, helping players meet in the middle peacefully.", archetype: "side" },
      { text: "Captivate the room with a charming argument that gets you the best benefit.", archetype: "powerbottom" }
    ]
  },
  {
    question: "You enter a store and spot a shelf of mystery boxes or blind bag items. What do you do?",
    options: [
      { text: "Grab the most dominant looking box first, ready to claim the ultimate prize.", archetype: "top" },
      { text: "Patiently examine all packets, completely unbothered by speed or hurry.", archetype: "bottom" },
      { text: "Analyze the probabilities in your head to find the perfect multi-class option.", archetype: "verse" },
      { text: "Lead a playful hunt, convincing those around you to buy matching boxes.", archetype: "versetop" },
      { text: "Trust your quick reflexes and hand-eye coordination to pick the optimal choice.", archetype: "versebottom" },
      { text: "Propose a fun boundary: buy different ones and trade based on mutual desires.", archetype: "side" },
      { text: "Charm the store clerk into telling you which box has the heaviest, highest quality loot.", archetype: "powerbottom" }
    ]
  }
];

const AVATAR_OPTIONS = [
  { key: "king", emoji: "👑", bg: "bg-amber-950/40 border-amber-500", label: "Monarch" },
  { key: "nails", emoji: "💅", bg: "bg-pink-950/40 border-pink-500", label: "Diva" },
  { key: "shades", emoji: "🕶️", bg: "bg-zinc-800/40 border-zinc-500", label: "Cool" },
  { key: "lips", emoji: "💋", bg: "bg-red-950/40 border-red-500", label: "Fatal" },
  { key: "devil", emoji: "😈", bg: "bg-purple-950/40 border-purple-500", label: "Impish" },
  { key: "unicorn", emoji: "🦄", bg: "bg-fuchsia-950/40 border-fuchsia-500", label: "Mythic" },
  { key: "lightning", emoji: "⚡", bg: "bg-yellow-950/40 border-yellow-500", label: "Storm" },
  { key: "gem", emoji: "💎", bg: "bg-cyan-950/40 border-cyan-500", label: "Diamond" },
  { key: "peach", emoji: "🍑", bg: "bg-orange-950/40 border-orange-500", label: "Peach" },
  { key: "fire", emoji: "🔥", bg: "bg-red-900/40 border-orange-500", label: "Fierce" },
  { key: "rainbow", emoji: "🌈", bg: "bg-indigo-950/40 border-blue-500", label: "Pride" },
  { key: "cowboy", emoji: "🤠", bg: "bg-yellow-900/40 border-yellow-700", label: "Outlaw" },
  { key: "wiz-boy", emoji: "🧙‍♂️", bg: "bg-purple-950/40 border-purple-500", label: "Mage" },
  { key: "knight", emoji: "🛡️", bg: "bg-slate-800/40 border-slate-400", label: "Defender" },
  { key: "rogue", emoji: "🥷", bg: "bg-emerald-950/40 border-emerald-500", label: "Infiltrator" }
];

export default function Wizard({ onComplete, availableArchetypes, availableRaces, onCancel, showCancelButton }: WizardProps) {
  const [step, setStep] = useState<number>(1);
  const [mode, setMode] = useState<" quiz" | "direct" | null>(null);
  
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  
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

  const handleSelectQuizOption = (archetype: string) => {
    setQuizScores(prev => ({ ...prev, [archetype]: (prev[archetype] || 0) + 1 }));

    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      const finalScores = { ...quizScores, [archetype]: (quizScores[archetype] || 0) + 1 };
      let winner = availableArchetypes[0]?.id || "rules-lawyer";
      let highestScore = 0;
      Object.entries(finalScores).forEach(([arch, score]) => {
        const scoreVal = score as number;
        if (scoreVal > highestScore) {
          highestScore = scoreVal;
          winner = arch;
        }
      });

      setSelectedArchetype(winner);
      const matched = availableArchetypes.find(a => a.id === winner);
      if (matched) {
        setHighestStat(matched.highest || "intelligence");
        setLowestStat(matched.lowest || "charisma");
      }
      setMode("direct");
      setStep(1);
    }
  };

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
      const baseStats = getInitialStandardArray(highestStat, lowestStat);
      setCustomStats(baseStats);
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      setMode(null);
      setQuizIndex(0);
      setQuizScores({});
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

  const renderIcon = (iconName: string, className = "w-5 h-5 text-yellow-400", style?: React.CSSProperties) => {
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
    <div className="max-w-3xl mx-auto px-4 py-8" id="wizard-container">
      {showCancelButton && onCancel && (
        <button onClick={onCancel} className="mb-4 flex items-center gap-1 text-xs text-zinc-500 hover:text-white bg-zinc-950 px-2.5 py-1.5 rounded border border-zinc-850 cursor-pointer">
          <X className="w-3.5 h-3.5" /> Close Creation Roster
        </button>
      )}

      <div className="text-center mb-10">
        <h1 className="text-4xl font-display font-bold tracking-tight text-white mb-2">🔮 IRL CHARACTER GENERATOR</h1>
        <p className="text-zinc-400 text-sm max-w-lg mx-auto">Map your actual habits, triumphs, and flaws into a Tabletop RPG layout.</p>
        
        {mode && (
          <div className="flex justify-center items-center gap-1.5 mt-8 max-w-md mx-auto">
            {Array.from({ length: 4 }).map((_, idx) => (
              <React.Fragment key={idx}>
                <div className={`h-1.5 rounded-full transition-all ${step > idx ? "bg-amber-500 w-12" : "bg-zinc-800 w-6"}`} />
                {idx < 3 && <div className={`h-[1px] w-4 ${step > idx + 1 ? "bg-amber-600" : "bg-zinc-800"}`} />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {!mode ? (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <button onClick={() => setMode(" quiz")} className="flex flex-col items-center justify-center p-8 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-amber-500 transition-all text-center cursor-pointer group">
            <Dice5 className="w-7 h-7 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-display font-semibold text-white mb-2">Take the IRL Quiz</h3>
            <p className="text-zinc-400 text-sm max-w-xs">Answer 3 scenarios to auto-sort yourself into your archetypal party framework.</p>
          </button>
          <button onClick={() => { setMode("direct"); setStep(1); }} className="flex flex-col items-center justify-center p-8 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-amber-500 transition-all text-center cursor-pointer group">
            <User className="w-7 h-7 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-display font-semibold text-white mb-2">Manual Character Design</h3>
            <p className="text-zinc-400 text-sm max-w-xs">Skip the trial and assemble your raw modifiers immediately.</p>
          </button>
        </div>
      ) : (
        <div>
          {step === 1 && mode === " quiz" && (
            <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl">
              <h2 className="text-2xl font-display font-bold text-white mb-6">{QUIZ_QUESTIONS[quizIndex].question}</h2>
              <div className="space-y-3">
                {QUIZ_QUESTIONS[quizIndex].options.map((option, keyId) => (
                  <button key={keyId} onClick={() => handleSelectQuizOption(option.archetype)} className="w-full text-left p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all cursor-pointer block text-sm text-zinc-100">
                    {option.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && mode === "direct" && (
            <div className="flex flex-col gap-6">
              <div className="grid md:grid-cols-2 gap-4">
                {availableArchetypes.map((theme) => {
                  const isSelected = selectedArchetype === theme.id;
                  const itemColor = theme.color || "#e4e4e7";
                  return (
                    <div 
                      key={theme.id} 
                      onClick={() => handleArchetypeSelectDirect(theme.id)} 
                      className="p-5 rounded-xl border transition-all cursor-pointer"
                      style={{ 
                        borderColor: isSelected ? itemColor : "#27272a",
                        backgroundColor: isSelected ? `${itemColor}15` : "rgba(24, 24, 27, 0.6)"
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        {renderIcon(theme.icon, "w-5 h-5", isSelected ? { color: itemColor } : { color: "#71717a" })}
                        {isSelected && (
                          <span 
                            className="text-black text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase font-extrabold"
                            style={{ backgroundColor: itemColor }}
                          >
                            Class Active
                          </span>
                        )}
                      </div>
                      <h4 
                        className="font-display font-extrabold text-white text-base mb-1"
                        style={{ color: isSelected ? itemColor : "#ffffff" }}
                      >
                        {theme.name}
                      </h4>
                      <p className="text-zinc-400 text-xs leading-relaxed">{theme.tagline}</p>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-4">
                <button onClick={handlePrevStep} className="text-zinc-400 hover:text-white font-semibold text-sm flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Reset Mode</button>
                <button onClick={handleNextStep} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-6 py-2 rounded-lg font-semibold text-sm transition-all shadow-md cursor-pointer">Distribute Stats <ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-2 bg-zinc-950/40 border border-zinc-850 p-3 rounded-xl">
                <span className="text-[10px] font-mono uppercase text-zinc-500">Required Array:</span>
                {[15, 14, 13, 12, 10, 8].map(score => (
                  <span key={score} className={`text-xs font-mono font-black px-2.5 py-1 rounded-md border ${Object.values(customStats).includes(score) ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-red-950/20 text-red-400 line-through opacity-60"}`}>{score}</span>
                ))}
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex flex-col gap-3">
                <h4 className="text-xs font-mono text-amber-400 font-bold uppercase">⚡ Keyboard Scriptorium</h4>
                <div className="flex gap-2">
                  <input type="text" value={textAllocation} onChange={(e) => setTextAllocation(e.target.value)} placeholder="e.g., Charisma 15, Intelligence 14, Strength 13..." className="flex-1 bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500" />
                  <button onClick={handleParseTextAllocation} className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold text-xs rounded-lg uppercase font-mono">Scribe</button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(STAT_DESCRIPTIONS).map(([key, desc]) => {
                  const statKey = key as keyof StatBlock;
                  const value = customStats[statKey];
                  return (
                    <div key={statKey} className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-850">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-display font-bold text-white text-sm">{desc.label}</span>
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded text-green-400 bg-green-950/20">+{Math.floor((value - 10) / 2)}</span>
                      </div>
                      <select value={value} onChange={(e) => handleStandardArrayChange(statKey, parseInt(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs p-2.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer">
                        {[15, 14, 13, 12, 10, 8].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-4">
                <button onClick={handlePrevStep} className="text-zinc-400 font-semibold text-sm flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Go Back</button>
                <button onClick={handleNextStep} className="flex items-center gap-2 bg-amber-500 text-zinc-950 px-6 py-2 rounded-lg font-semibold text-sm transition-all shadow-md cursor-pointer">Custom Perks <ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6" id="wizard-step-3">
              <div className="grid md:grid-cols-2 gap-6">
                {/* AI DM Perk Synthesizer */}
                <div className="bg-zinc-900/60 border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider font-bold mb-2" style={{ color: archetypeDetails?.color || "#38bdf8" }}>🔮 AI DM Perk Synthesizer</h4>
                    <p className="text-zinc-400 text-xs leading-relaxed mb-4">Input custom real-world hobbies, hyper-fixations, or quirks to let the Dungeon Master forge bespoke passive rules for you.</p>
                    <textarea 
                      value={quirkInput} 
                      onChange={(e) => setQuirkInput(e.target.value)} 
                      placeholder="E.g., I am a web developer who lives on cold brew, stays up till 3 AM coding side projects, and hoards mechanical keyboards..." 
                      className="w-full h-24 bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-zinc-700" 
                    />
                  </div>
                  <button 
                    onClick={generatePerksFromDM} 
                    disabled={isGeneratingPerks} 
                    className="w-full px-5 py-2.5 bg-zinc-950 hover:bg-zinc-900 border text-white font-display font-semibold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    style={{ borderColor: `${archetypeDetails?.color || "#38bdf8"}50` }}
                  >
                    {isGeneratingPerks ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Wand2 className="w-4 h-4" style={{ color: archetypeDetails?.color || "#38bdf8" }} />} Synthesize AI Perks
                  </button>
                </div>

                {/* Manual Perk Builder Matrix */}
                <div className="bg-zinc-900/60 border border-zinc-850 p-5 rounded-2xl flex flex-col gap-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider font-bold" style={{ color: archetypeDetails?.color || "#a855f7" }}>📜 Scribe Custom Perk Matrix</h4>
                  <div className="grid grid-cols-2 gap-2.5 text-left">
                    <div>
                      <label className="block text-[9px] uppercase font-mono text-zinc-500 font-bold mb-0.5">Perk Title</label>
                      <input 
                        type="text" 
                        value={perkTitle} 
                        onChange={(e) => setPerkTitle(e.target.value)} 
                        placeholder="e.g., Rule Shark" 
                        className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-xs text-white focus:outline-none focus:border-zinc-700" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-mono text-zinc-500 font-bold mb-0.5">Trigger Condition</label>
                      <input 
                        type="text" 
                        value={perkTrigger} 
                        onChange={(e) => setPerkTrigger(e.target.value)} 
                        placeholder="e.g., During line debates" 
                        className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-xs text-white focus:outline-none focus:border-zinc-700" 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[9px] uppercase font-mono text-zinc-500 font-bold mb-0.5">Modifier/Stat Effect</label>
                      <input 
                        type="text" 
                        value={perkEffect} 
                        onChange={(e) => setPerkEffect(e.target.value)} 
                        placeholder="e.g., +2 on Intelligence checks when referencing rulebook line 4" 
                        className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-xs text-white focus:outline-none focus:border-zinc-700" 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[9px] uppercase font-mono text-zinc-500 font-bold mb-0.5">Humor Description</label>
                      <input 
                        type="text" 
                        value={perkDescription} 
                        onChange={(e) => setPerkDescription(e.target.value)} 
                        placeholder="e.g., You read rules like holy scriptures. Friends sigh, but yield." 
                        className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-xs text-white focus:outline-none focus:border-zinc-700" 
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
                    className="w-full mt-1.5 py-2 text-black font-mono text-xs font-extrabold rounded-lg uppercase cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95"
                    style={{ backgroundColor: archetypeDetails?.color || "#a855f7" }}
                  >
                    + Scribe Perk
                  </button>
                </div>
              </div>

              {/* Roster list */}
              <div>
                <h3 className="text-sm font-mono uppercase text-zinc-400 font-bold mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: archetypeDetails?.color }} /> Active Perk Ledger ({generatedPerks.length})
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {generatedPerks.map((p, idx) => (
                    <div key={idx} className="p-4 bg-zinc-900/40 border rounded-xl relative group text-left" style={{ borderColor: `${archetypeDetails?.color || "#f43f5e"}30` }}>
                      <button 
                        onClick={() => setGeneratedPerks(generatedPerks.filter((_, i) => i !== idx))}
                        className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-red-400 cursor-pointer opacity-40 group-hover:opacity-100 transition-opacity text-xs"
                        title="Discard Perk"
                      >
                        ✕
                      </button>
                      <h4 className="font-display font-bold text-white text-sm mb-1">{p.title}</h4>
                      <p className="text-xs font-mono font-bold mb-1" style={{ color: archetypeDetails?.color || "#f43f5e" }}>{p.effect}</p>
                      <p className="text-zinc-300 text-[10.5px] font-mono leading-relaxed mb-0.5">
                        <span className="text-zinc-500 uppercase text-[9px] font-bold">Trigger:</span> {p.trigger}
                      </p>
                      <p className="text-zinc-400 text-xs italic">"{p.description}"</p>
                    </div>
                  ))}
                  {generatedPerks.length === 0 && (
                    <div className="md:col-span-2 py-8 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-500 text-xs">
                      No passive perks listed yet. Use AI or Scribe Custom Perk Matrix to add some!
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <button onClick={handlePrevStep} className="text-zinc-400 font-semibold text-sm flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Go Back</button>
                <button onClick={handleNextStep} className="flex items-center gap-2 text-zinc-950 px-6 py-2 rounded-lg font-semibold text-sm transition-all shadow-md cursor-pointer" style={{ backgroundColor: archetypeDetails?.color || "#f43f5e" }}>Refine Identity <ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-6" id="wizard-step-4">
              <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl flex flex-col gap-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Adventurer Name</label>
                    <input type="text" value={charName} onChange={(e) => setCharName(e.target.value)} placeholder="Diego the Coffee Sorcerer" className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-amber-500" />
                    {nameError && <p className="text-red-400 text-xs mt-1">⚠️ {nameError}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Guild / Faction Name</label>
                    <input type="text" value={faction} onChange={(e) => setFaction(e.target.value)} placeholder="Tech Room Syndicate" className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-amber-500" />
                  </div>
                </div>

                {/* 🏳️‍🌈 Selection Section for Queer Blueprint Races */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest">Select Community Race Blueprint</label>
                    <span className="text-[10px] text-green-400 font-mono font-bold">Adds racial bonuses directly!</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-1">
                    {availableRaces.map((r) => {
                      const isSelected = selectedRace === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => setSelectedRace(r.id)}
                          className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected ? "bg-amber-500/10 border-amber-500" : "bg-zinc-950/80 border-zinc-850 hover:border-zinc-700"
                          }`}
                          title={r.description}
                        >
                          <div>
                            <span className="text-xl block mb-1">{r.icon || "✨"}</span>
                            <span className="text-xs block font-bold text-white">{r.name}</span>
                            <span className="text-[9px] block text-zinc-500 mt-0.5 line-clamp-1">{r.tagline}</span>
                          </div>
                          {/* 🌟 Ability modifier badge tracker */}
                          <div className="text-[9px] text-green-400 font-mono mt-1.5 bg-green-950/20 py-0.5 rounded border border-green-900/10">
                            {Object.entries(r.bonuses || {}).map(([sKey, bVal]) => `+${bVal}${sKey.substring(0,3).toUpperCase()}`).join(" ")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex border-b border-zinc-800 gap-4 mb-4">
                    <button 
                      type="button"
                      onClick={() => setAvatarMode("emoji")} 
                      className={`pb-2 text-xs font-mono font-bold cursor-pointer transition-all ${avatarMode === "emoji" ? "text-white border-b-2" : "text-zinc-500 hover:text-zinc-300"}`}
                      style={{ borderBottomColor: avatarMode === "emoji" ? (archetypeDetails?.color || "#f43f5e") : "transparent" }}
                    >
                      🛡️ Emoji Node Roster
                    </button>
                    <button 
                      type="button"
                      onClick={() => setAvatarMode("scriptorium")} 
                      className={`pb-2 text-xs font-mono font-bold cursor-pointer transition-all ${avatarMode === "scriptorium" ? "text-white border-b-2" : "text-zinc-500 hover:text-zinc-300"}`}
                      style={{ borderBottomColor: avatarMode === "scriptorium" ? (archetypeDetails?.color || "#f43f5e") : "transparent" }}
                    >
                      🖼️ Image Scriptorium
                    </button>
                  </div>

                  {avatarMode === "emoji" ? (
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Choose Persona Emoji Node</label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-1">
                        {AVATAR_OPTIONS.map((opt) => (
                          <div 
                            key={opt.key} 
                            onClick={() => setAvatar(opt.key)} 
                            className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${avatar === opt.key ? "bg-opacity-10 border-opacity-100" : "bg-zinc-950 border-zinc-850"}`}
                            style={{ 
                              borderColor: avatar === opt.key ? (archetypeDetails?.color || "#f43f5e") : undefined,
                              backgroundColor: avatar === opt.key ? `${archetypeDetails?.color || "#f43f5e"}15` : undefined
                            }}
                          >
                            <span className="text-xl block mb-0.5">{opt.emoji}</span>
                            <span className="text-[9px] block text-zinc-400 font-semibold">{opt.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-6 bg-zinc-950/50 border border-zinc-850 p-4 rounded-xl text-left">
                      {/* Left: Upload and Sliders */}
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">Local Image File</label>
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
                            className="text-xs text-zinc-400 block w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-mono file:font-black file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer" 
                          />
                        </div>

                        <div className="space-y-2 font-mono text-[10px] text-zinc-400 mt-2">
                          <div>
                            <div className="flex justify-between mb-0.5">
                              <span>SCALE: {avatarScale.toFixed(1)}x</span>
                              <span className="text-zinc-600">0.5x - 3.0x</span>
                            </div>
                            <input 
                              type="range" 
                              min="0.5" 
                              max="3.0" 
                              step="0.1" 
                              value={avatarScale} 
                              onChange={(e) => setAvatarScale(parseFloat(e.target.value))} 
                              className="w-full accent-emerald-500 bg-zinc-800 h-1 rounded" 
                            />
                          </div>

                          <div>
                            <div className="flex justify-between mb-0.5">
                              <span>ROTATION: {avatarRotate}°</span>
                              <span className="text-zinc-600">0° - 360°</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="360" 
                              value={avatarRotate} 
                              onChange={(e) => setAvatarRotate(parseInt(e.target.value))} 
                              className="w-full accent-emerald-500 bg-zinc-800 h-1 rounded" 
                            />
                          </div>

                          <div>
                            <div className="flex justify-between mb-0.5">
                              <span>X OFFSET: {avatarX}px</span>
                              <span className="text-zinc-600">-100px - 100px</span>
                            </div>
                            <input 
                              type="range" 
                              min="-100" 
                              max="100" 
                              value={avatarX} 
                              onChange={(e) => setAvatarX(parseInt(e.target.value))} 
                              className="w-full accent-emerald-500 bg-zinc-800 h-1 rounded" 
                            />
                          </div>

                          <div>
                            <div className="flex justify-between mb-0.5">
                              <span>Y OFFSET: {avatarY}px</span>
                              <span className="text-zinc-600">-100px - 100px</span>
                            </div>
                            <input 
                              type="range" 
                              min="-100" 
                              max="100" 
                              value={avatarY} 
                              onChange={(e) => setAvatarY(parseInt(e.target.value))} 
                              className="w-full bg-zinc-800 h-1" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Scriptorium Preview */}
                      <div className="flex flex-col items-center justify-center p-3 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/80">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-2 font-bold">Live Token Crop Target</span>
                        <div 
                          className="relative w-32 h-32 rounded-full border-2 overflow-hidden flex items-center justify-center bg-zinc-900"
                          style={{ borderColor: archetypeDetails?.color || "#f43f5e" }}
                        >
                          {uploadedBase64 ? (
                            <img 
                              src={uploadedBase64} 
                              alt="Scriptorium Source Avatar" 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover pointer-events-none select-none max-w-full max-h-full"
                              style={{ transform: `scale(${avatarScale}) translate(${avatarX}px, ${avatarY}px) rotate(${avatarRotate}deg)` }}
                            />
                          ) : (
                            <div className="text-center p-2 flex flex-col items-center gap-1">
                              <span className="text-3xl">🥷</span>
                              <span className="text-[8px] font-mono text-zinc-600">Pending Upload...</span>
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
                            className="mt-2 text-[9px] font-mono text-zinc-500 hover:text-white underline cursor-pointer"
                          >
                            Reset Transform Controls
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <button onClick={handlePrevStep} className="text-zinc-400 font-semibold text-sm flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Go Back</button>
                <button onClick={handleFinish} className="bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg cursor-pointer">Generate Character Sheet 📜</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}