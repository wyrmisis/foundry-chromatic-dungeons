// Data Tables
import xp from '../../systemData/xp.mjs';
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
CHROMATIC.toHitMods = toHitMods;

CHROMATIC.weaponTypes = {melee: "Melee", thrown: 'Thrown', ranged: 'Ranged', ammunition: "Ammunition"};
CHROMATIC.weaponDamageTypes = {slashing: "Slashing", piercing: 'Piercing', bludgeoning: 'Bludgeoning', slashingPiercing: 'Slashing/Piercing'};
CHROMATIC.armorTypes = {armor: 'Armor', shield: 'Shield', helmet: 'Helmet'};
CHROMATIC.classGroups = classGroups;

CHROMATIC.templateDir = 'systems/chromatic-dungeons/templates';

CHROMATIC.mapClassGroupToToHit = (group, className) => {
  let groupClone = { ... classGroups[group] };

  groupClone.levels = Object.keys(groupClone.levels).map((level) => ({
    ...groupClone.levels[level],
    modToHit: toHitMods[className][level]
  }));

  return JSON.stringify(groupClone);
};

// When exporting to a compendium, you can use the below methods 
// from your browser console to populate a folder with spells
//
// example:
// CONFIG.CHROMATIC.addSpells(
//  [...listOfSpells], 
//  game.folders.find(({name}) => name === "Arcane Spells").id
// )
CHROMATIC.addSpells = (spellSet, folder) => {
  const type = 'spell';

  if (!spellSet) throw new Error('You must provide this script with spells to add!');
  if (!folder) throw new Error('You must provide this script with a folder ID to place the spells in!');

  // druid spells
  // const img = "systems/chromatic-dungeons/assets/spells/oak-leaf.svg";

  // arcane spells
  const img = "systems/chromatic-dungeons/assets/spells/fireball.svg";

  // cleric spells
  // const img = "systems/chromatic-dungeons/assets/spells/angel-wings.svg";

  const spells = spellSet.map(({name, components, classes, ...data}) => ({
    name,
    type,
    folder,
    data: {
      ...data,
      hasVerbalComponent: components.includes('V'),
      hasSomaticComponent: components.includes('S'),
      hasMaterialComponent: components.includes('M'),
      spellLevels: Object.keys(classes)
        .reduce((levelList, classname) => ({
          ...levelList,
          [randomID()]: { class: classname, level: classes[classname] }
        }), {})
    },
    sort: classes[Object.keys(classes)[0]],
    img
  }));

  spells.forEach(spell => Item.create(spell));
}

CHROMATIC.spellSchools = {
  abjuration: "Abjuration",
  alteration: "Alteration",
  conjuration: "Conjuration",
  divination: "Divination",
  enchantment: "Enchantment",
  evocation: "Evocation",
  necromancy: "Necromancy",
  illusion: "Illusion"
};

CHROMATIC.saves = {
  reflex: "Reflex",
  poison: "Poison/Disease",
  creature: "Creature Ability",
  spell: "Spell/Magic Item"
}

CHROMATIC.ascii = '  ### #   #    # # ####     ##      #   #     ##    ######    #      ### # \n ##  #   ##   #   ##   #   ## #    ### ##    ## #     #      ##     ##  #  \n##       ##   #   ##   #  ##   #   ######   ##   #   ##      ##    ##      \n##       ######   #####   ##   #   ## # #   ######   ##      ##    ##      \n##       ##   #   ## #    ##   #   ##   #   ##   #   ##      ##    ##      \n##   #   ##   #   ##  #   ##   #   ##   #   ##   #   ##  #   ##    ##   #  \n### ##   #    #   #   ##   ## #    #    #   #    #   ### #   #     ### ##  \n #### # #    ### #     #    ##    #    ### #    ###   ###   #       #### # \n#####    ##    #   #   #    ### #   ### #   ##      #   #    ### #  \n #  ##    #   #   ##   #   ##  #   ##  #   ## #    ##   #   ##  #   \n #   ##  ##   #   ###  #  ##      ##      ##   #   ###  #   ##      \n #   ##  ##   #   #### #  ## #### ####    ##   #   #### #    ####   \n #   ##  ##   #   ## ###  ##   #  ##      ##   #   ## ###      ###  \n #   ##  ##   #   ##  ##  ##   #  ##   #  ##   #   ##  ##   #   ##  \n ## ##    ## #    #    #  ### ##  ### ##   ## #    #    #   ## ###  \n# ###      ##    #     #   #### #  #### #   ##    #     #  # ####';
CHROMATIC.logPrefix = 'Chromatic Dungeons | ';


CHROMATIC.addWeapons = (weapons, meleeFolder, rangedFolder, ammoFolder) => {
  const cleanedWeapons = weapons
    .map(weapon => { // Pre-prep the weapon
      const weaponCopy = {...weapon};

      const asteriskCount = weaponCopy.name.split(/\*/)?.length - 1;

      const isAmmunition = weaponCopy.reach === '-';

      const isLight = weaponCopy.description.includes('Light weapon');
      const isTwoHanded = weaponCopy.description.includes('2 handed');
      const isSilvered = weaponCopy.description.includes('silvered');

      const isRanged = weaponCopy.description.includes('Ranged');
      const isThrown = weaponCopy.reach.includes('/');
      
      switch (weaponCopy.damageType) {
        case "P": weaponCopy.damageType = CHROMATIC.weaponDamageTypes.piercing; break;
        case "S": weaponCopy.damageType = CHROMATIC.weaponDamageTypes.slashing; break;
        case "B": weaponCopy.damageType = CHROMATIC.weaponDamageTypes.bludgeoning; break;
        case "P/S": weaponCopy.damageType = CHROMATIC.weaponDamageTypes.slashingPiercing; break;
      }

      // Some weapon flags
      if (asteriskCount === 3) weaponCopy.versatile = true;
      if (isLight) weaponCopy.isLight = true;
      if (isTwoHanded) weaponCopy.isTwoHanded = true;
      if (isSilvered) weaponCopy.isSilvered = true;

      // Weapon types and ranges
      weaponCopy.reach = weaponCopy.reach.replace('ft', '')

      if (isRanged) {
        weaponCopy.weaponType = 'ranged';
        weaponCopy.range = weaponCopy.reach;
        delete weaponCopy.reach;
      } else if (isThrown) {
        let [reach, range] = weaponCopy.reach.split('/');
        weaponCopy.weaponType = 'thrown';
        weaponCopy.range = range;
        weaponCopy.reach = reach;
      } else if (isAmmunition) {
        weaponCopy.weaponType = 'ammunition';
      } else weaponCopy.weaponType = 'melee';

      if (weaponCopy.range && weaponCopy.range !== '-')
        weaponCopy.range = parseInt(weaponCopy.range);
      if (weaponCopy.reach && weaponCopy.reach !== '-')
        weaponCopy.reach = parseInt(weaponCopy.reach);

      // is it ammunition?
      if (isAmmunition) weaponCopy.isAmmunition = true;

      // Ammo Types
      if (
        weaponCopy.name.indexOf('Bow') === 0 ||
        weaponCopy.name.indexOf('Arrow') === 0
      ) weaponCopy.ammunitionType = 'arrow';

      if (
        weaponCopy.name.indexOf('Crossbow') === 0 ||
        weaponCopy.name.indexOf('Quarrel') == 0
      ) weaponCopy.ammunitionType = 'bolt';

      if (weaponCopy.name.toLowerCase().indexOf('sling') === 0)
        weaponCopy.ammunitionType = 'sling';

      // Speed Factor
      if (isLight) {
        weaponCopy.speedFactor = 1;
      } else if (isTwoHanded) {
        weaponCopy.speedFactor = 3;
      } else if (isAmmunition) {
        weaponCopy.speedFactor = 0;
      } else weaponCopy.speedFactor = 2;

      weaponCopy.name = weaponCopy.name.replace(/\*/gi, '');

      // Prune off the empty fields
      return Object.keys(weaponCopy).reduce((obj, key) =>
        (weaponCopy[key] === '-') ? obj : ({ ...obj, [key]: weaponCopy[key] })
      , {});
    })
    .map( ({name, ...data}) => ({ // Prep the weapon
      name,
      type: 'weapon',
      data
    }));

  const rangedWeaponList = cleanedWeapons
    .filter(weapon => weapon.data.weaponType === 'ranged')
    .map(weapon => ({ ...weapon, folder: rangedFolder }));

  const ammoList = cleanedWeapons
    .filter(weapon => weapon.data.isAmmunition)
    .map(weapon => ({ ...weapon, folder: ammoFolder }));
  
  const meleeWeaponList = cleanedWeapons
    .filter(weapon => weapon.data.weaponType === 'melee' ||
                      weapon.data.weaponType === 'thrown')
    .map(weapon => ({ ...weapon, folder: meleeFolder }));

  [...rangedWeaponList, ...ammoList, ...meleeWeaponList]
    .forEach(weapon => Item.create(weapon));
}
