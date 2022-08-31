import {
  getMeleeToHitMod,
  getRangedToHitMod,
  getRangedDamageMod,
  getStrDamageMod,
  sharedSchemaKeys,
  numberFieldsFromKeys
} from './helpers.mjs';

import {
  getDerivedStatWithContext,
  getLevelFromXP,
  getClassGroupAtLevel,
  sourceId,
  getWisBonusSlots,
  getItemsOfActorOfType
} from '../../helpers/utils.mjs';

class PCDataModel extends foundry.abstract.DataModel {
  #toHitMods = {};
  #damageMods = {};
  #saveMods = {};

  constructor() {
    super(...arguments);

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

  get #classToHitMod() {
    return getItemsOfActorOfType(
      this.parent, 
      'class',
      ({system}) => system.isPrimary
    )[0]?.system.modToHit || 0;
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
      melee:  this.modMeleeToHit,
      ranged: this.modRangedToHit,
      thrown: this.modThrownToHit
    };
  }

  get modMeleeToHit ()        { return this.#toHitMods.melee || getMeleeToHitMod(this, this.#classToHitMod, true) }
  set modMeleeToHit (change)  { this.#toHitMods.melee = change }

  get modRangedToHit ()       { return this.#toHitMods.ranged || getRangedToHitMod(this, this.#classToHitMod, true)}
  set modRangedToHit (change) { this.#toHitMods.ranged = change }
  
  get modThrownToHit ()       { return this.#toHitMods.thrown || getRangedToHitMod(this, this.#classToHitMod, true)}
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
    const { SchemaField, StringField, NumberField, ArrayField, ObjectField } = foundry.data.fields;

    const wealthKeys = [ "cp", "sp", "ep", "gp", "pp" ];

    return {
      ...sharedSchemaKeys(),
      description: new StringField(),
      spellSlots: new ObjectField(),
      languages: new ArrayField(
        new StringField()
      ),
      wealth: new SchemaField({
        ...Object.keys(wealthKeys).reduce(
          (prev, curr) => ({
            ...prev,
            [wealthKeys[curr]]: new NumberField()
          }),
          {}
        )
      })
    };
  }

  get perception() {
    return this.modPerception + getDerivedStatWithContext('wis', 'modPerception', this)
  }

  get saves() {
    const savingClass = getItemsOfActorOfType(
        this.parent,
        'class',
        ({system}) => system.isSelectedSaveTable
      )[0] || getItemsOfActorOfType(this.parent, 'class')[0];

    if (!savingClass?.system?.classGroup)
      return CONFIG.CHROMATIC.worstSaves;

    return getClassGroupAtLevel(
      savingClass.system.classGroup,
      parseInt(getLevelFromXP(savingClass.system.xp))
    ).saves
  }

  get hands() {
    return 2;
  }

  get ac() {
      let baseAC = (parseInt(this.baseAC) || CONFIG.CHROMATIC.baseAC);
      let ac = baseAC;
      let usingBaseAC = baseAC === CONFIG.CHROMATIC.baseAC;

      // PCs can use the dex mod even if their
      // base AC is higher than normal
      ac += getDerivedStatWithContext('dex', 'modAgility', this);

      // The AC modifier usually comes from magic items
      // It can be used to fine-tune monster AC too!
      ac += this.modAC;
      
      // If your base AC is higher than the default base AC
      // and you're not an NPC, you don't get the benefit of 
      // armor (see Bracers of Protection, etc)
      if (!usingBaseAC) return ac;

      const getArmor = ({system}) => system.equipped;

      return getItemsOfActorOfType(this.parent, 'armor', getArmor)
        .reduce((prev, {system}) => prev + system.ac, ac);
  }

  get move() {
    const useEncumbrance = game.settings.get('foundry-chromatic-dungeons', 'encumbrance');
    
    const move = (
        this.modMove +
        (getItemsOfActorOfType(this.parent, 'ancestry')[0]?.system?.movement || 0)
      ) * this.moveMultiplier
    
    if (!useEncumbrance) return move;
    
    let penalty = 0;

    // If we're not a warrior, we are penalized for wearing heavy armor
    const getArmor = ({system}) => system.equipped && system.encumbrancePenalty;
    const getWarriorGroupClasses = ({system}) => system.classGroup === 'warrior';
    const wornArmor = getItemsOfActorOfType(this.parent, 'armor', getArmor);
    const isWarrior = getItemsOfActorOfType(
      this.parent,
      'class',
      getWarriorGroupClasses
    ).length > 0;

    const {
      atHalf,
      atThreeQuarters,
      atFull
    } = this.carryWeight;

    if (!isWarrior && wornArmor.length)
      penalty += wornArmor[0].system.encumbrancePenalty;

    if      (atFull)          penalty += 100
    else if (atThreeQuarters) penalty += 50
    else if (atHalf)          penalty += 25
    
    if (penalty > 100)
      penalty = 100;

    return Math.floor(
      move - (move * (penalty / 100))
    );
  }

  get carryWeight() {
    let items = [].concat(
      getItemsOfActorOfType(this.parent, 'weapon'),
      getItemsOfActorOfType(this.parent, 'armor'),
      getItemsOfActorOfType(this.parent, 'gear'),
      getItemsOfActorOfType(this.parent, 'goods'),
      getItemsOfActorOfType(this.parent, 'magicItems'),
      getItemsOfActorOfType(this.parent, 'treasure')
    );

    let totalItemWeight = items.reduce(
      (prev, curr) => prev + curr.system.weight.value,
      0
    );

    const maxCarryWeight = getDerivedStatWithContext('str', 'carryWeight', this);

    Object.keys(this.wealth).forEach(
      (coinType) => totalItemWeight += (
        this.wealth[coinType] / 10
      )
    );

    return {
      value:            totalItemWeight,
      min:              0,
      max:              maxCarryWeight,
      oneQuarter:      (maxCarryWeight * .25),
      half:            (maxCarryWeight * .5 ),
      threeQuarters:   (maxCarryWeight * .75),
      atOneQuarter:    (maxCarryWeight * .25) <= totalItemWeight,
      atHalf:          (maxCarryWeight * .5 ) <= totalItemWeight,
      atThreeQuarters: (maxCarryWeight * .75) <= totalItemWeight,
      atFull:           maxCarryWeight        <= totalItemWeight
    }
  }

  get spellcasting() {
    const slotsFormat = (pcClass) => ({
      id: pcClass.id,
      sourceId: sourceId(pcClass),
      slots: getWisBonusSlots(
        pcClass.system.spellSlotsAtLevel,
        pcClass.system.hasWisdomBonusSlots,
        this.attributes.wis
      ),
      name: pcClass.name,
      preparedSpells: pcClass.system.preparedSpellObjects
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
      } = classname.system.spellPoints[
        getLevelFromXP(classname.system.xp)
      ];
      const { currentSpellPoints } = classname.system;

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

    const castingClasses = getItemsOfActorOfType(
      this.parent, 
        'class',
        ({system}) => system.hasSpellcasting && !system.hasSpellPoints
      )
      .map(slotsFormat)
      .map(slotsTemplate);

    const pointsClasses = getItemsOfActorOfType(
      this.parent, 
      'class',
      ({system}) => system.hasSpellcasting && system.hasSpellPoints
    )
    .map(pointsFormat)
    .map(pointsTemplate);

    if (!castingClasses.length && !pointsClasses.length)
      return null;

    return [...castingClasses, ...pointsClasses]
      .reduce((obj, classname) => ({ ...obj, ...classname }), {});
  }

  get skills() {
    const skillSets = this.classes.filter(
      ({system}) => !!system.skills && 
                    !foundry.utils.isEmpty(system.skills)
    )
    .map(({name, system}) => ({
      name,
      skills: Object.keys(system.skills).map(skill => {
        const skillObj = system.skills[skill];

        return (skillObj.name !== 'Perception')
          ? skillObj
          : {
            ...skillObj,
            bonus: skillObj.bonus + this.perception
          };
      })
    }));

    return (skillSets.length)
      ? skillSets
      : [{
        name: 'Common Skills',
        skills: [{
          name: 'Perception',
          attribute: 'wis',
          bonus: this.perception
        }]
      }];
  }

  get maxLanguages() {
    return getDerivedStatWithContext('int', 'languages', this)
  }

  get swim() {
    const modHP = getDerivedStatWithContext('con', 'modHP', this);
    const getArmor = ({system}) => system.equipped && system.swimPenalty;
    const hasArmorPenalty = !!getItemsOfActorOfType(this.parent, 'armor', getArmor).length;

    let speed = 10;
    let conPenalty = 0;
    let roundsBeforeChecks = this.attributes.con;
    let roundsOfHeldBreath = (modHP >= 1) ? modHP * 2 : 1;

    const {
      atOneQuarter,
      atHalf,
      atThreeQuarters,
      atFull
    } = this.carryWeight;

    if (hasArmorPenalty) {
      speed -= 5;
      conPenalty -= 7;
    }

    if (atOneQuarter) {
      speed -= 5;
      conPenalty -= 7;
    } else if (atHalf || atThreeQuarters) {
      speed = (hasArmorPenalty) ? 0 : speed - 5;
      conPenalty -= 10;
    } else if (atFull) {
      speed = 0;
      conPenalty -= 10;
    }

    return {
      speed,
      conPenalty,
      roundsBeforeChecks,
      roundsOfHeldBreath
    };
  }

  get initiative() {
    return (this.modInitiative || 0) + getDerivedStatWithContext('dex', 'modInitiative', this)
  }

  get ancestry() {
    return this.parent.items.find(({type}) => type === 'ancestry');
  }

  get heritage() {
    return this.parent.items.filter(({type}) => type === 'heritage');
  }

  get classes() {
    return this.parent.items.filter(({type}) => type === 'class');
  }

  get classList() {
    return this.classes
      .map(({name, system}) => `${system.level} ${name}`)
      .join('/&shy;')
  }
}

export default PCDataModel;

