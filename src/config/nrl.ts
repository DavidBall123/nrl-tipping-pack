export const NRL_TEAMS = [
  "Brisbane Broncos",
  "Canberra Raiders",
  "Canterbury-Bankstown Bulldogs",
  "Cronulla-Sutherland Sharks",
  "Dolphins",
  "Gold Coast Titans",
  "Manly-Warringah Sea Eagles",
  "Melbourne Storm",
  "New Zealand Warriors",
  "Newcastle Knights",
  "North Queensland Cowboys",
  "Parramatta Eels",
  "Penrith Panthers",
  "South Sydney Rabbitohs",
  "St George Illawarra Dragons",
  "Sydney Roosters",
  "Wests Tigers"
] as const;

export const TEAM_ALIASES: Record<string, string[]> = {
  "Brisbane Broncos": ["broncos", "brisbane"],
  "Canberra Raiders": ["raiders", "canberra"],
  "Canterbury-Bankstown Bulldogs": ["bulldogs", "doggies", "canterbury"],
  "Cronulla-Sutherland Sharks": ["sharks", "cronulla"],
  Dolphins: ["dolphins", "redcliffe"],
  "Gold Coast Titans": ["titans", "gold coast"],
  "Manly-Warringah Sea Eagles": ["sea eagles", "manly"],
  "Melbourne Storm": ["storm", "melbourne"],
  "New Zealand Warriors": ["warriors", "nz warriors"],
  "Newcastle Knights": ["knights", "newcastle"],
  "North Queensland Cowboys": ["cowboys", "nq cowboys"],
  "Parramatta Eels": ["eels", "parra", "parramatta"],
  "Penrith Panthers": ["panthers", "penrith"],
  "South Sydney Rabbitohs": ["rabbitohs", "souths"],
  "St George Illawarra Dragons": ["dragons", "st george"],
  "Sydney Roosters": ["roosters", "sydney roosters"],
  "Wests Tigers": ["tigers", "wests"]
};

export const POSITIVE_KEYWORDS = [
  "fit",
  "firing",
  "sharp",
  "confident",
  "dominant",
  "in form",
  "win",
  "wins",
  "favourite"
];

export const NEGATIVE_KEYWORDS = [
  "injury",
  "injured",
  "suspended",
  "struggling",
  "loss",
  "losses",
  "upset",
  "doubt",
  "out"
];

