// Data Tables
import xp from '../../systemData/xp.mjs';
import toHitMods from '../../systemData/toHitMods.mjs';
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