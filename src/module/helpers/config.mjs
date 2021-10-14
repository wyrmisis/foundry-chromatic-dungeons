// Data Tables
import xp, {monsterXP} from '../../systemData/xp.mjs';
import toHitMods from '../../systemData/toHitMods.mjs';
import classGroups from '../../systemData/classGroups/index.mjs';
import str from '../../systemData/attributes/strength.mjs';
import int from '../../systemData/attributes/intelligence.mjs';
import wis from '../../systemData/attributes/wisdom.mjs';
import dex from '../../systemData/attributes/dexterity.mjs';
import con from '../../systemData/attributes/constitution.mjs';
import cha from '../../systemData/attributes/charisma.mjs';

export const CHROMATIC = {};

/**
 * The set of Ability Scores used within the sytem.
 * @type {Object}
 */
CHROMATIC.attributes = { str, int, wis, dex, con, cha };

CHROMATIC.baseAC = 10;

CHROMATIC.attributeLabels = {
  "str": "BOILERPLATE.AbilityStr",
  "dex": "BOILERPLATE.AbilityDex",
  "con": "BOILERPLATE.AbilityCon",
  "int": "BOILERPLATE.AbilityInt",
  "wis": "BOILERPLATE.AbilityWis",
  "cha": "BOILERPLATE.AbilityCha"
};

CHROMATIC.attributeAbbreviations = {
  "str": "BOILERPLATE.AbilityStrAbbr",
  "dex": "BOILERPLATE.AbilityDexAbbr",
  "con": "BOILERPLATE.AbilityConAbbr",
  "int": "BOILERPLATE.AbilityIntAbbr",
  "wis": "BOILERPLATE.AbilityWisAbbr",
  "cha": "BOILERPLATE.AbilityChaAbbr"
};

CHROMATIC.xp = xp;
CHROMATIC.monsterXP = monsterXP;
CHROMATIC.toHitMods = toHitMods;

CHROMATIC.sizes = {
  tiny: "tiny",
  small: "small",
  medium: "medium",
  large: "large",
  huge: "huge",
  gargantuan: "gargantuan"
};
CHROMATIC.alignment = {
  lawful: 'Lawful',
  neutral: 'Neutral',
  chaotic: 'Chaotic'
};
CHROMATIC.weaponTypes = {melee: "Melee", thrown: 'Thrown', ranged: 'Ranged', ammunition: "Ammunition"};
CHROMATIC.weaponDamageTypes = {slashing: "Slashing", piercing: 'Piercing', bludgeoning: 'Bludgeoning', slashingPiercing: 'Slashing/Piercing'};
CHROMATIC.armorTypes = {armor: 'Armor', shield: 'Shield', helmet: 'Helmet', barding: 'Barding'};
CHROMATIC.classGroups = {...classGroups, custom: 'Custom'};

CHROMATIC.templateDir = 'systems/foundry-chromatic-dungeons/dist/templates';

CHROMATIC.spellSchools = {
  abjuration:  "Abjuration",
  alteration:  "Alteration",
  conjuration: "Conjuration",
  divination:  "Divination",
  enchantment: "Enchantment",
  evocation:   "Evocation",
  necromancy:  "Necromancy",
  illusion:    "Illusion"
};

CHROMATIC.spellPointCosts = {
  1: 2,
  2: 3,
  3: 5,
  4: 7,
  5: 9,
  6: 12,
  7: 15,
  8: 18,
  9: 21
};

CHROMATIC.saves = {
  reflex:   "Reflex",
  poison:   "Poison/Disease",
  creature: "Creature Ability",
  spell:    "Spell/Magic Item"
}

CHROMATIC.monsterTypes = {
  beast:       "Beast",
  demon:       "Demon",
  devil:       "Devil",
  dinosaur:    "Dinosaur",
  dragon:      "Dragon",
  elemental:   "Elemental",
  fey:         "Fey",
  fiend:       "Fiend",
  giant:       "Giant",
  golem:       "Golem",
  humanoid:    "Humanoid",
  lycanthrope: "Lycanthrope",
  monstrosity: "Monstrosity",
  ooze:        "Ooze",
  undead:      "Undead",
}

CHROMATIC.moveTypes = {
  move:   "Move",
  climb:  "Climb",
  fly:    "Fly",
  swim:   "Swim",
  burrow: "Burrow",
  jump:   "Jump",
  leap:   "Leap",
  web:    "Web"
};

CHROMATIC.ascii = `
,- _~. ,,                                 ,          
(' /|   ||                           _    ||   '      
((  ||  ||/\\\\ ,._-_  /'\\\\ \\\\/\\\\/\\\\  < \\, =||= \\\\  _-_ 
((  ||  || ||  ||   || || || || ||  /-||  ||  || ||   
( / |   || ||  ||   || || || || || (( ||  ||  || ||   
 -____- \\\\ |/  \\\\,  \\\\,/  \\\\ \\\\ \\\\  \\/\\\\  \\\\, \\\\ \\\\,/ 
          _/                                          

-_____                                              
 ' | -,                _                           
/| |  |\` \\\\ \\\\ \\\\/\\\\  / \\\\  _-_   /'\\\\ \\\\/\\\\  _-_, 
|| |==|| || || || || || || || \\\\ || || || || ||_.  
~|||  |, || || || || || || ||/   || || || ||  ~ || 
~-____,  \\\\/\\\\ \\\\ \\\\ \\\\_-| \\\\,/  \\\\,/  \\\\ \\\\ ,-_-  
(                       /  \\                         
                      '----\`
`;
CHROMATIC.logPrefix = 'Chromatic Dungeons | ';

CHROMATIC.ICONS = {
  DEATH: 'icons/svg/skull.svg',
  UNCONSCIOUS: 'icons/svg/unconscious.svg'
} 