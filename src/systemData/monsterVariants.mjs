const variants = [
  {
    name: "Alchemist",
    hitDice: 2,
    description: "Spellcasting as 3rd level wizard",
    spellcasting: {
      class: 'XZsUHJbAJCgYEWc8',
      level: 3
    }
  },
  {
    name: "Assassin",
    hitDice: 3,
    description: "+4 to stealth ability checks, triple damage on surprise attacks"
  },
  {
    name: "Captain",
    hitDice: 4,
    description: "+3 bonus to damage rolls. An additional attack per round. Very likely to have good armor and weapons",
    modDamage: {
      melee: 3,
      ranged: 3,
      thrown: 3
    },
    extraAttacks: 1
  },
  {
    name: "High priest",
    hitDice: 7,
    description: "Spellcasting as 9th level cleric",
    spellcasting: {
      class: '4EiRAVCw7yGsprht',
      level: 9
    }
  },
  {
    name: "Hunter",
    hitDice: 3,
    description: "+3 to stealth ability checks, +2 to attack rolls and damage with ranged weapons",
    modDamage: {
      ranged: 2
    },
    modToHit: {
      ranged: 2
    }
  },
  {
    name: "Lieutenant/small clan chieftain",
    hitDice: 2,
    description: "+2 bonus to damage rolls. Likely to have better armor",
    modDamage: {
      melee: 2,
      ranged: 2,
      thrown: 2
    }
  },
  {
    name: "Priest",
    hitDice: 4,
    description: "Spellcasting as 5th level cleric",
    spellcasting: {
      class: '4EiRAVCw7yGsprht',
      level: 5
    }
  },
  {
    name: "Scout",
    hitDice: 1,
    description: "+2 to stealth ability check rolls"
  },
  {
    name: "Spirit Speaker",
    hitDice: 2,
    description: "Spellcasting as 3rd level druid",
    spellcasting: {
      class: 'RenVBAPUiedZiFcU',
      level: 3
    }
  },
  {
    name: "War chieftain",
    hitDice: 6,
    description: "+4 bonus to damage rolls. An additional attack per round. Assured to have good weapons and armor",
    modDamage: {
      melee: 4,
      ranged: 4,
      thrown: 4
    },
    extraAttacks: 1
  }
]

export default variants;