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
  name: string;
  role: string; // IRL Archetype
  level: number;
  xp: number;
  stats: StatBlock;
  perks: Perk[];
  customDetails: string;
  avatar: string; // Avatar name or class-based illustration key
  faction: string; // e.g. "Rulebreakers", "Boardgame Night Crew"
}

export interface ChatMessage {
  id: string;
  sender: "user" | "dm";
  text: string;
  timestamp: string;
}

export const ARCHETYPES = [
  {
    id: "rules-lawyer",
    name: "The Rules Lawyer",
    tagline: "Unbeatable at rulebook citations. Feared by Game Masters.",
    description: "Your superpower is cross-referencing footnotes at 2 AM. You treat instructions like safety manuals and social covenants as legally binding.",
    highest: "intelligence" as keyof StatBlock,
    lowest: "charisma" as keyof StatBlock,
    icon: "BookOpen"
  },
  {
    id: "instigator",
    name: "The Instigator",
    tagline: "Enjoys chaos. Pushes shiny red buttons to see what happens.",
    description: "You believe the best strategy is the one that forces everyone to pivot. You start alliances just to see how they break. A pure wild card of social boards.",
    highest: "charisma" as keyof StatBlock,
    lowest: "wisdom" as keyof StatBlock,
    icon: "Flame"
  },
  {
    id: "tactical-turtler",
    name: "The Tactical Turtler",
    tagline: "Slow, methodical, and completely unbothered by speed runs.",
    description: "You build giant walls, stack defensives, and wait out the storm. While others speedrun, you are organizing your inventories and fortifying your compound.",
    highest: "constitution" as keyof StatBlock,
    lowest: "dexterity" as keyof StatBlock,
    icon: "Shield"
  },
  {
    id: "wildcard",
    name: "The Wildcard",
    tagline: "Never let them know your next move (mostly because you don't know either).",
    description: "You run on pure caffeine and instinct. You choose options because the card had pretty artwork or to achieve maximum immediate comedy.",
    highest: "dexterity" as keyof StatBlock,
    lowest: "intelligence" as keyof StatBlock,
    icon: "Sparkles"
  },
  {
    id: "loot-goblin",
    name: "The Loot Goblin",
    tagline: "If it's shiny and unpinned, it belongs in my inventory.",
    description: "You track down lost coupons, hoard shiny dice, collect loyalty reward cards, and refuse to throw away boxes because they might have a function later.",
    highest: "wisdom" as keyof StatBlock,
    lowest: "constitution" as keyof StatBlock,
    icon: "Coins"
  },
  {
    id: "min-maxer",
    name: "The Min-Maxer",
    tagline: "Calculates the mathematically optimal path to joy.",
    description: "You analyze daily routes for fuel efficiency, optimize your work station, and possess an exact tier list for local takeaway joints.",
    highest: "intelligence" as keyof StatBlock,
    lowest: "wisdom" as keyof StatBlock,
    icon: "Calculator"
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
