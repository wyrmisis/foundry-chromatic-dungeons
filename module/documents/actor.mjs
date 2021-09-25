import {
  getDerivedStat,
  getDerivedStatWithContext,
  getLevelFromXP,
  getNextLevelXP,
  getClassGroupAtLevel,
  reportAndQuit,
  hasThisAlready,
  sourceId
} from '../helpers/utils.mjs';

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class BoilerplateActor extends Actor {

  _getItemsOfType(filterType, filterFn = null) {
    return this.items
      .filter(({type}) => type === filterType)
      .filter(filterFn ? filterFn : () => true);
  }

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags.boilerplate || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'pc') return;
    if (this.name.includes('#')) return;

    // Make modifications to data here. For example:
    const data = actorData.data;

    // Loop through ability scores, and add their modifiers to our sheet output.
    // for (let [key, ability] of Object.entries(data.abilities)) {
    //   // Calculate the modifier using d20 rules.
    //   ability.mod = Math.floor((ability.value - 10) / 2);
    // }

    data.ac = this._getAC();

    data.toHitMods = {
      melee: this._getMeleeToHitMod(),
      thrown: this._getRangedToHitMod(),
      ranged: this._getRangedToHitMod()
    };
    
    data.damageMods = {
      melee: this._getStrDamageMod(),
      thrown: this._getStrDamageMod(),
      ranged: this._getRangedDamageMod()
    };

    data.saves = {
      targets: this._getSaves(),
      mods: this._getSaveMods()
    };

    data.carryWeight = this._getCarryWeight();

    data.move = this._getMoveSpeed();

    data.spellcasting = this._getSpellSlots();
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const data = actorData.data;
    data.xp = (data.cr * data.cr) * 100;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  _getCarryWeight() {
    let items = [].concat(
      this._getItemsOfType('weapon'),
      this._getItemsOfType('armor'),
      this._getItemsOfType('gear'),
      this._getItemsOfType('goods'),
      this._getItemsOfType('magicItems'),
      this._getItemsOfType('treasure')
    );

    console.info(`${CONFIG.CHROMATIC.logPrefix}`, this.items)

    let totalItemWeight = items.reduce(
      (prev, curr) => prev + curr.data.data.weight.value,
      0
    );

    Object.keys(this.data.data.wealth).forEach(
      (coinType) => totalItemWeight += (
        this.data.data.wealth[coinType] / 10
      )
    );

    return {
      value: totalItemWeight,
      min: 0,
      max: getDerivedStatWithContext('str', 'carryWeight', this.data.data)
    }
  }

  _getMoveSpeed() {
    return this.data.data.modMove + (this._getItemsOfType('ancestry')[0]?.data?.data?.movement || 0)
  }

  _getAC() {
    const baseAC = 10 + 
      this.data.data.modAC + 
      getDerivedStatWithContext('dex', 'modAgility', this.data.data);

    return this
      ._getItemsOfType('armor', ({data}) => data.data.equipped)
      .reduce((prev, {data}) => prev + data.data.ac, baseAC);
  }

  _getSaves() {
    const worstSaves = { reflex: 18, poison: 16, creature: 17, spell: 19 };

    let savingClass = this
      ._getItemsOfType('class', ({data}) => data.data.isSelectedSaveTable)[0];

    if (!savingClass) savingClass = this._getItemsOfType('class')[0];

    if (!savingClass?.data?.data) {
      ui?.notifications?.warn(`Actor ${this.name} doesn't have a class!`);
      return worstSaves;
    }

    if (!savingClass?.data?.data?.classGroup) {
      ui?.notifications?.warn(`${this.name}'s class doesn't have a class group!`)
      return worstSaves;
    }

    const level = getLevelFromXP(savingClass.data.data.xp);

    return {
      ...getClassGroupAtLevel(savingClass.data.data.classGroup, level).saves
    }
  }

  _getSaveMods() {
    const { saveMods, attributes } = this.data.data;

    return {
      ...saveMods,
      reflex: saveMods.reflex + getDerivedStatWithContext('dex', 'modAgility', this.data.data)
    }
  }

  _getMeleeToHitMod() {
    const classToHit = this._getItemsOfType('class', ({data}) => data.data.isPrimary)[0]?.modToHit || 0;

    const attrToHit = getDerivedStatWithContext('str', 'modToHit', this.data.data);

    return classToHit + attrToHit + this.data.data.modToHit;
  }

  _getRangedToHitMod() {
    const classToHit = this._getItemsOfType('class', ({data}) => data.data.isPrimary)[0]?.modToHit || 0;

    const attrToHit = getDerivedStatWithContext('dex', 'modAgility', this.data.data);

    return classToHit + attrToHit + this.data.data.modToHit;
  }

  _getStrDamageMod() {
    return this.data.data.modDamage +
      getDerivedStatWithContext('str', 'modMeleeDamage', this.data.data);
  }

  _getRangedDamageMod() {
    return this.data.data.modDamage;
  }

  _getSpellSlots() {
    const wisScore = this.data.data.attributes.wis;
    const wisTable = CONFIG.CHROMATIC.attributes.wis;

    const bonusSlots = (wisScore) => Object
      .keys(CONFIG.CHROMATIC.attributes.wis)
      .filter(key => parseInt(key) <= wisScore) // Get scores equal to or below the character's score
      .reduce((extraSlots, key) => // Pick out bonus divine spell levels
        [...extraSlots, wisTable[key].bonusDivineSpellLevel],
        []
      )
      .filter(val => val) // Prune off undefineds
      .reduce((bonus, value, key) => // Accumulate total extra slots per level
        (bonus[key])
          ? ({ ...bonus, [value]: bonus[value] + 1 })
          : ({ ...bonus, [value]: 1 }),
        {}
      );

    const addBonusSlots = (slots, addsBonusSlots) => {
      const bonus = bonusSlots(wisScore);
      return addsBonusSlots 
        ? Object
          .keys(slots)
          .reduce((finishedObj, slot) => ({
              ...finishedObj,
              [slot]: (slots[slot])
                ? slots[slot] + (bonus[slot] || 0)
                : 0
          }), {})
        : slots;
    }

    const slotsFormat = (classname) => ({
      id: classname.id,
      sourceId: sourceId(classname),
      slots: addBonusSlots(
        classname.data.data.spellSlots[
          getLevelFromXP(classname.data.data.xp)
        ],
        classname.data.data.hasWisdomBonusSlots
      ),
      name: classname.name,
      preparedSpells: classname.data.data.preparedSpells
    });

    const slotsTemplate = ({id, sourceId, name, slots, preparedSpells}) => ({
      [id]: {
        name,
        sourceId,
        slots: {
          1: { max: slots[1], preparedSpells: preparedSpells?.[1] || [] },
          2: { max: slots[2], preparedSpells: preparedSpells?.[2] || [] },
          3: { max: slots[3], preparedSpells: preparedSpells?.[3] || [] },
          4: { max: slots[4], preparedSpells: preparedSpells?.[4] || [] },
          5: { max: slots[5], preparedSpells: preparedSpells?.[5] || [] },
          6: { max: slots[6], preparedSpells: preparedSpells?.[6] || [] },
          7: { max: slots[7], preparedSpells: preparedSpells?.[7] || [] },
          8: { max: slots[8], preparedSpells: preparedSpells?.[8] || [] },
          9: { max: slots[9], preparedSpells: preparedSpells?.[9] || [] }
        }
      }
    });

    const pointsFormat = (classname) => {
      const {
        maxSpellPoints,
        maxSpellLevel,
        spellsKnown
      } = classname.data.data.spellPoints[
        getLevelFromXP(classname.data.data.xp)
      ];
      const { currentSpellPoints } = classname.data.data;

      return ({
        id: classname.id,
        name: classname.name,
        sourceId: sourceId(classname),
        maxSpellPoints,
        currentSpellPoints,
        maxSpellLevel,
        spellsKnown
      })
    };

    const pointsTemplate = ({
      id,
      name,
      sourceId,
      maxSpellPoints,
      currentSpellPoints,
      maxSpellLevel,
      spellsKnown
    }) => ({
      [id]: {
        name,
        value: currentSpellPoints || 0,
        min: 0, 
        sourceId,
        max: maxSpellPoints,
        spellsKnown,
        maxSpellLevel
      }
    });

    const castingClasses = this
      ._getItemsOfType(
        'class',
        ({data}) => data.data.hasSpellcasting && !data.data.hasSpellPoints
      )
      .map(slotsFormat)
      .map(slotsTemplate);

    const pointsClasses = this
    ._getItemsOfType(
      'class',
      ({data}) => data.data.hasSpellcasting && data.data.hasSpellPoints
    )
    .map(pointsFormat)
    .map(pointsTemplate);

    return [...castingClasses, ...pointsClasses]
      .reduce((obj, classname) => ({ ...obj, ...classname }), {});
  }

  prepareSpell(...args) {
    console.info(args);
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.data.type !== 'pc') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    // if (data.abilities) {
    //   for (let [k, v] of Object.entries(data.abilities)) {
    //     data[k] = foundry.utils.deepClone(v);
    //   }
    // }

    // Add level for easier access, or fall back to 0.
    // if (data.attributes.level) {
    //   data.lvl = data.attributes.level.value ?? 0;
    // }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.data.type !== 'npc') return;

    // Process additional NPC data here.
  }
}