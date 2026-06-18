export interface StatBlock {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface Perk {
  title: string;
  effect: string;
  description: string;
  trigger: string;
}

export interface CharacterSheet {
  id: string; // 🌟 Unique identifier for multiple character tracking
  name: string;
  role: string; // IRL Archetype
  race: string; // 🏳️‍🌈 Queer Community Race Blueprint
  level: number;
  xp: number;
  stats: StatBlock;
  perks: Perk[];
  customDetails: string;
  avatar: string; // Avatar emoji key
  avatarImage?: string; // Base64 data URL for uploaded image
  avatarConfig?: { scale: number; x: number; y: number; rotate: number }; // Transform coordinates
  faction: string; // e.g. "Rulebreakers", "Boardgame Night Crew"
  accentColor: string; // Hex value for class tinting
}

export interface DiceRollLog {
  id: string;
  diceType: "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
  natural: number;
  modifier: number;
  total: number;
  timestamp: string;
  note: string;
  associatedStat?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "dm";
  text: string;
  timestamp: string;
}

// ⚔️ Seed Database for classes/archetypes - Expanded 7-class roster
export const DEFAULT_ARCHETYPES = [
  {
    id: "top",
    name: "Top",
    tagline: "Takes charge of the initiative. Commands the active encounter grid.",
    description: "A natural vanguard who commands the encounter space, steps up for heavy lifting, and structures the party's direction with direct authority.",
    highest: "strength" as keyof StatBlock,
    lowest: "wisdom" as keyof StatBlock,
    icon: "Flame",
    color: "#f43f5e"
  },
  {
    id: "bottom",
    name: "Bottom",
    tagline: "Incredible endurance pool. Master of tactical survival and patience.",
    description: "Thrives under pressure with remarkable endurance and nimble setup reflexes, outlasting long debates or exhausting sessions.",
    highest: "constitution" as keyof StatBlock,
    lowest: "strength" as keyof StatBlock,
    icon: "Shield",
    color: "#06b6d4"
  },
  {
    id: "verse",
    name: "Verse",
    tagline: "The ultimate multi-class flex. Adapts instantly to any team layout.",
    description: "An incredibly versatile strategist capable of filling any group dynamic gap, balancing brainpower and tactical support beautifully.",
    highest: "intelligence" as keyof StatBlock,
    lowest: "strength" as keyof StatBlock,
    icon: "Sparkles",
    color: "#a855f7"
  },
  {
    id: "versetop",
    name: "VerseTop",
    tagline: "Assertive executive leadership with an adaptable strategic pivot.",
    description: "Executes bold decisions with charming persuasion, leading from the front but relying on others to sustain the long-haul grinds.",
    highest: "charisma" as keyof StatBlock,
    lowest: "constitution" as keyof StatBlock,
    icon: "BookOpen",
    color: "#f97316"
  },
  {
    id: "versebottom",
    name: "VerseBottom",
    tagline: "High-agility coordination with a clutch defensive utility toolkit.",
    description: "Quick to adapt, nimble with mechanics, and always ready to back up the team with resilient, fast-paced coordination.",
    highest: "dexterity" as keyof StatBlock,
    lowest: "intelligence" as keyof StatBlock,
    icon: "Activity",
    color: "#10b981"
  },
  {
    id: "side",
    name: "Side",
    tagline: "Deploys alternative solutions. Master of social boundary mechanics.",
    description: "An exceptional room-reader and negotiator who avoids brute-force conflicts, opting instead for elegant diplomatic solutions.",
    highest: "wisdom" as keyof StatBlock,
    lowest: "strength" as keyof StatBlock,
    icon: "Eye",
    color: "#6366f1"
  },
  {
    id: "powerbottom",
    name: "Power Bottom",
    tagline: "Commands the entire field through raw charisma and unmatched stamina.",
    description: "An absolute powerhouse of social presence and pure energy, captivating everyone while effortlessly outlasting any marathon schedule.",
    highest: "constitution" as keyof StatBlock,
    lowest: "intelligence" as keyof StatBlock,
    icon: "Coins",
    color: "#d946ef"
  }
];

// 🏳️‍🌈 Seed Dataset for Queer Races including their Ability Score Bonuses!
export const DEFAULT_RACES = [
  {
    id: "twink",
    name: "Twink",
    tagline: "Agile, high-energy, and effortlessly aerodynamic.",
    description: "Blessed with incredible social speed and natural grace. You weave through crowded grocery aisles effortlessly and possess a natural shield against unvetted fashion crises.",
    icon: "✨",
    bonuses: { dexterity: 2, charisma: 1 } // ⭐ Ability Score modifiers
  },
  {
    id: "twunk",
    name: "Twunk",
    tagline: "The optimal hybrid of physical strength and fluid dexterity.",
    description: "You hit the iron temple but keep your fast-acting initiative intact. You're the designated pack mule for moving heavy board game trunks without losing a step.",
    icon: "💪",
    bonuses: { strength: 2, dexterity: 1 }
  },
  {
    id: "twas",
    name: "Twas",
    tagline: "The seasoned veteran; a twink that once was.",
    description: "You have retired your high-energy clubbing boots for deep tactical wisdom and premium couch positioning. You bring unparalleled historical perspective and an explicit requirement for an afternoon nap.",
    icon: "⏳",
    bonuses: { wisdom: 2, intelligence: 1 }
  },
  {
    id: "otter",
    name: "Otter",
    tagline: "Lean, scruffy, and infinitely resourceful.",
    description: "The ultimate game night survivalist. You have an uncanny ability to discover missing keys, fix broken structural game pieces, and find loose change tucked under cushions.",
    icon: "🦦",
    bonuses: { intelligence: 2, dexterity: 1 }
  },
  {
    id: "bear",
    name: "Bear",
    tagline: "Mighty, comforting, and wonderfully robust.",
    description: "A fortress of pure stability and comforting auras. You excel at holding down the most reliable seating spots and project a passive protective field that keeps tilted party members calm.",
    icon: "🐻",
    bonuses: { constitution: 2, strength: 1 }
  }
];

export const STAT_DESCRIPTIONS: Record<keyof StatBlock, { label: string; utility: string; icon: string }> = {
  strength: {
    label: "Strength",
    utility: "Lifting heavy gear, opening stubborn airtight jars, carrying all the groceries in a single trip.",
    icon: "Biceps"
  },
  dexterity: {
    label: "Dexterity",
    utility: "Video game reflexes, physical board game setups, catch-saving dropping mugs, parallel parking.",
    icon: "Activity"
  },
  constitution: {
    label: "Constitution",
    utility: "Endurance for late-night gaming sessions, immunity to room-temperature pizza, tolerating bad postures.",
    icon: "Heart"
  },
  intelligence: {
    label: "Intelligence",
    utility: "Rulebook comprehension, trivia mastery, tactical planning, memorizing Wi-Fi passwords.",
    icon: "Brain"
  },
  wisdom: {
    label: "Wisdom",
    utility: "Reading the social room, noticing when a friend is tilted, spotting missing keys, saving money.",
    icon: "Eye"
  },
  charisma: {
    label: "Charisma",
    utility: "Persuasion checks to pick the movie/game, bluffing/negotiation, convincing someone to order takeout.",
    icon: "MessageSquare"
  }
};