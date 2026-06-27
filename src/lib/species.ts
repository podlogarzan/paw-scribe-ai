export type SpeciesOption = { value: string; label: string; emoji: string };

export const SPECIES: SpeciesOption[] = [
  { value: "dog", label: "Dog", emoji: "🐶" },
  { value: "cat", label: "Cat", emoji: "🐱" },
  { value: "rabbit", label: "Rabbit", emoji: "🐰" },
  { value: "bird", label: "Bird", emoji: "🐦" },
  { value: "fish", label: "Fish", emoji: "🐟" },
  { value: "hamster", label: "Hamster", emoji: "🐹" },
  { value: "guinea_pig", label: "Guinea Pig", emoji: "🐾" },
  { value: "turtle", label: "Turtle", emoji: "🐢" },
  { value: "snake", label: "Snake", emoji: "🐍" },
  { value: "lizard", label: "Lizard", emoji: "🦎" },
  { value: "spider", label: "Spider", emoji: "🕷️" },
];

export const EXTRA_SPECIES: SpeciesOption[] = [
  { value: "ferret", label: "Ferret", emoji: "🐾" },
  { value: "horse", label: "Horse", emoji: "🐴" },
  { value: "pig", label: "Pig", emoji: "🐷" },
  { value: "goat", label: "Goat", emoji: "🐐" },
  { value: "sheep", label: "Sheep", emoji: "🐑" },
  { value: "cow", label: "Cow", emoji: "🐮" },
  { value: "chicken", label: "Chicken", emoji: "🐔" },
  { value: "duck", label: "Duck", emoji: "🦆" },
  { value: "parrot", label: "Parrot", emoji: "🦜" },
  { value: "frog", label: "Frog", emoji: "🐸" },
  { value: "mouse", label: "Mouse", emoji: "🐭" },
  { value: "rat", label: "Rat", emoji: "🐀" },
  { value: "hedgehog", label: "Hedgehog", emoji: "🦔" },
  { value: "chinchilla", label: "Chinchilla", emoji: "🐾" },
  { value: "gerbil", label: "Gerbil", emoji: "🐾" },
  { value: "tortoise", label: "Tortoise", emoji: "🐢" },
  { value: "gecko", label: "Gecko", emoji: "🦎" },
  { value: "iguana", label: "Iguana", emoji: "🦎" },
  { value: "axolotl", label: "Axolotl", emoji: "🐾" },
  { value: "tarantula", label: "Tarantula", emoji: "🕷️" },
  { value: "scorpion", label: "Scorpion", emoji: "🦂" },
  { value: "crab", label: "Crab", emoji: "🦀" },
  { value: "shrimp", label: "Shrimp", emoji: "🦐" },
  { value: "octopus", label: "Octopus", emoji: "🐙" },
  { value: "other", label: "Other", emoji: "🐾" },
];

const MAP = new Map<string, SpeciesOption>(
  [...SPECIES, ...EXTRA_SPECIES].map((s) => [s.value, s]),
);

export function speciesEmoji(value?: string | null): string {
  if (!value) return "🐾";
  return MAP.get(value.toLowerCase())?.emoji ?? "🐾";
}

export function speciesLabel(value?: string | null): string {
  if (!value) return "Pet";
  return MAP.get(value.toLowerCase())?.label ?? value;
}