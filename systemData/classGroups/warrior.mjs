const warrior = {
  "hitDie": "d10",
  "levels": [
    {
      "hitDieCount": 1,
      "hitDieMod": 0,
      "saves": {
        "reflex": 18,
        "poison": 16,
        "creature": 17,
        "spell": 19
      },
      "addsConModToHP": true
    },
    {
      "hitDieCount": 1,
      "hitDieMod": 0,
      "saves": {
        "reflex": 16,
        "poison": 14,
        "creature": 15,
        "spell": 17
      },
      "addsConModToHP": true,
      "modToHit": 1
    },
    {
      "hitDieCount": 2,
      "hitDieMod": 0,
      "saves": {
        "reflex": 16,
        "poison": 14,
        "creature": 15,
        "spell": 17
      },
      "addsConModToHP": true,
      "modToHit": 2
    },
    {
      "hitDieCount": 3,
      "hitDieMod": 0,
      "saves": {
        "reflex": 15,
        "poison": 13,
        "creature": 14,
        "spell": 16
      },
      "addsConModToHP": true,
      "modToHit": 3
    },
    {
      "hitDieCount": 4,
      "hitDieMod": 0,
      "saves": {
        "reflex": 15,
        "poison": 13,
        "creature": 14,
        "spell": 16
      },
      "addsConModToHP": true,
      "modToHit": 4
    },
    {
      "hitDieCount": 5,
      "hitDieMod": 0,
      "saves": {
        "reflex": 13,
        "poison": 11,
        "creature": 12,
        "spell": 14
      },
      "addsConModToHP": true,
      "modToHit": 5
    },
    {
      "hitDieCount": 6,
      "hitDieMod": 0,
      "saves": {
        "reflex": 13,
        "poison": 11,
        "creature": 12,
        "spell": 14
      },
      "addsConModToHP": true,
      "modToHit": 6
    },
    {
      "hitDieCount": 7,
      "hitDieMod": 0,
      "saves": {
        "reflex": 12,
        "poison": 10,
        "creature": 11,
        "spell": 13
      },
      "addsConModToHP": true,
      "modToHit": 7
    },
    {
      "hitDieCount": 8,
      "hitDieMod": 0,
      "saves": {
        "reflex": 12,
        "poison": 10,
        "creature": 11,
        "spell": 13
      },
      "addsConModToHP": true,
      "modToHit": 8
    },
    {
      "hitDieCount": 9,
      "hitDieMod": 0,
      "saves": {
        "reflex": 10,
        "poison": 8,
        "creature": 9,
        "spell": 11
      },
      "addsConModToHP": true,
      "modToHit": 9
    },
    {
      "hitDieCount": 9,
      "hitDieMod": 3,
      "saves": {
        "reflex": 10,
        "poison": 8,
        "creature": 9,
        "spell": 11
      },
      "addsConModToHP": false,
      "modToHit": 10
    },
    {
      "hitDieCount": 9,
      "hitDieMod": 6,
      "saves": {
        "reflex": 9,
        "poison": 7,
        "creature": 8,
        "spell": 10
      },
      "addsConModToHP": false,
      "modToHit": 11
    },
    {
      "hitDieCount": 9,
      "hitDieMod": 9,
      "saves": {
        "reflex": 9,
        "poison": 7,
        "creature": 8,
        "spell": 10
      },
      "addsConModToHP": false,
      "modToHit": 12
    },
    {
      "hitDieCount": 9,
      "hitDieMod": 12,
      "saves": {
        "reflex": 7,
        "poison": 5,
        "creature": 6,
        "spell": 8
      },
      "addsConModToHP": false,
      "modToHit": 13
    },
    {
      "hitDieCount": 9,
      "hitDieMod": 15,
      "saves": {
        "reflex": 7,
        "poison": 5,
        "creature": 6,
        "spell": 8
      },
      "addsConModToHP": false,
      "modToHit": 14
    },
    {
      "hitDieCount": 9,
      "hitDieMod": 18,
      "saves": {
        "reflex": 6,
        "poison": 4,
        "creature": 5,
        "spell": 7
      },
      "addsConModToHP": false,
      "modToHit": 15
    },
    {
      "hitDieCount": 9,
      "hitDieMod": 21,
      "saves": {
        "reflex": 6,
        "poison": 4,
        "creature": 5,
        "spell": 7
      },
      "addsConModToHP": false,
      "modToHit": 16
    },
    {
      "hitDieCount": 9,
      "hitDieMod": 24,
      "saves": {
        "reflex": 5,
        "poison": 3,
        "creature": 4,
        "spell": 6
      },
      "addsConModToHP": false,
      "modToHit": 17
    },
    {
      "hitDieCount": 9,
      "hitDieMod": 27,
      "saves": {
        "reflex": 5,
        "poison": 3,
        "creature": 4,
        "spell": 6
      },
      "addsConModToHP": false,
      "modToHit": 18
    },
    {
      "hitDieCount": 9,
      "hitDieMod": 30,
      "saves": {
        "reflex": 4,
        "poison": 2,
        "creature": 3,
        "spell": 5
      },
      "addsConModToHP": false,
      "modToHit": 19
    },
    {
      "hitDieCount": 9,
      "hitDieMod": 33,
      "saves": {
        "reflex": 4,
        "poison": 2,
        "creature": 3,
        "spell": 5
      },
      "addsConModToHP": false,
      "modToHit": 20
    }
  ]
}


/* warrior.levels schema

0: {
  hitDieCount: 1,
  hitDieMod: 0,
  saves: { reflex: 18, poison: 16, creature: 17, spell: 19 },
  addsConModToHP: true,
  modToHit: 20
}


*/

export default warrior;