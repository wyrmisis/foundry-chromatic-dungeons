import {
  getMeleeToHitMod,
  getRangedToHitMod,
  getRangedDamageMod,
  getStrDamageMod,
  sharedSchemaKeys
} from './helpers.mjs';


import {
  getDerivedStatWithContext,
  getClassGroupAtLevel,
  getItemsOfActorOfType
} from '../../helpers/utils.mjs';

class NPCDataModel extends foundry.abstract.DataModel {
  #toHitMods = {};
  #damageMods = {};
  #saveMods = {};

  modMorale = 0;

  constructor() {
    super(...arguments);

    const classMod = getClassGroupAtLevel('npc', parseInt(this.calculatedHitDice)).modToHit;

    this.#toHitMods ={
      melee: getMeleeToHitMod(this, classMod),
      thrown: getRangedToHitMod(this, classMod),
      ranged: getRangedToHitMod(this, classMod)
    }

    this.#damageMods = {
      melee: getStrDamageMod(this),
      thrown: getStrDamageMod(this),
      ranged: getRangedDamageMod(this)
    }

    this.#saveMods = {
      reflex: getDerivedStatWithContext('dex', 'modAgility', this),
      poison: 0,
      creature: 0,
      spell: 0
    }
  }

  /**
   * ======== MODIFIER ACCESSORS ========
   * We use these for managing active effects for nested values.
   * Each should have:
   * * Getter
   * * Setter
   * * Backing private value (initially configured in the constructor)
   * * Group accessor, if necessary (e.g. saves, to hit, damage)
   */

  /**
   * -------- TO HIT MODS --------
   * This relies on the character class's To Hit table, and you can't
   * get items from inside the DataModel's constructor; hence this
   * weird looking setup.
   */
  get toHitMods() {
    return {
      melee: this.#toHitMods.melee,
      ranged: this.#toHitMods.ranged,
      thrown: this.#toHitMods.thrown
    }
  }

  get modMeleeToHit ()        { return this.#toHitMods.melee }
  set modMeleeToHit (change)  { this.#toHitMods.melee = change }

  get modRangedToHit ()       { return this.#toHitMods.ranged }
  set modRangedToHit (change) { this.#toHitMods.ranged = change }
  
  get modThrownToHit ()       { return this.#toHitMods.thrown }
  set modThrownToHit (change) { this.#toHitMods.thrown = change }

  /**
   * -------- DAMAGE MODS --------
   */
  get damageMods() { return this.#damageMods }

  get modMeleeDamage ()        { return this.#damageMods.melee }
  set modMeleeDamage (change)  { this.#damageMods.melee = change }

  get modRangedDamage ()       { return this.#damageMods.ranged }
  set modRangedDamage (change) { this.#damageMods.ranged = change }

  get modThrownDamage ()       { return this.#damageMods.thrown }
  set modThrownDamage (change) { this.#damageMods.thrown = change }
  
  /**
   * -------- SAVE MODS --------
   */
  get saveMods() { return this.#saveMods }

  get modReflexSave ()       { return this.#saveMods.reflex }
  set modReflexSave (change) { this.#saveMods.reflex = change }

  get modPoisonSave ()        { return this.#saveMods.poison }
  set modPoisonSave (change)  { this.#saveMods.poison = change }

  get modCreatureSave ()        { return this.#saveMods.creature }
  set modCreatureSave (change)  { this.#saveMods.creature = change }

  get modSpellSave ()       { return this.#saveMods.spell }
  set modSpellSave (change) { this.#saveMods.spell = change }

  // @todo define schema
  static defineSchema() {
    const { ObjectField, BooleanField, StringField, NumberField } = foundry.data.fields;

    return {
      ...sharedSchemaKeys(),
      type: new StringField(),
      numberAppearing: new StringField(),
      numberInLair: new StringField(),
      size: new StringField(),
      description: new StringField(),
      perceptionMod: new NumberField(),
      treasure: new StringField(),
      hitDice: new NumberField(),
      hitDiceBonus: new NumberField(),
      hitDieSize: new NumberField(),
      canAutocalculateHP: new BooleanField(),
      baseMorale: new NumberField(),
      specialDefenses: new StringField(),
      magicResistance: new StringField(),
      attacks: new StringField(),
      specialAttacks: new StringField(),
      move: new ObjectField(),
      xp: new NumberField(),
      variant: new StringField(),
      isExceptional: new BooleanField(),
      hasSpecialAbility: new BooleanField(),
      canAutocalculateXP: new BooleanField()
    }
  }

  // @todo lift all NPC specific stuff -- use `get` for computed stuff!

  get ac() {
    if (!this.attributes) return;

    let baseAC = (parseInt(this.baseAC) || CONFIG.CHROMATIC.baseAC);
    let ac = baseAC;

    if (baseAC === CONFIG.CHROMATIC.baseAC)
      ac += getDerivedStatWithContext('dex', 'modAgility', this);

    ac += this.modAC;
    
    const getArmor = ({system}) => system.equipped;

    return getItemsOfActorOfType(
        this.parent,
        'armor',
        getArmor
      )
      .reduce((prev, {system}) => prev + system.ac, ac);
  }

  get saves() {
    return getClassGroupAtLevel('npc', this.calculatedHitDice).saves
  }

  get saveMods() {
    const saveMods = { reflex: 0, poison: 0, creature: 0, spell: 0 }

    return {
      ...saveMods,
      reflex: saveMods.reflex + getDerivedStatWithContext('dex', 'modAgility', this)
    }
  }

  get morale() {
    return parseInt(this.baseMorale) - parseInt(this.calculatedHitDice)
  }
  
  get monsterVariant() {
    return CONFIG.CHROMATIC.monsterVariants[this.variant]
  }

  get calculatedXP() {
    const hd = this.calculatedHitDice;

    const {base, special, exceptional} = 
      CONFIG.CHROMATIC.monsterXP[(hd < 25) ? hd : 25];

    if (this.isExceptional) return base + exceptional;
    if (this.hasSpecialAbility) return base + special;
    return base;
  }

  get displayedXP() {
    if (this.canAutocalculateXP) return this.calculatedXP;
    else return this.xp;
  }

  get calculatedHitDice() {
    return (!this.variant)
      ? this.hitDice
      : parseInt(this.hitDice) + parseInt(this.monsterVariant.hitDice);
  }

  get initiative() {
    return (this.modInitiative || 0) + getDerivedStatWithContext('dex', 'modInitiative', this)
  }

  get perception() {
    return this.modPerception
      + getDerivedStatWithContext('wis', 'modPerception', this)
      + parseInt(this.perceptionMod || 0);
  }
}

export default NPCDataModel;
