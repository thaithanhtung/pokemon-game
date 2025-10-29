export type SkillElement = 'fire' | 'water' | 'grass' | 'electric' | 'psychic' | 'ice' | 
                           'dragon' | 'dark' | 'fairy' | 'normal' | 'fighting' | 'flying' | 
                           'poison' | 'ground' | 'rock' | 'bug' | 'ghost' | 'steel';

export type SkillCategory = 'physical' | 'special' | 'status' | 'ultimate';
export type SkillTarget = 'single' | 'all' | 'self' | 'team';

export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'status' | 'shield';
  value?: number;
  duration?: number; // turns
  stat?: 'atk' | 'def' | 'spd' | 'accuracy' | 'evasion';
  status?: 'burn' | 'freeze' | 'paralyze' | 'poison' | 'sleep' | 'confusion';
  chance?: number; // percentage
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  element: SkillElement;
  category: SkillCategory;
  power: number;
  accuracy: number;
  energy: number;
  cooldown: number; // turns
  currentCooldown?: number;
  target: SkillTarget;
  effects: SkillEffect[];
  animation?: string;
  icon?: string;
  combo?: {
    requiresSkill?: string; // skill id that must be used before
    bonusDamage?: number; // percentage bonus
    bonusEffect?: SkillEffect;
  };
  level?: number;
  experience?: number;
  upgrades?: {
    power?: number;
    accuracy?: number;
    energyCost?: number;
    cooldownReduction?: number;
    newEffect?: SkillEffect;
  }[];
}

// Type effectiveness chart
export const TYPE_EFFECTIVENESS: Record<SkillElement, Record<SkillElement, number>> = {
  fire: {
    fire: 0.5, water: 0.5, grass: 2, electric: 1, psychic: 1, ice: 2,
    dragon: 0.5, dark: 1, fairy: 1, normal: 1, fighting: 1, flying: 1,
    poison: 1, ground: 1, rock: 0.5, bug: 2, ghost: 1, steel: 2
  },
  water: {
    fire: 2, water: 0.5, grass: 0.5, electric: 1, psychic: 1, ice: 1,
    dragon: 0.5, dark: 1, fairy: 1, normal: 1, fighting: 1, flying: 1,
    poison: 1, ground: 2, rock: 2, bug: 1, ghost: 1, steel: 1
  },
  grass: {
    fire: 0.5, water: 2, grass: 0.5, electric: 1, psychic: 1, ice: 1,
    dragon: 0.5, dark: 1, fairy: 1, normal: 1, fighting: 1, flying: 0.5,
    poison: 0.5, ground: 2, rock: 2, bug: 0.5, ghost: 1, steel: 0.5
  },
  electric: {
    fire: 1, water: 2, grass: 0.5, electric: 0.5, psychic: 1, ice: 1,
    dragon: 0.5, dark: 1, fairy: 1, normal: 1, fighting: 1, flying: 2,
    poison: 1, ground: 0, rock: 1, bug: 1, ghost: 1, steel: 1
  },
  psychic: {
    fire: 1, water: 1, grass: 1, electric: 1, psychic: 0.5, ice: 1,
    dragon: 1, dark: 0, fairy: 1, normal: 1, fighting: 2, flying: 1,
    poison: 2, ground: 1, rock: 1, bug: 1, ghost: 1, steel: 0.5
  },
  ice: {
    fire: 0.5, water: 0.5, grass: 2, electric: 1, psychic: 1, ice: 0.5,
    dragon: 2, dark: 1, fairy: 1, normal: 1, fighting: 1, flying: 2,
    poison: 1, ground: 2, rock: 1, bug: 1, ghost: 1, steel: 0.5
  },
  dragon: {
    fire: 1, water: 1, grass: 1, electric: 1, psychic: 1, ice: 1,
    dragon: 2, dark: 1, fairy: 0, normal: 1, fighting: 1, flying: 1,
    poison: 1, ground: 1, rock: 1, bug: 1, ghost: 1, steel: 0.5
  },
  dark: {
    fire: 1, water: 1, grass: 1, electric: 1, psychic: 2, ice: 1,
    dragon: 1, dark: 0.5, fairy: 0.5, normal: 1, fighting: 0.5, flying: 1,
    poison: 1, ground: 1, rock: 1, bug: 1, ghost: 2, steel: 1
  },
  fairy: {
    fire: 0.5, water: 1, grass: 1, electric: 1, psychic: 1, ice: 1,
    dragon: 2, dark: 2, fairy: 1, normal: 1, fighting: 2, flying: 1,
    poison: 0.5, ground: 1, rock: 1, bug: 1, ghost: 1, steel: 0.5
  },
  normal: {
    fire: 1, water: 1, grass: 1, electric: 1, psychic: 1, ice: 1,
    dragon: 1, dark: 1, fairy: 1, normal: 1, fighting: 1, flying: 1,
    poison: 1, ground: 1, rock: 0.5, bug: 1, ghost: 0, steel: 0.5
  },
  fighting: {
    fire: 1, water: 1, grass: 1, electric: 1, psychic: 0.5, ice: 2,
    dragon: 1, dark: 2, fairy: 0.5, normal: 2, fighting: 1, flying: 0.5,
    poison: 0.5, ground: 1, rock: 2, bug: 0.5, ghost: 0, steel: 2
  },
  flying: {
    fire: 1, water: 1, grass: 2, electric: 0.5, psychic: 1, ice: 1,
    dragon: 1, dark: 1, fairy: 1, normal: 1, fighting: 2, flying: 1,
    poison: 1, ground: 1, rock: 0.5, bug: 2, ghost: 1, steel: 0.5
  },
  poison: {
    fire: 1, water: 1, grass: 2, electric: 1, psychic: 1, ice: 1,
    dragon: 1, dark: 1, fairy: 2, normal: 1, fighting: 1, flying: 1,
    poison: 0.5, ground: 0.5, rock: 0.5, bug: 1, ghost: 0.5, steel: 0
  },
  ground: {
    fire: 2, water: 1, grass: 0.5, electric: 2, psychic: 1, ice: 1,
    dragon: 1, dark: 1, fairy: 1, normal: 1, fighting: 1, flying: 0,
    poison: 2, ground: 1, rock: 2, bug: 0.5, ghost: 1, steel: 2
  },
  rock: {
    fire: 2, water: 1, grass: 1, electric: 1, psychic: 1, ice: 2,
    dragon: 1, dark: 1, fairy: 1, normal: 1, fighting: 0.5, flying: 2,
    poison: 1, ground: 0.5, rock: 1, bug: 2, ghost: 1, steel: 0.5
  },
  bug: {
    fire: 0.5, water: 1, grass: 2, electric: 1, psychic: 2, ice: 1,
    dragon: 1, dark: 2, fairy: 0.5, normal: 1, fighting: 0.5, flying: 0.5,
    poison: 0.5, ground: 1, rock: 1, bug: 1, ghost: 0.5, steel: 0.5
  },
  ghost: {
    fire: 1, water: 1, grass: 1, electric: 1, psychic: 2, ice: 1,
    dragon: 1, dark: 0.5, fairy: 1, normal: 0, fighting: 1, flying: 1,
    poison: 1, ground: 1, rock: 1, bug: 1, ghost: 2, steel: 1
  },
  steel: {
    fire: 0.5, water: 0.5, grass: 1, electric: 0.5, psychic: 1, ice: 2,
    dragon: 1, dark: 1, fairy: 2, normal: 1, fighting: 1, flying: 1,
    poison: 1, ground: 1, rock: 2, bug: 1, ghost: 1, steel: 0.5
  }
};

// Skill database
export const SKILL_DATABASE: Skill[] = [
  // Fire Skills
  {
    id: 'ember',
    name: 'Ember',
    description: 'A small flame attack that may burn the target',
    element: 'fire',
    category: 'special',
    power: 40,
    accuracy: 100,
    energy: 1,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 40 },
      { type: 'status', status: 'burn', chance: 10 }
    ]
  },
  {
    id: 'flamethrower',
    name: 'Flamethrower',
    description: 'Intense flames that have a good chance to burn',
    element: 'fire',
    category: 'special',
    power: 90,
    accuracy: 95,
    energy: 3,
    cooldown: 2,
    target: 'single',
    effects: [
      { type: 'damage', value: 90 },
      { type: 'status', status: 'burn', chance: 30 }
    ],
    combo: {
      requiresSkill: 'ember',
      bonusDamage: 20
    }
  },
  {
    id: 'inferno',
    name: 'Inferno',
    description: 'Engulfs the target in an intense fire',
    element: 'fire',
    category: 'ultimate',
    power: 150,
    accuracy: 85,
    energy: 5,
    cooldown: 5,
    target: 'single',
    effects: [
      { type: 'damage', value: 150 },
      { type: 'status', status: 'burn', chance: 100 }
    ]
  },

  // Water Skills
  {
    id: 'water_gun',
    name: 'Water Gun',
    description: 'Squirts water to attack',
    element: 'water',
    category: 'special',
    power: 40,
    accuracy: 100,
    energy: 1,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 40 }
    ]
  },
  {
    id: 'hydro_pump',
    name: 'Hydro Pump',
    description: 'Blasts the target with a huge volume of water',
    element: 'water',
    category: 'special',
    power: 110,
    accuracy: 80,
    energy: 4,
    cooldown: 3,
    target: 'single',
    effects: [
      { type: 'damage', value: 110 }
    ],
    combo: {
      requiresSkill: 'water_gun',
      bonusDamage: 25
    }
  },
  {
    id: 'aqua_shield',
    name: 'Aqua Shield',
    description: 'Creates a water barrier that reduces damage',
    element: 'water',
    category: 'status',
    power: 0,
    accuracy: 100,
    energy: 2,
    cooldown: 3,
    target: 'self',
    effects: [
      { type: 'shield', value: 50, duration: 3 }
    ]
  },

  // Electric Skills
  {
    id: 'thunder_shock',
    name: 'Thunder Shock',
    description: 'A jolt of electricity that may paralyze',
    element: 'electric',
    category: 'special',
    power: 40,
    accuracy: 100,
    energy: 1,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 40 },
      { type: 'status', status: 'paralyze', chance: 20 }
    ]
  },
  {
    id: 'thunderbolt',
    name: 'Thunderbolt',
    description: 'A strong electric blast that may paralyze',
    element: 'electric',
    category: 'special',
    power: 90,
    accuracy: 95,
    energy: 3,
    cooldown: 2,
    target: 'single',
    effects: [
      { type: 'damage', value: 90 },
      { type: 'status', status: 'paralyze', chance: 30 }
    ],
    combo: {
      requiresSkill: 'thunder_shock',
      bonusEffect: { type: 'buff', stat: 'spd', value: 20, duration: 2 }
    }
  },
  {
    id: 'thunder',
    name: 'Thunder',
    description: 'A wicked thunderbolt that never misses in rain',
    element: 'electric',
    category: 'ultimate',
    power: 120,
    accuracy: 70,
    energy: 5,
    cooldown: 4,
    target: 'single',
    effects: [
      { type: 'damage', value: 120 },
      { type: 'status', status: 'paralyze', chance: 50 }
    ]
  },

  // Grass Skills
  {
    id: 'vine_whip',
    name: 'Vine Whip',
    description: 'Strikes with slender vines',
    element: 'grass',
    category: 'physical',
    power: 45,
    accuracy: 100,
    energy: 1,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 45 }
    ]
  },
  {
    id: 'synthesis',
    name: 'Synthesis',
    description: 'Restores HP using sunlight',
    element: 'grass',
    category: 'status',
    power: 0,
    accuracy: 100,
    energy: 2,
    cooldown: 3,
    target: 'self',
    effects: [
      { type: 'heal', value: 50 }
    ]
  },
  {
    id: 'solar_beam',
    name: 'Solar Beam',
    description: 'Gathers light and blasts a bundled beam',
    element: 'grass',
    category: 'ultimate',
    power: 120,
    accuracy: 100,
    energy: 5,
    cooldown: 4,
    target: 'single',
    effects: [
      { type: 'damage', value: 120 }
    ]
  },
  {
    id: 'leech_seed',
    name: 'Leech Seed',
    description: 'Drains HP every turn',
    element: 'grass',
    category: 'status',
    power: 0,
    accuracy: 90,
    energy: 2,
    cooldown: 2,
    target: 'single',
    effects: [
      { type: 'status', status: 'poison', chance: 100, duration: 3 },
      { type: 'heal', value: 10, duration: 3 }
    ]
  },

  // Normal Skills
  {
    id: 'tackle',
    name: 'Tackle',
    description: 'A physical attack',
    element: 'normal',
    category: 'physical',
    power: 30,
    accuracy: 100,
    energy: 1,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 30 }
    ]
  },
  {
    id: 'quick_attack',
    name: 'Quick Attack',
    description: 'Always strikes first',
    element: 'normal',
    category: 'physical',
    power: 40,
    accuracy: 100,
    energy: 2,
    cooldown: 1,
    target: 'single',
    effects: [
      { type: 'damage', value: 40 },
      { type: 'buff', stat: 'spd', value: 100, duration: 1 }
    ]
  },
  {
    id: 'hyper_beam',
    name: 'Hyper Beam',
    description: 'Powerful but requires recharge',
    element: 'normal',
    category: 'ultimate',
    power: 150,
    accuracy: 90,
    energy: 5,
    cooldown: 5,
    target: 'single',
    effects: [
      { type: 'damage', value: 150 }
    ]
  },

  // Fighting Skills
  {
    id: 'karate_chop',
    name: 'Karate Chop',
    description: 'High critical hit ratio',
    element: 'fighting',
    category: 'physical',
    power: 50,
    accuracy: 100,
    energy: 2,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 50 }
    ]
  },
  {
    id: 'bulk_up',
    name: 'Bulk Up',
    description: 'Increases attack and defense',
    element: 'fighting',
    category: 'status',
    power: 0,
    accuracy: 100,
    energy: 2,
    cooldown: 3,
    target: 'self',
    effects: [
      { type: 'buff', stat: 'atk', value: 30, duration: 3 },
      { type: 'buff', stat: 'def', value: 30, duration: 3 }
    ]
  },
  {
    id: 'close_combat',
    name: 'Close Combat',
    description: 'Powerful but lowers defenses',
    element: 'fighting',
    category: 'ultimate',
    power: 120,
    accuracy: 100,
    energy: 4,
    cooldown: 3,
    target: 'single',
    effects: [
      { type: 'damage', value: 120 },
      { type: 'debuff', stat: 'def', value: 20, duration: 2 }
    ]
  },

  // Flying Skills
  {
    id: 'gust',
    name: 'Gust',
    description: 'A gust of wind strikes the target',
    element: 'flying',
    category: 'special',
    power: 40,
    accuracy: 100,
    energy: 1,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 40 }
    ]
  },
  {
    id: 'air_slash',
    name: 'Air Slash',
    description: 'May cause flinching',
    element: 'flying',
    category: 'special',
    power: 75,
    accuracy: 95,
    energy: 3,
    cooldown: 2,
    target: 'single',
    effects: [
      { type: 'damage', value: 75 },
      { type: 'debuff', stat: 'spd', value: 50, duration: 1, chance: 30 }
    ]
  },
  {
    id: 'hurricane',
    name: 'Hurricane',
    description: 'Powerful wind that confuses',
    element: 'flying',
    category: 'ultimate',
    power: 110,
    accuracy: 70,
    energy: 5,
    cooldown: 4,
    target: 'single',
    effects: [
      { type: 'damage', value: 110 },
      { type: 'status', status: 'confusion', chance: 30 }
    ]
  },

  // Poison Skills
  {
    id: 'poison_sting',
    name: 'Poison Sting',
    description: 'May poison the target',
    element: 'poison',
    category: 'physical',
    power: 15,
    accuracy: 100,
    energy: 1,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 15 },
      { type: 'status', status: 'poison', chance: 30 }
    ]
  },
  {
    id: 'toxic',
    name: 'Toxic',
    description: 'Badly poisons the target',
    element: 'poison',
    category: 'status',
    power: 0,
    accuracy: 90,
    energy: 2,
    cooldown: 3,
    target: 'single',
    effects: [
      { type: 'status', status: 'poison', chance: 100, duration: 5 }
    ]
  },
  {
    id: 'sludge_bomb',
    name: 'Sludge Bomb',
    description: 'Unsanitary sludge may poison',
    element: 'poison',
    category: 'special',
    power: 90,
    accuracy: 100,
    energy: 3,
    cooldown: 2,
    target: 'single',
    effects: [
      { type: 'damage', value: 90 },
      { type: 'status', status: 'poison', chance: 30 }
    ]
  },

  // Ground Skills
  {
    id: 'mud_slap',
    name: 'Mud Slap',
    description: 'Reduces accuracy',
    element: 'ground',
    category: 'special',
    power: 20,
    accuracy: 100,
    energy: 1,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 20 },
      { type: 'debuff', stat: 'accuracy', value: 10, duration: 3 }
    ]
  },
  {
    id: 'earthquake',
    name: 'Earthquake',
    description: 'Powerful quake hits all',
    element: 'ground',
    category: 'physical',
    power: 100,
    accuracy: 100,
    energy: 4,
    cooldown: 3,
    target: 'all',
    effects: [
      { type: 'damage', value: 100 }
    ]
  },
  {
    id: 'fissure',
    name: 'Fissure',
    description: 'One-hit KO if it hits',
    element: 'ground',
    category: 'ultimate',
    power: 200,
    accuracy: 30,
    energy: 5,
    cooldown: 5,
    target: 'single',
    effects: [
      { type: 'damage', value: 200 }
    ]
  },

  // Rock Skills
  {
    id: 'rock_throw',
    name: 'Rock Throw',
    description: 'Hurls rocks at the target',
    element: 'rock',
    category: 'physical',
    power: 50,
    accuracy: 90,
    energy: 2,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 50 }
    ]
  },
  {
    id: 'stealth_rock',
    name: 'Stealth Rock',
    description: 'Sets a trap of floating stones',
    element: 'rock',
    category: 'status',
    power: 0,
    accuracy: 100,
    energy: 2,
    cooldown: 4,
    target: 'all',
    effects: [
      { type: 'damage', value: 25, duration: 99 }
    ]
  },
  {
    id: 'stone_edge',
    name: 'Stone Edge',
    description: 'High critical hit ratio',
    element: 'rock',
    category: 'physical',
    power: 100,
    accuracy: 80,
    energy: 4,
    cooldown: 3,
    target: 'single',
    effects: [
      { type: 'damage', value: 100 }
    ]
  },

  // Bug Skills
  {
    id: 'bug_bite',
    name: 'Bug Bite',
    description: 'The user bites the target',
    element: 'bug',
    category: 'physical',
    power: 60,
    accuracy: 100,
    energy: 2,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 60 }
    ]
  },
  {
    id: 'string_shot',
    name: 'String Shot',
    description: 'Reduces speed with sticky string',
    element: 'bug',
    category: 'status',
    power: 0,
    accuracy: 95,
    energy: 1,
    cooldown: 2,
    target: 'single',
    effects: [
      { type: 'debuff', stat: 'spd', value: 40, duration: 3 }
    ]
  },
  {
    id: 'megahorn',
    name: 'Megahorn',
    description: 'Charges with its tough horn',
    element: 'bug',
    category: 'physical',
    power: 120,
    accuracy: 85,
    energy: 4,
    cooldown: 3,
    target: 'single',
    effects: [
      { type: 'damage', value: 120 }
    ]
  },

  // Ghost Skills
  {
    id: 'lick',
    name: 'Lick',
    description: 'May cause paralysis',
    element: 'ghost',
    category: 'physical',
    power: 30,
    accuracy: 100,
    energy: 1,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 30 },
      { type: 'status', status: 'paralyze', chance: 30 }
    ]
  },
  {
    id: 'shadow_ball',
    name: 'Shadow Ball',
    description: 'May lower special defense',
    element: 'ghost',
    category: 'special',
    power: 80,
    accuracy: 100,
    energy: 3,
    cooldown: 2,
    target: 'single',
    effects: [
      { type: 'damage', value: 80 },
      { type: 'debuff', stat: 'def', value: 20, duration: 2, chance: 20 }
    ]
  },
  {
    id: 'phantom_force',
    name: 'Phantom Force',
    description: 'Vanishes, then strikes',
    element: 'ghost',
    category: 'physical',
    power: 90,
    accuracy: 100,
    energy: 4,
    cooldown: 3,
    target: 'single',
    effects: [
      { type: 'damage', value: 90 },
      { type: 'shield', value: 100, duration: 1 }
    ]
  },

  // Steel Skills
  {
    id: 'metal_claw',
    name: 'Metal Claw',
    description: 'May raise attack',
    element: 'steel',
    category: 'physical',
    power: 50,
    accuracy: 95,
    energy: 2,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 50 },
      { type: 'buff', stat: 'atk', value: 10, duration: 3, chance: 10 }
    ]
  },
  {
    id: 'iron_defense',
    name: 'Iron Defense',
    description: 'Sharply raises defense',
    element: 'steel',
    category: 'status',
    power: 0,
    accuracy: 100,
    energy: 2,
    cooldown: 3,
    target: 'self',
    effects: [
      { type: 'buff', stat: 'def', value: 50, duration: 3 }
    ]
  },
  {
    id: 'meteor_mash',
    name: 'Meteor Mash',
    description: 'May raise attack sharply',
    element: 'steel',
    category: 'physical',
    power: 90,
    accuracy: 90,
    energy: 4,
    cooldown: 3,
    target: 'single',
    effects: [
      { type: 'damage', value: 90 },
      { type: 'buff', stat: 'atk', value: 30, duration: 3, chance: 20 }
    ]
  },

  // Psychic Skills
  {
    id: 'confusion',
    name: 'Confusion',
    description: 'May confuse the target',
    element: 'psychic',
    category: 'special',
    power: 50,
    accuracy: 100,
    energy: 2,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 50 },
      { type: 'status', status: 'confusion', chance: 10 }
    ]
  },
  {
    id: 'calm_mind',
    name: 'Calm Mind',
    description: 'Raises special stats',
    element: 'psychic',
    category: 'status',
    power: 0,
    accuracy: 100,
    energy: 2,
    cooldown: 3,
    target: 'self',
    effects: [
      { type: 'buff', stat: 'atk', value: 20, duration: 3 },
      { type: 'buff', stat: 'def', value: 20, duration: 3 }
    ]
  },
  {
    id: 'psychic',
    name: 'Psychic',
    description: 'Strong telekinetic force',
    element: 'psychic',
    category: 'special',
    power: 90,
    accuracy: 100,
    energy: 3,
    cooldown: 2,
    target: 'single',
    effects: [
      { type: 'damage', value: 90 },
      { type: 'debuff', stat: 'def', value: 10, duration: 2, chance: 10 }
    ]
  },

  // Ice Skills
  {
    id: 'powder_snow',
    name: 'Powder Snow',
    description: 'May freeze the target',
    element: 'ice',
    category: 'special',
    power: 40,
    accuracy: 100,
    energy: 1,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 40 },
      { type: 'status', status: 'freeze', chance: 10 }
    ]
  },
  {
    id: 'ice_beam',
    name: 'Ice Beam',
    description: 'May freeze the target',
    element: 'ice',
    category: 'special',
    power: 90,
    accuracy: 100,
    energy: 3,
    cooldown: 2,
    target: 'single',
    effects: [
      { type: 'damage', value: 90 },
      { type: 'status', status: 'freeze', chance: 10 }
    ]
  },
  {
    id: 'blizzard',
    name: 'Blizzard',
    description: 'Howling blizzard may freeze',
    element: 'ice',
    category: 'ultimate',
    power: 110,
    accuracy: 70,
    energy: 5,
    cooldown: 4,
    target: 'all',
    effects: [
      { type: 'damage', value: 110 },
      { type: 'status', status: 'freeze', chance: 10 }
    ]
  },

  // Dragon Skills
  {
    id: 'dragon_rage',
    name: 'Dragon Rage',
    description: 'Always inflicts 40 damage',
    element: 'dragon',
    category: 'special',
    power: 40,
    accuracy: 100,
    energy: 2,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 40 }
    ]
  },
  {
    id: 'dragon_dance',
    name: 'Dragon Dance',
    description: 'Raises attack and speed',
    element: 'dragon',
    category: 'status',
    power: 0,
    accuracy: 100,
    energy: 2,
    cooldown: 3,
    target: 'self',
    effects: [
      { type: 'buff', stat: 'atk', value: 30, duration: 3 },
      { type: 'buff', stat: 'spd', value: 30, duration: 3 }
    ]
  },
  {
    id: 'outrage',
    name: 'Outrage',
    description: 'Rampages but confuses user',
    element: 'dragon',
    category: 'physical',
    power: 120,
    accuracy: 100,
    energy: 4,
    cooldown: 3,
    target: 'single',
    effects: [
      { type: 'damage', value: 120 },
      { type: 'status', status: 'confusion', chance: 100, duration: 2 }
    ]
  },

  // Dark Skills
  {
    id: 'bite',
    name: 'Bite',
    description: 'May cause flinching',
    element: 'dark',
    category: 'physical',
    power: 60,
    accuracy: 100,
    energy: 2,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 60 },
      { type: 'debuff', stat: 'spd', value: 50, duration: 1, chance: 30 }
    ]
  },
  {
    id: 'nasty_plot',
    name: 'Nasty Plot',
    description: 'Sharply raises special attack',
    element: 'dark',
    category: 'status',
    power: 0,
    accuracy: 100,
    energy: 2,
    cooldown: 3,
    target: 'self',
    effects: [
      { type: 'buff', stat: 'atk', value: 50, duration: 3 }
    ]
  },
  {
    id: 'dark_pulse',
    name: 'Dark Pulse',
    description: 'May cause flinching',
    element: 'dark',
    category: 'special',
    power: 80,
    accuracy: 100,
    energy: 3,
    cooldown: 2,
    target: 'single',
    effects: [
      { type: 'damage', value: 80 },
      { type: 'debuff', stat: 'spd', value: 50, duration: 1, chance: 20 }
    ]
  },

  // Fairy Skills
  {
    id: 'fairy_wind',
    name: 'Fairy Wind',
    description: 'Stirs up a fairy wind',
    element: 'fairy',
    category: 'special',
    power: 40,
    accuracy: 100,
    energy: 1,
    cooldown: 0,
    target: 'single',
    effects: [
      { type: 'damage', value: 40 }
    ]
  },
  {
    id: 'moonlight',
    name: 'Moonlight',
    description: 'Restores HP',
    element: 'fairy',
    category: 'status',
    power: 0,
    accuracy: 100,
    energy: 2,
    cooldown: 3,
    target: 'self',
    effects: [
      { type: 'heal', value: 50 }
    ]
  },
  {
    id: 'moonblast',
    name: 'Moonblast',
    description: 'May lower special attack',
    element: 'fairy',
    category: 'special',
    power: 95,
    accuracy: 100,
    energy: 4,
    cooldown: 3,
    target: 'single',
    effects: [
      { type: 'damage', value: 95 },
      { type: 'debuff', stat: 'atk', value: 30, duration: 2, chance: 30 }
    ]
  }
];

// Helper functions
export function calculateDamage(
  skill: Skill,
  attackerType: SkillElement,
  defenderType: SkillElement,
  attackerStats: { atk: number },
  defenderStats: { def: number },
  comboBonus: number = 0
): number {
  const baseDamage = skill.power;
  const attackStat = skill.category === 'physical' ? attackerStats.atk : attackerStats.atk * 1.2;
  const defenseStat = defenderStats.def;
  
  // Type effectiveness
  const effectiveness = TYPE_EFFECTIVENESS[skill.element]?.[defenderType] || 1;
  
  // Damage formula
  let damage = Math.floor((baseDamage * (attackStat / defenseStat) * effectiveness) / 2);
  
  // Apply combo bonus
  if (comboBonus > 0) {
    damage = Math.floor(damage * (1 + comboBonus / 100));
  }
  
  // Random variance (85-100%)
  const variance = Math.random() * 0.15 + 0.85;
  damage = Math.floor(damage * variance);
  
  // Critical hit chance (5%)
  if (Math.random() < 0.05) {
    damage = Math.floor(damage * 1.5);
  }
  
  return Math.max(1, damage); // Minimum 1 damage
}

export function getEffectivenessText(multiplier: number): string {
  if (multiplier === 0) return "No effect!";
  if (multiplier < 1) return "Not very effective...";
  if (multiplier > 1) return "Super effective!";
  return "";
}

export function getSkillsByType(element: SkillElement): Skill[] {
  return SKILL_DATABASE.filter(skill => skill.element === element);
}

export function getSkillById(id: string): Skill | undefined {
  return SKILL_DATABASE.find(skill => skill.id === id);
}