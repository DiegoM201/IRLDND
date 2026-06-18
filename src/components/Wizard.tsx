import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  BookOpen, Flame, Shield, Sparkles, Coins, Calculator, 
  ChevronRight, ChevronLeft, User, RefreshCw, Brain, 
  Heart, Eye, Activity, MessageSquare, Dumbbell, Wand2, 
  Dice5, Coffee, Check, Loader2 
} from "lucide-react";
import { ARCHETYPES, STAT_DESCRIPTIONS, StatBlock, CharacterSheet, Perk } from "../types";

interface WizardProps {
  onComplete: (sheet: CharacterSheet) => void;
}

// Interactive quiz questions to determine archetype
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
  
  // State for step calculations
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  
  const [selectedArchetype, setSelectedArchetype] = useState<string>("rules-lawyer");
  const [highestStat, setHighestStat] = useState<keyof StatBlock>("intelligence");
  const [lowestStat, setLowestStat] = useState<keyof StatBlock>("charisma");
  
  // Standard Array initial assigner
  const getInitialStandardArray = (high: keyof StatBlock, low: keyof StatBlock): StatBlock => {
    const keys: (keyof StatBlock)[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
    const otherKeys = keys.filter(k => k !== high && k !== low);
    const initial: Partial<StatBlock> = {};
    initial[high] = 15;
    initial[low] = 8;
    // Map remaining 14, 13, 12, 10
    const remainingVals = [14, 13, 12, 10];
    otherKeys.forEach((k, idx) => {
      initial[k] = remainingVals[idx];
    });
    return initial as StatBlock;
  };

  // Custom points distributions
  const [customStats, setCustomStats] = useState<StatBlock>(() => {
    return {
      strength: 13,
      dexterity: 12,
      constitution: 10,
      intelligence: 15,
      wisdom: 14,
      charisma: 8
    };
  });

  const [textAllocation, setTextAllocation] = useState("");
  const [parseResult, setParseResult] = useState<{ success: boolean; text: string } | null>(null);

  // AI Perks State
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
      description: "Under maximum panic, your reflexes and focus are unmatched. If there are weeks left, you are practically paralyzed.",
      trigger: "Assignments/works due very soon"
    }
  ]);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Profile details
  const [charName, setCharName] = useState<string>("");
  const [nameError, setNameError] = useState<string>("");
  const [faction, setFaction] = useState<string>("Modern Adventurers");
  const [avatar, setAvatar] = useState<string>("coder");

  const archetypeDetails = ARCHETYPES.find(a => a.id === selectedArchetype) || ARCHETYPES[0];

  const handleSelectQuizOption = (archetype: string) => {
    // Update scores
    setQuizScores(prev => ({
      ...prev,
      [archetype]: (prev[archetype] || 0) + 1
    }));

    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      // Calculate winner
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
      setMode("direct"); // Switch to direct layout to let them see recommendation
      setStep(1); // Stay on step 1 with suggested chosen
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
      // Initialize stats to a valid standard array based on archetype highest/lowest seeds
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

  // Swaps attribute values to maintain strict standard array compliance
  const handleStandardArrayChange = (targetStat: keyof StatBlock, newValue: number) => {
    const currentValue = customStats[targetStat];
    if (currentValue === newValue) return;
    
    // Find which other stat currently has the value we want to take
    const otherStat = (Object.keys(customStats) as (keyof StatBlock)[]).find(
      key => customStats[key] === newValue
    );
    
    setCustomStats(prev => {
      const next = { ...prev };
      next[targetStat] = newValue;
      if (otherStat) {
        next[otherStat] = currentValue;
      }
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
      str: "strength", strength: "strength",
      dex: "dexterity", dexterity: "dexterity",
      con: "constitution", constitution: "constitution",
      int: "intelligence", intelligence: "intelligence", intellect: "intelligence",
      wis: "wisdom", wisdom: "wisdom",
      cha: "charisma", charisma: "charisma"
    };

    // Words lookup to find match pairings
    const allocated: Partial<StatBlock> = {};
    const usedScores = new Set<number>();

    // Search text for stats and check for any nearby numbers (15, 14, 13, 12, 10, 8)
    const searchKeys = Object.keys(statMapping);
    searchKeys.forEach(key => {
      const idx = text.toLowerCase().indexOf(key);
      if (idx !== -1) {
        // Grab local text context of 20 characters on either side
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
        text: "Could not decode any standard array parameters (15, 14, 13, 12, 10, or 8) associated with stat names. Example format: 'Strength 15, Dex 14, Con 13, Int 12, Wis 10, Cha 8'."
      });
      return;
    }

    // Allocate leftover stats using unassigned scores to assure no duplicates
    const standardScores = [15, 14, 13, 12, 10, 8];
    const unusedScores = standardScores.filter(score => !usedScores.has(score));
    const allStats: (keyof StatBlock)[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
    const unparsedStats = allStats.filter(stat => !allocated[stat]);

    const finalStats = { ...customStats };
    parsedKeys.forEach(k => {
      finalStats[k] = allocated[k]!;
    });

    unparsedStats.forEach((stat, index) => {
      if (index < unusedScores.length) {
        finalStats[stat] = unusedScores[index];
      }
    });

    setCustomStats(finalStats);
    setParseResult({
      success: true,
      text: `Successfully scribed: ${parsedKeys.map(k => `${STAT_DESCRIPTIONS[k].label} (Score: ${allocated[k]})`).join(", ")}!` + 
            (unparsedStats.length > 0 ? ` Automatically completed the rest of your standard array assignment: ${unparsedStats.map(k => `${STAT_DESCRIPTIONS[k].label} ➔ ${finalStats[k]}`).join(", ")}.` : "")
    });
  };

  // Call server to generate custom perks using Gemini
  const generatePerksFromDM = async () => {
    setIsGeneratingPerks(true);
    setGenerationError(null);
    try {
      const response = await fetch("/api/generate-perks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archetype: archetypeDetails.name,
          highestStat,
          lowestStat,
          customInput: quirkInput,
          stats: customStats
        })
      });
      if (!response.ok) throw new Error("Our Dungeon Master is taking a coffee break. Using custom default system perks!");
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setGeneratedPerks(data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      setGenerationError(err.message || "Failed to generate customized perks.");
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
      level: 1,
      xp: 0,
      stats: customStats,
      perks: generatedPerks,
      customDetails: quirkInput,
      avatar: avatar,
      faction: faction || "Freelance Party"
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
      case "Brain": return <Brain className={className} />;
      case "Heart": return <Heart className={className} />;
      case "Eye": return <Eye className={className} />;
      case "Activity": return <Activity className={className} />;
      case "MessageSquare": return <MessageSquare className={className} />;
      case "Dumbbell": return <Dumbbell className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" id="wizard-container">
      {/* Header and Progress Indicator */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-display font-bold text-center tracking-tight text-white mb-2" id="wizard-title">
          🔮 IRL CHARACTER GENERATOR
        </h1>
        <p className="text-zinc-400 font-sans max-w-lg mx-auto text-sm">
          Map your actual quirky personality, daily triumphs, and minor human flaws into a fully functioning Tabletop RPG Character Sheet.
        </p>
        
        {mode && (
          <div className="flex justify-center items-center gap-1.5 mt-8 max-w-md mx-auto" id="progress-bar">
            {Array.from({ length: 4 }).map((_, idx) => (
              <React.Fragment key={idx}>
                <div className={`h-1.5 rounded-full transition-all duration-300 ${step > idx ? "bg-amber-500 w-12" : "bg-zinc-800 w-6"}`} />
                {idx < 3 && <div className={`h-[1px] w-4 ${step > idx + 1 ? "bg-amber-600" : "bg-zinc-800"}`} />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Main Mode Picker (Quiz vs Direct Selection) */}
      {!mode ? (
        <div className="grid md:grid-cols-2 gap-6 mt-6" id="welcome-picker">
          <button 
            id="start-quiz-btn"
            onClick={() => setMode(" quiz")}
            className="flex flex-col items-center justify-center p-8 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-amber-500 hover:bg-zinc-900/90 transition-all text-center group cursor-pointer"
          >
            <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Dice5 className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-xl font-display font-semibold text-white mb-2">Take the IRL Quiz</h3>
            <p className="text-zinc-400 text-sm max-w-xs">
              Answer 3 short situations to auto-sort yourself into your archetypal role in the friendly guild.
            </p>
          </button>

          <button 
            id="start-direct-btn"
            onClick={() => {
              setMode("direct");
              setStep(1);
            }}
            className="flex flex-col items-center justify-center p-8 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-amber-500 hover:bg-zinc-900/90 transition-all text-center group cursor-pointer"
          >
            <div className="w-14 h-14 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <User className="w-7 h-7 text-cyan-400" />
            </div>
            <h3 className="text-xl font-display font-semibold text-white mb-2">Manual Character Design</h3>
            <p className="text-zinc-400 text-sm max-w-xs">
              Know exactly who you are? Skip the trial and assemble your stats and traits immediately.
            </p>
          </button>
        </div>
      ) : (
        <div id="step-content">
          {/* Step 1: Choose Archetype (Either Quiz ongoing or Selector) */}
          {step === 1 && mode === " quiz" && (
            <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl" id="quiz-step-pane">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-mono tracking-widest text-amber-500">EXPERIMENT STAGE {quizIndex + 1}/3</span>
                <span className="text-xs text-zinc-500">Personality Matching</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-6 leading-snug">
                {QUIZ_QUESTIONS[quizIndex].question}
              </h2>
              <div className="space-y-3.5">
                {QUIZ_QUESTIONS[quizIndex].options.map((option, keyId) => (
                  <button
                    key={keyId}
                    id={`quiz-option-${keyId}`}
                    onClick={() => handleSelectQuizOption(option.archetype)}
                    className="w-full text-left p-4 bg-zinc-900/90 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-xl hover:border-zinc-700 transition-all cursor-pointer block hover:translate-x-1 duration-200"
                  >
                    <span className="text-sm font-sans text-zinc-100">{option.text}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8 pt-4 border-t border-zinc-800">
                <button 
                  onClick={handlePrevStep}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" /> Cancel Quiz
                </button>
              </div>
            </div>
          )}

          {step === 1 && mode === "direct" && (
            <div id="direct-step-1">
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">Choose Your Friend Group Archetype</h2>
                  <p className="text-zinc-400 text-sm">Select the title that captures your general vibe, default instincts, or tactical patterns.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4" id="archetypes-selector">
                  {ARCHETYPES.map((theme) => {
                    const isSelected = selectedArchetype === theme.id;
                    return (
                      <div 
                        key={theme.id}
                        id={`archetype-${theme.id}`}
                        onClick={() => handleArchetypeSelectDirect(theme.id)}
                        className={`p-5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                          isSelected 
                            ? "bg-amber-500/10 border-amber-500/80 ring-1 ring-amber-500/30" 
                            : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/90"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className={`p-2.5 rounded-lg ${isSelected ? "bg-amber-500/20" : "bg-zinc-800"}`}>
                            {renderIcon(theme.icon, isSelected ? "w-5 h-5 text-amber-400" : "w-5 h-5 text-zinc-400")}
                          </div>
                          {isSelected && <span className="bg-amber-500 text-black text-[10px] font-mono tracking-wider font-extrabold px-2 py-0.5 rounded-full uppercase">Class Active</span>}
                        </div>
                        <h4 className="font-display font-bold text-white text-base mb-1">{theme.name}</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed">{theme.tagline}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Information preview of current group */}
                <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-xl" id="archetype-flavor-card">
                  <h4 className="font-display font-bold text-amber-400 text-sm uppercase tracking-wider mb-2">Class Overlord Insight</h4>
                  <p className="text-zinc-300 text-xs leading-relaxed mb-3">
                    {archetypeDetails.description}
                  </p>
                  <div className="flex items-center gap-6 text-[11px] font-mono">
                    <span className="flex items-center gap-1.5"><span className="text-zinc-500">Highest Stat Seed:</span> <span className="text-green-400 font-bold uppercase">{archetypeDetails.highest} (+4)</span></span>
                    <span className="flex items-center gap-1.5"><span className="text-zinc-500">Crit Dump Seed:</span> <span className="text-red-400 font-bold uppercase">{archetypeDetails.lowest} (-2)</span></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between mt-4">
                  <button onClick={handlePrevStep} className="flex items-center gap-1.5 text-zinc-400 hover:text-white px-4 py-2 text-sm font-semibold">
                    <ChevronLeft className="w-4 h-4" /> Reset Mode
                  </button>
                  <button onClick={handleNextStep} id="archetype-next-btn" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-6 py-2 rounded-lg font-semibold text-sm transition-all shadow-md cursor-pointer hover:translate-x-1 duration-150">
                    Distribute Stats <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Stats Tuning */}
          {step === 2 && (
            <div className="flex flex-col gap-6" id="wizard-step-2">
              <div>
                <h2 className="text-2xl font-display font-black text-white">IRL Core Stat Framework</h2>
                <p className="text-zinc-400 text-sm">
                  D&D's classic <strong>Standard Array</strong> demands exactly one copy of each score: <strong className="text-amber-400 font-mono">15, 14, 13, 12, 10, 8</strong>. Assign them to map your real-world capabilities!
                </p>
              </div>

              {/* Standard Array Badges */}
              <div className="flex flex-wrap items-center gap-2 bg-zinc-950/40 border border-zinc-850 p-3 rounded-xl" id="available-scores">
                <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Required Scores:</span>
                {[15, 14, 13, 12, 10, 8].map(score => {
                  const currentValues = Object.values(customStats);
                  const isAllocated = currentValues.includes(score);
                  return (
                    <span 
                      key={score}
                      className={`text-xs font-mono font-black px-2.5 py-1 rounded-md border ${
                        isAllocated 
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                          : "bg-red-950/20 border-red-900/40 text-red-400 line-through opacity-60"
                      }`}
                    >
                      {score}
                    </span>
                  );
                })}
                <span className="text-[10px] font-mono text-green-400 ml-auto flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> mathematically guaranteed
                </span>
              </div>

              {/* Typing Parser panel */}
              <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex flex-col gap-3" id="text-parse-box">
                <div>
                  <h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider mb-1">⚡ Keyboard Scriptorium (Type to Scribe)</h4>
                  <p className="text-[11px] text-zinc-400">
                    Allocating stats by typing? Scribe them in a single line (e.g. <span className="font-mono text-amber-500/80">Charisma 15, Int 14, Str 13, Dex 12, Wis 10, Con 8</span>) to apply instantly!
                  </p>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={textAllocation}
                    onChange={(e) => setTextAllocation(e.target.value)}
                    placeholder="e.g., Charisma 15, Intellect 14, Str 13, Dex 12, Wis 10, Con 8"
                    className="flex-1 bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
                  />
                  <button
                    onClick={handleParseTextAllocation}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs rounded-lg transition-all cursor-pointer uppercase tracking-wider font-mono"
                  >
                    Scribe
                  </button>
                </div>
                {parseResult && (
                  <div className={`p-2.5 rounded-lg text-[11px] font-sans border ${
                    parseResult.success 
                      ? "bg-green-950/10 border-green-900/30 text-green-400" 
                      : "bg-red-950/10 border-red-900/30 text-red-400"
                  }`}>
                    {parseResult.success ? "⚔️ " : "⚠️ "} {parseResult.text}
                  </div>
                )}
              </div>

              {/* Seed Selection Grid */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-3" id="seeds-toggles">
                {Object.keys(STAT_DESCRIPTIONS).map((st) => {
                  const statKey = st as keyof StatBlock;
                  const desc = STAT_DESCRIPTIONS[statKey];
                  const isHigh = highestStat === statKey;
                  const isLow = lowestStat === statKey;
                  return (
                    <div 
                      key={st}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        isHigh ? "border-green-500/50 bg-green-950/10" : 
                        isLow ? "border-red-500/50 bg-red-950/10" : "border-zinc-850 hover:border-zinc-700 bg-zinc-900/20"
                      }`}
                    >
                      <span className="block text-xs font-mono text-zinc-400 mb-1">{desc.label}</span>
                      <div className="flex justify-center gap-1">
                        <button 
                          onClick={() => {
                            if (isLow) setLowestStat("constitution");
                            setHighestStat(statKey);
                            handleStandardArrayChange(statKey, 15);
                          }}
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${isHigh ? "bg-green-500 text-black font-black" : "bg-zinc-850 text-zinc-400 hover:bg-zinc-800"}`}
                          title="Sets value to 15 and sets seed as Dominant (Swaps safely)"
                        >
                          Dominant (15)
                        </button>
                        <button 
                          onClick={() => {
                            if (isHigh) setHighestStat("constitution");
                            setLowestStat(statKey);
                            handleStandardArrayChange(statKey, 8);
                          }}
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${isLow ? "bg-red-500 text-black font-black" : "bg-zinc-850 text-zinc-400 hover:bg-zinc-800"}`}
                          title="Sets value to 8 and sets seed as Dump (Swaps safely)"
                        >
                          Dump (8)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stat Dropdowns Container */}
              <div className="grid md:grid-cols-2 gap-4" id="stats-sliders">
                {Object.entries(STAT_DESCRIPTIONS).map(([key, desc]) => {
                  const statKey = key as keyof StatBlock;
                  const value = customStats[statKey];
                  const modifier = Math.floor((value - 10) / 2);
                  const isHigh = highestStat === statKey;
                  const isLow = lowestStat === statKey;

                  return (
                    <div 
                      key={statKey}
                      className={`p-4 bg-zinc-900/60 rounded-xl border transition-colors ${
                        isHigh ? "border-green-950/50 bg-zinc-950/10" : 
                        isLow ? "border-red-950/50 bg-zinc-950/10" : "border-zinc-850 hover:border-zinc-800"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded bg-zinc-805">
                            {statKey === "strength" && <Dumbbell className="w-3.5 h-3.5 text-amber-500" />}
                            {statKey === "dexterity" && <Activity className="w-3.5 h-3.5 text-cyan-400" />}
                            {statKey === "constitution" && <Heart className="w-3.5 h-3.5 text-rose-500" />}
                            {statKey === "intelligence" && <Brain className="w-3.5 h-3.5 text-blue-400" />}
                            {statKey === "wisdom" && <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                            {statKey === "charisma" && <MessageSquare className="w-3.5 h-3.5 text-pink-400" />}
                          </span>
                          <span className="font-display font-bold text-white text-sm">{desc.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-505 text-xs font-mono">Modifier:</span>
                          <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${modifier >= 0 ? "text-green-400 bg-green-950/20" : "text-red-400 bg-red-950/20"}`}>
                            {modifier >= 0 ? `+${modifier}` : modifier}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-[10px] text-zinc-400 leading-relaxed mb-3 min-h-[30px] font-sans">
                        {desc.utility}
                      </div>

                      <div className="relative mt-2">
                        <label className="block text-[9px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Allocated standard array score</label>
                        <select 
                          value={value}
                          onChange={(e) => handleStandardArrayChange(statKey, parseInt(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-sm p-2.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer transition-all"
                        >
                          {[15, 14, 13, 12, 10, 8].map((score) => {
                            const assignedTo = (Object.keys(customStats) as (keyof StatBlock)[]).find(
                              k => customStats[k] === score && k !== statKey
                            );
                            return (
                              <option key={score} value={score}>
                                {score} {assignedTo ? `(swaps with ${STAT_DESCRIPTIONS[assignedTo].label})` : " (current score choice)"}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex justify-between mt-4">
                <button onClick={handlePrevStep} className="flex items-center gap-1.5 text-zinc-400 hover:text-white px-4 py-2 text-sm font-semibold cursor-pointer">
                  <ChevronLeft className="w-4 h-4" /> Go Back
                </button>
                <button onClick={handleNextStep} id="stats-next-btn" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-6 py-2 rounded-lg font-semibold text-sm transition-all shadow-md cursor-pointer hover:translate-x-1 duration-150">
                  Custom Perks <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Passive Perks Generation using AI */}
          {step === 3 && (
            <div className="flex flex-col gap-6" id="wizard-step-3">
              <div>
                <h2 className="text-2xl font-display font-bold text-white">Unlock Your IRL Perks</h2>
                <p className="text-zinc-400 text-sm">Every adventurer has specialized triggers. Tell the Dungeon Master about one unique real-world habit, trait, skill, or routine you have, and Gemini will scribe 2 personalized passive abilities!</p>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-850 p-5 rounded-2xl relative overflow-hidden flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Your Eccentricity or Habit</label>
                  <textarea 
                    value={quirkInput}
                    onChange={(e) => setQuirkInput(e.target.value)}
                    placeholder="E.g., I am a web developer who survives entirely on coffee, regularly falls asleep during superhero movies, and can quote line 12 of board game rulebooks on demand."
                    className="w-full h-24 bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-amber-500 font-sans"
                  />
                </div>

                <div className="flex justify-end">
                  <button 
                    id="consult-dm-btn"
                    onClick={generatePerksFromDM}
                    disabled={isGeneratingPerks}
                    className="w-full sm:w-auto px-5 py-2.5 bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/20 text-amber-300 font-display font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingPerks ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> Rolling Custom Perks...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" /> Synthesize Perks with AI
                      </>
                    )}
                  </button>
                </div>

                {generationError && (
                  <div className="bg-red-950/20 border border-red-900/30 text-red-400 text-xs p-3 rounded-lg">
                    {generationError}
                  </div>
                )}
              </div>

              {/* Display of current active Perks */}
              <div className="space-y-4" id="perks-preview-list">
                <span className="block text-xs font-mono text-zinc-500 uppercase tracking-widest pl-1">Scribed Perks ({generatedPerks.length})</span>
                <div className="grid md:grid-cols-2 gap-4">
                  {generatedPerks.map((perk, idx) => (
                    <div key={idx} className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl flex flex-col justify-between hover:border-zinc-700 transition-colors">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-display font-bold text-white text-sm">{perk.title}</h4>
                          <span className="bg-zinc-850 text-amber-500 text-[9px] font-mono tracking-wider font-semibold px-2 py-0.5 rounded border border-zinc-800">
                            Passive Perk
                          </span>
                        </div>
                        <p className="text-zinc-300 text-xs font-mono leading-relaxed mb-3">
                          💡 <span className="font-semibold text-green-400">{perk.effect}</span>
                        </p>
                        <p className="text-zinc-400 text-xs leading-relaxed italic border-l border-zinc-800 pl-2">
                          "{perk.description}"
                        </p>
                      </div>
                      <div className="mt-4 pt-2.5 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500 flex justify-between items-center">
                        <span>Trigger: {perk.trigger}</span>
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between mt-4">
                <button onClick={handlePrevStep} className="flex items-center gap-1.5 text-zinc-400 hover:text-white px-4 py-2 text-sm font-semibold">
                  <ChevronLeft className="w-4 h-4" /> Go Back
                </button>
                <button onClick={handleNextStep} id="perks-next-btn" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-6 py-2 rounded-lg font-semibold text-sm transition-all shadow-md cursor-pointer hover:translate-x-1 duration-150">
                  Refine Identity <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Final Identity Customization */}
          {step === 4 && (
            <div className="flex flex-col gap-6" id="wizard-step-4">
              <div>
                <h2 className="text-2xl font-display font-bold text-white">Assemble Your Identity</h2>
                <p className="text-zinc-400 text-sm">Almost ready! Write your real name, define your central campaign party, and select your visual avatar.</p>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl flex flex-col gap-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Adventurer Name</label>
                    <input 
                      type="text"
                      id="character-name-input"
                      value={charName}
                      onChange={(e) => {
                        setCharName(e.target.value);
                        if (e.target.value.trim()) setNameError("");
                      }}
                      placeholder="e.g., Diego the Coffee Sorcerer"
                      className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-amber-500 font-sans"
                    />
                    {nameError && (
                      <p className="text-red-400 text-xs mt-1.5 font-semibold font-sans">⚠️ {nameError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Guild / Faction Name</label>
                    <input 
                      type="text"
                      id="character-faction-input"
                      value={faction}
                      onChange={(e) => setFaction(e.target.value)}
                      placeholder="e.g., Tech Room Syndicate"
                      className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-amber-500 font-sans"
                    />
                  </div>
                </div>

                {/* Avatar Grid Selection */}
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Choose Avatar Class</label>
                  <div className="grid grid-cols-4 gap-3 mt-1.5">
                    {AVATAR_OPTIONS.map((opt) => {
                      const isSelected = avatar === opt.key;
                      return (
                        <div
                          key={opt.key}
                          id={`avatar-${opt.key}`}
                          onClick={() => setAvatar(opt.key)}
                          className={`p-3.5 rounded-xl border text-center cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-amber-500/10 border-amber-500" 
                              : "bg-zinc-950/80 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/30"
                          }`}
                        >
                          <span className="text-2xl block mb-1">{opt.emoji}</span>
                          <span className="text-[10px] block font-semibold text-zinc-400">{opt.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Final Finish Check */}
              <div className="flex justify-between mt-4">
                <button onClick={handlePrevStep} className="flex items-center gap-1.5 text-zinc-400 hover:text-white px-4 py-2 text-sm font-semibold">
                  <ChevronLeft className="w-4 h-4" /> Go Back
                </button>
                <button 
                  onClick={handleFinish} 
                  id="wizard-finish-btn" 
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg cursor-pointer hover:scale-[1.02] duration-200"
                >
                  Generate Character Sheet 📜
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
