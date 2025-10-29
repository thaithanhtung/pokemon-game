import type { Skill, SkillEffect, SkillElement } from '@/types/skills';

export interface ActiveEffect {
  id: string;
  source: 'player' | 'opponent';
  target: 'player' | 'opponent';
  effect: SkillEffect;
  turnsRemaining: number;
  skillName: string;
}

export interface BattlePokemon {
  id: string;
  uid: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  energy: number;
  maxEnergy: number;
  pokemonType: SkillElement;
  types: SkillElement[];
  
  // Battle modifiers
  statusEffects: ActiveEffect[];
  statModifiers: {
    atk: number;
    def: number;
    spd: number;
    accuracy: number;
    evasion: number;
  };
  shield: number;
  
  // Skills
  skills: Skill[];
  
  // Animation state
  anim?: {
    type: string;
    ts: number;
    element?: SkillElement;
  };
}

export interface BattleLog {
  message: string;
  type: 'damage' | 'heal' | 'status' | 'buff' | 'debuff' | 'info';
  timestamp: number;
}

export class BattleEffectManager {
  static applySkillEffects(
    skill: Skill,
    attacker: BattlePokemon,
    defender: BattlePokemon,
    attackerSide: 'player' | 'opponent',
    logs: BattleLog[]
  ): number {
    let totalDamage = 0;
    
    // Process each effect
    for (const effect of skill.effects) {
      switch (effect.type) {
        case 'damage':
          const damage = this.calculateDamage(skill, attacker, defender, effect);
          defender.hp = Math.max(0, defender.hp - damage);
          totalDamage += damage;
          logs.push({
            message: `${attacker.name} used ${skill.name} for ${damage} damage!`,
            type: 'damage',
            timestamp: Date.now()
          });
          break;
          
        case 'heal':
          const healAmount = effect.value || 0;
          const actualHeal = Math.min(healAmount, attacker.maxHp - attacker.hp);
          attacker.hp += actualHeal;
          logs.push({
            message: `${attacker.name} restored ${actualHeal} HP!`,
            type: 'heal',
            timestamp: Date.now()
          });
          break;
          
        case 'status':
          if (effect.status && this.rollChance(effect.chance || 100)) {
            const statusEffect: ActiveEffect = {
              id: `${effect.status}_${Date.now()}`,
              source: attackerSide,
              target: attackerSide === 'player' ? 'opponent' : 'player',
              effect: effect,
              turnsRemaining: effect.duration || 3,
              skillName: skill.name
            };
            defender.statusEffects.push(statusEffect);
            logs.push({
              message: `${defender.name} was inflicted with ${effect.status}!`,
              type: 'status',
              timestamp: Date.now()
            });
          }
          break;
          
        case 'buff':
          if (effect.stat) {
            const buffValue = effect.value || 0;
            attacker.statModifiers[effect.stat] += buffValue;
            logs.push({
              message: `${attacker.name}'s ${effect.stat.toUpperCase()} increased by ${buffValue}!`,
              type: 'buff',
              timestamp: Date.now()
            });
            
            if (effect.duration) {
              const buffEffect: ActiveEffect = {
                id: `buff_${effect.stat}_${Date.now()}`,
                source: attackerSide,
                target: attackerSide,
                effect: effect,
                turnsRemaining: effect.duration,
                skillName: skill.name
              };
              attacker.statusEffects.push(buffEffect);
            }
          }
          break;
          
        case 'debuff':
          if (effect.stat && this.rollChance(effect.chance || 100)) {
            const debuffValue = effect.value || 0;
            defender.statModifiers[effect.stat] -= debuffValue;
            logs.push({
              message: `${defender.name}'s ${effect.stat.toUpperCase()} decreased by ${debuffValue}!`,
              type: 'debuff',
              timestamp: Date.now()
            });
            
            if (effect.duration) {
              const debuffEffect: ActiveEffect = {
                id: `debuff_${effect.stat}_${Date.now()}`,
                source: attackerSide,
                target: attackerSide === 'player' ? 'opponent' : 'player',
                effect: effect,
                turnsRemaining: effect.duration,
                skillName: skill.name
              };
              defender.statusEffects.push(debuffEffect);
            }
          }
          break;
          
        case 'shield':
          const shieldValue = effect.value || 0;
          attacker.shield += shieldValue;
          logs.push({
            message: `${attacker.name} gained a ${shieldValue} HP shield!`,
            type: 'buff',
            timestamp: Date.now()
          });
          
          if (effect.duration) {
            const shieldEffect: ActiveEffect = {
              id: `shield_${Date.now()}`,
              source: attackerSide,
              target: attackerSide,
              effect: effect,
              turnsRemaining: effect.duration,
              skillName: skill.name
            };
            attacker.statusEffects.push(shieldEffect);
          }
          break;
      }
    }
    
    return totalDamage;
  }
  
  static calculateDamage(
    skill: Skill,
    attacker: BattlePokemon,
    defender: BattlePokemon,
    effect: SkillEffect
  ): number {
    const baseDamage = effect.value || skill.power;
    
    // Get effective attack stat with modifiers
    const attackStat = skill.category === 'physical' 
      ? attacker.atk + attacker.statModifiers.atk
      : (attacker.atk + attacker.statModifiers.atk) * 1.2;
      
    // Get effective defense stat with modifiers
    const defenseStat = Math.max(1, defender.def + defender.statModifiers.def);
    
    // Type effectiveness
    const effectiveness = this.getTypeEffectiveness(skill.element, defender.pokemonType);
    
    // Base damage calculation - balanced formula
    // Reduced damage to prevent one-hit KOs
    let damage = Math.floor((baseDamage * 0.4 + (attackStat - defenseStat) * 0.5) * effectiveness);
    
    // Apply shield first
    if (defender.shield > 0) {
      const shieldAbsorb = Math.min(damage, defender.shield);
      defender.shield -= shieldAbsorb;
      damage -= shieldAbsorb;
    }
    
    // Ensure minimum damage
    damage = Math.max(5, damage);
    
    // Random variance (85-100%)
    const variance = Math.random() * 0.15 + 0.85;
    damage = Math.floor(damage * variance);
    
    // Cap damage to prevent one-hit KOs (max 40% of defender's max HP)
    damage = Math.min(damage, Math.floor(defender.maxHp * 0.4));
    
    // Critical hit chance (5% base, increased with certain moves)
    const critChance = skill.name.toLowerCase().includes('edge') || 
                      skill.name.toLowerCase().includes('chop') ? 0.125 : 0.05;
    if (Math.random() < critChance) {
      damage = Math.floor(damage * 1.5);
    }
    
    return Math.max(1, damage);
  }
  
  static processStatusEffects(
    pokemon: BattlePokemon,
    side: 'player' | 'opponent',
    logs: BattleLog[]
  ): void {
    // Process status ailments
    const activeStatuses = pokemon.statusEffects.filter(e => e.effect.type === 'status');
    
    for (const status of activeStatuses) {
      switch (status.effect.status) {
        case 'burn':
          const burnDamage = Math.floor(pokemon.maxHp * 0.0625);
          pokemon.hp = Math.max(0, pokemon.hp - burnDamage);
          logs.push({
            message: `${pokemon.name} is hurt by burn! (-${burnDamage} HP)`,
            type: 'damage',
            timestamp: Date.now()
          });
          break;
          
        case 'poison':
          const poisonDamage = Math.floor(pokemon.maxHp * 0.125);
          pokemon.hp = Math.max(0, pokemon.hp - poisonDamage);
          logs.push({
            message: `${pokemon.name} is hurt by poison! (-${poisonDamage} HP)`,
            type: 'damage',
            timestamp: Date.now()
          });
          break;
          
        case 'freeze':
          // Frozen Pokemon can't move (handled in canAttack check)
          if (Math.random() < 0.2) { // 20% chance to thaw
            status.turnsRemaining = 0;
            logs.push({
              message: `${pokemon.name} thawed out!`,
              type: 'info',
              timestamp: Date.now()
            });
          }
          break;
          
        case 'paralyze':
          // Paralysis reduces speed by 50% and has 25% chance to prevent action
          if (!pokemon.statModifiers.spd) pokemon.statModifiers.spd = 0;
          pokemon.statModifiers.spd = -Math.floor(pokemon.spd * 0.5);
          break;
          
        case 'sleep':
          // Sleeping Pokemon can't move (handled in canAttack check)
          if (Math.random() < 0.33) { // 33% chance to wake up
            status.turnsRemaining = 0;
            logs.push({
              message: `${pokemon.name} woke up!`,
              type: 'info',
              timestamp: Date.now()
            });
          }
          break;
          
        case 'confusion':
          // 33% chance to hurt itself
          if (Math.random() < 0.33) {
            const confusionDamage = Math.floor(pokemon.maxHp * 0.1);
            pokemon.hp = Math.max(0, pokemon.hp - confusionDamage);
            logs.push({
              message: `${pokemon.name} hurt itself in confusion! (-${confusionDamage} HP)`,
              type: 'damage',
              timestamp: Date.now()
            });
          }
          break;
      }
    }
    
    // Update turn counters and remove expired effects
    pokemon.statusEffects = pokemon.statusEffects.filter(effect => {
      effect.turnsRemaining--;
      
      // Remove expired effects
      if (effect.turnsRemaining <= 0) {
        // Revert stat changes if needed
        if (effect.effect.type === 'buff' || effect.effect.type === 'debuff') {
          const value = effect.effect.value || 0;
          const stat = effect.effect.stat;
          if (stat) {
            pokemon.statModifiers[stat] += (effect.effect.type === 'buff' ? -value : value);
          }
        }
        
        // Remove shields
        if (effect.effect.type === 'shield') {
          pokemon.shield = 0;
        }
        
        return false;
      }
      
      return true;
    });
  }
  
  static canAttack(pokemon: BattlePokemon): { canAttack: boolean; reason?: string } {
    // Check freeze
    if (pokemon.statusEffects.some(e => e.effect.status === 'freeze')) {
      return { canAttack: false, reason: `${pokemon.name} is frozen solid!` };
    }
    
    // Check sleep
    if (pokemon.statusEffects.some(e => e.effect.status === 'sleep')) {
      return { canAttack: false, reason: `${pokemon.name} is fast asleep!` };
    }
    
    // Check paralysis (25% chance to not move)
    if (pokemon.statusEffects.some(e => e.effect.status === 'paralyze')) {
      if (Math.random() < 0.25) {
        return { canAttack: false, reason: `${pokemon.name} is paralyzed and can't move!` };
      }
    }
    
    return { canAttack: true };
  }
  
  static getTypeEffectiveness(attackType: SkillElement, defenseType: SkillElement): number {
    const TYPE_CHART: Record<SkillElement, Record<SkillElement, number>> = {
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
    
    return TYPE_CHART[attackType]?.[defenseType] || 1;
  }
  
  static getEffectivenessText(multiplier: number): string {
    if (multiplier === 0) return "No effect!";
    if (multiplier < 1) return "Not very effective...";
    if (multiplier > 1) return "Super effective!";
    return "";
  }
  
  private static rollChance(chance: number): boolean {
    return Math.random() * 100 < chance;
  }
}