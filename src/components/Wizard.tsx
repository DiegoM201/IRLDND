import React, { useState } from "react";
import { 
  BookOpen, Flame, Shield, Sparkles, Coins, Calculator, 
  ChevronRight, ChevronLeft, User, Brain, 
  Heart, Eye, Activity, MessageSquare, Dumbbell, Wand2, 
  Dice5, Check, Loader2 
} from "lucide-react";
import { ARCHETYPES, STAT_DESCRIPTIONS, StatBlock, CharacterSheet, Perk, RACES } from "../types";

interface WizardProps {
  onComplete: (sheet: CharacterSheet) => void;
}

const QUIZ_QUESTIONS = [
  {
    question: "You're ordering takeout with a group and nobody can decide. What's your play?",
    options: [
      { text: "Double-check everyone's dietary constraints, budget limits, and create a shared spreadsheet.", archetype: "min-maxer" },
      { text: "Suggest food roulette: Pick a place at random, and force the loser to pay.", archetype: "instigator" },
      { text: "Quietly order from your trusted favorite spot that has never disappointed you.", archetype: "tactical-turtler" },
      { text: "Do whatever is funniest: suggest ordering only appetizers or a custom 15-patty burger.", archetype: "wildcard" },
      { text: "Whip out a rulebook-style argument about why pizza is the most mathematically democratic food.", archetype: "rules-lawyer" },
      { text: "Look up active coupons, discount codes, and negotiate who gets the leftover boxes.", archetype: "loot-goblin" }
    ]
  },
  {
    question: "A friendly casual board game starts arguing over a specific card rule. Your reaction is:",
    options: [
      { text: "Pull up the 45-page official FAQ document PDF on your phone and read line 4 of clause B.", archetype: "rules-lawyer" },
      { text: "Fuel the debate on purpose to see who gets the most defensive.", archetype: "instigator" },
      { text: "Silently eat snacks, let them argue, and use the extra time to plan your next 3 moves.", archetype: "tactical-turtler" },
      { text: "Suggest a sudden house rule that makes the game 3 times more chaotic.", archetype: "wildcard" },
      { text: "Quickly summarize previous matches to prove who actually benefits from the card.", archetype: "min-maxer" },
      { text: "Offer to let it slide only if the player trades you their extra resource token.", archetype: "loot-goblin" }
    ]
  },
  {
    question: "You enter a store and spot a shelf of mystery boxes or blind bag items. What do you do?",
    options: [
      { text: "Check community forums on your phone to find the exact batch weights to isolate the rare one.", archetype: "min-maxer" },
      { text: "Shake all of them loudly to see which one sounds the most broken.", archetype: "wildcard" },
      { text: "Ignore them entirely. You have a strict pre-budgeted itinerary item to buy.", archetype: "tactical-turtler" },
      { text: "Convince the clerk to let you feel the packaging, claiming it's for 'research purposes'.", archetype: "loot-goblin" },
      { text: "Briefly explain the exact scammy probabilities of loot pools to whoever is listening.", archetype: "rules-lawyer" },
      { text: "Buy one, open it, and immediately mock your friend if they got a worse pull.", archetype: "instigator" }
    ]
  }
];

const AVATAR_OPTIONS = [
  { key: "wiz-boy", emoji: "🧙‍♂️", bg: "bg-purple-950/40 border-purple-500", label: "Mage" },
  { key: "knight", emoji: "🛡️", bg: "bg-slate-800/40 border-slate-400", label: "Defender" },
  { key: "rogue", emoji: "🥷", bg: "bg-emerald-950/40 border-emerald-500", label: "Infiltrator" },
  { key: "wild", emoji: "🦁", bg: "bg-amber-950/40 border-amber-500", label: "Beast" },
  { key: "goblin", emoji: "👺", bg: "bg-red-950/40 border-red-500", label: "Goblin-mode" },
  { key: "intellect", emoji: "🧠", bg: "bg-blue-950/40 border-blue-500", label: "AI Oracle" },
  { key: "coder", emoji: "💻", bg: "bg-zinc-800/40 border-cyan-500", label: "Technomancer" },
  { key: "coffee", emoji: "☕", bg: "bg-amber-900/40 border-yellow-600", label: "Caffeine Knight" }
];

export default function Wizard({ onComplete }: WizardProps) {
  const [step, setStep] = useState<number>(1);
  const [mode, setMode] = useState<" quiz" | "direct" | null>(null);
  
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  
  const [selectedArchetype, setSelectedArchetype] = useState<string>("rules-lawyer");
  const [selectedRace, setSelectedRace] = useState<string>("twink"); // 🌟 Race picker state
  const [highestStat, setHighestStat] = useState<keyof StatBlock>("intelligence");
  const [lowestStat, setLowestStat] = useState<keyof StatBlock>("charisma");
  
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

  const archetypeDetails = ARCHETYPES.find(a => a.id === selectedArchetype) || ARCHETYPES[0];

  const handleSelectQuizOption = (archetype: string) => {
    setQuizScores(prev => ({ ...prev, [archetype]: (prev[archetype] || 0) + 1 }));

    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      const finalScores = { ...quizScores, [archetype]: (quizScores[archetype] || 0) + 1 };
      let winner = "rules-lawyer";
      let highestScore = 0;
      Object.entries(finalScores).forEach(([arch, score]) => {
        const scoreVal = score as number;
        if (scoreVal > highestScore) {
          highestScore = scoreVal;
          winner = arch;
        }
      });

      setSelectedArchetype(winner);
      const matched = ARCHETYPES.find(a => a.id === winner);
      if (matched) {
        setHighestStat(matched.highest);
        setLowestStat(matched.lowest);
      }
      setMode("direct");
      setStep(1);
    }
  };

  const handleArchetypeSelectDirect = (id: string) => {
    setSelectedArchetype(id);
    const matched = ARCHETYPES.find(a => a.id === id);
    if (matched) {
      setHighestStat(matched.highest);
      setLowestStat(matched.lowest);
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
          archetype: archetypeDetails.name,
          race: RACES.find(r => r.id === selectedRace)?.name || "Twink", // 🌟 Connects race to prompt
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
    onComplete({
      name: charName,
      role: archetypeDetails.name,
      race: RACES.find(r => r.id === selectedRace)?.name || "Twink", // 🌟 Package chosen race
      level: 1,
      xp: 0,
      stats: customStats,
      perks: generatedPerks,
      customDetails: quirkInput,
      avatar: avatar,
      faction: faction || "Modern Adventurers"
    });
  };

  const renderIcon = (iconName: string, className = "w-5 h-5 text-yellow-400") => {
    switch (iconName) {
      case "BookOpen": return <BookOpen className={className} />;
      case "Flame": return <Flame className={className} />;
      case "Shield": return <Shield className={className} />;
      case "Sparkles": return <Sparkles className={className} />;
      case "Coins": return <Coins className={className} />;
      case "Calculator": return <Calculator className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" id="wizard-container">
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
                {ARCHETYPES.map((theme) => {
                  const isSelected = selectedArchetype === theme.id;
                  return (
                    <div key={theme.id} onClick={() => handleArchetypeSelectDirect(theme.id)} className={`p-5 rounded-xl border transition-all cursor-pointer ${isSelected ? "bg-amber-500/10 border-amber-500" : "bg-zinc-900/60 border-zinc-800"}`}>
                      <div className="flex justify-between items-start mb-2">
                        {renderIcon(theme.icon, isSelected ? "text-amber-400" : "text-zinc-400")}
                        {isSelected && <span className="bg-amber-500 text-black text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold">Class Active</span>}
                      </div>
                      <h4 className="font-display font-bold text-white text-base mb-1">{theme.name}</h4>
                      <p className="text-zinc-400 text-xs">{theme.tagline}</p>
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
                  <input type="text" value={textAllocation} onChange={(e) => setTextAllocation(e.target.value)} placeholder="e.g., Charisma 15, Intelligence 14, Strength 13..." className="flex-1 bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-white focus:outline-none" />
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
            <div className="flex flex-col gap-6">
              <div className="bg-zinc-900/60 border border-zinc-850 p-5 rounded-2xl flex flex-col gap-4">
                <textarea value={quirkInput} onChange={(e) => setQuirkInput(e.target.value)} placeholder="E.g., I am a web developer who lives on iced espresso and sleeps through alarms..." className="w-full h-20 bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-amber-500" />
                <button onClick={generatePerksFromDM} disabled={isGeneratingPerks} className="w-full px-5 py-2.5 bg-amber-500/10 border border-amber-500/40 text-amber-300 font-display font-semibold rounded-lg text-sm flex items-center justify-center gap-2 cursor-pointer">
                  {isGeneratingPerks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Synthesize Perks with AI
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {generatedPerks.map((p, idx) => (
                  <div key={idx} className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl">
                    <h4 className="font-display font-bold text-white text-sm mb-1">{p.title}</h4>
                    <p className="text-green-400 text-xs font-mono mb-1">{p.effect}</p>
                    <p className="text-zinc-400 text-xs italic">"{p.description}"</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4">
                <button onClick={handlePrevStep} className="text-zinc-400 font-semibold text-sm flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Go Back</button>
                <button onClick={handleNextStep} className="flex items-center gap-2 bg-amber-500 text-zinc-950 px-6 py-2 rounded-lg font-semibold text-sm transition-all shadow-md cursor-pointer">Refine Identity <ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-6" id="wizard-step-4">
              <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl flex flex-col gap-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Adventurer Name</label>
                    <input type="text" value={charName} onChange={(e) => setCharName(e.target.value)} placeholder="Diego the Coffee Sorcerer" className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-200" />
                    {nameError && <p className="text-red-400 text-xs mt-1">⚠️ {nameError}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Guild / Faction Name</label>
                    <input type="text" value={faction} onChange={(e) => setFaction(e.target.value)} placeholder="Tech Room Syndicate" className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-200" />
                  </div>
                </div>

                {/* 🏳️‍🌈 Visual Selection Section for Queer Blueprint Races */}
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Select Community Race Blueprint</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-1">
                    {RACES.map((r) => {
                      const isSelected = selectedRace === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => setSelectedRace(r.id)}
                          className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                            isSelected ? "bg-amber-500/10 border-amber-500" : "bg-zinc-950/80 border-zinc-850 hover:border-zinc-700"
                          }`}
                          title={r.description}
                        >
                          <span className="text-xl block mb-1">{r.icon}</span>
                          <span className="text-xs block font-bold text-white">{r.name}</span>
                          <span className="text-[9px] block text-zinc-500 mt-0.5 line-clamp-1">{r.tagline}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Choose Avatar Class</label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {AVATAR_OPTIONS.map((opt) => (
                      <div key={opt.key} onClick={() => setAvatar(opt.key)} className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${avatar === opt.key ? "bg-amber-500/10 border-amber-500" : "bg-zinc-950/80 border-zinc-850"}`}>
                        <span className="text-2xl block mb-1">{opt.emoji}</span>
                        <span className="text-[10px] block text-zinc-400">{opt.label}</span>
                      </div>
                    ))}
                  </div>
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