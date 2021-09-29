const npc = {
  hitDie: "d6",
  levels: [ // An NPC's hit dice is their "level"
    {
        modToHit: 0,
        saves: { reflex: 15, poison: 16, creature: 17, spell: 19 }
    },
    {
        modToHit: 0,
        saves: { reflex: 13, poison: 14, creature: 15, spell: 17 }
    },
    {
        modToHit: 1,
        saves: { reflex: 13, poison: 14, creature: 15, spell: 17 }
    },
    {
        modToHit: 2,
        saves: { reflex: 12, poison: 13, creature: 14, spell: 16 }
    },
    {
        modToHit: 3,
        saves: { reflex: 12, poison: 13, creature: 14, spell: 16 }
    },
    {
        modToHit: 4,
        saves: { reflex: 11, poison: 11, creature: 12, spell: 14 }
    },
    {
        modToHit: 5,
        saves: { reflex: 11, poison: 11, creature: 12, spell: 14 }
    },
    {
        modToHit: 6,
        saves: { reflex: 10, poison: 19, creature: 11, spell: 13 }
    },
    {
        modToHit: 6,
        saves: { reflex: 10, poison: 19, creature: 11, spell: 13 }
    },
    {
        modToHit: 7,
        saves: { reflex: 9, poison: 8, creature: 9, spell: 11 }
    },
    {
        modToHit: 8,
        saves: { reflex: 9, poison: 8, creature: 9, spell: 11 }
    },
    {
        modToHit: 9,
        saves: { reflex: 8, poison: 7, creature: 8, spell: 10 }
    },
    {
        modToHit: 9,
        saves: { reflex: 8, poison: 7, creature: 8, spell: 10 }
    },
    {
        modToHit: 10,
        saves: { reflex: 7, poison: 5, creature: 6, spell: 8 }
    },
    {
        modToHit: 11,
        saves: { reflex: 7, poison: 5, creature: 6, spell: 8 }
    },
    {
        modToHit: 12,
        saves: { reflex: 6, poison: 4, creature: 5, spell: 7 }
    },
    {
        modToHit: 12,
        saves: { reflex: 6, poison: 4, creature: 5, spell: 7 }
    },
    {
        modToHit: 13,
        saves: { reflex: 5, poison: 3, creature: 4, spell: 6 }
    },
    {
        modToHit: 14,
        saves: { reflex: 5, poison: 3, creature: 4, spell: 6 }
    },
    {
        modToHit: 15,
        saves: { reflex: 4, poison: 2, creature: 3, spell: 5 }
    },
    {
        modToHit: 16,
        saves: { reflex: 4, poison: 2, creature: 3, spell: 5 }
    }
  ]
};

export default npc;