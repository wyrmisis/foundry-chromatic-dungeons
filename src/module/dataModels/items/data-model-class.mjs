import {
  getDerivedStatWithContext,
  getWisBonusSlots,
} from '../../helpers/utils.mjs';

class ClassDataModel extends foundry.abstract.DataModel {
  #classGroup = {};
  #xpForLevel20 = CONFIG.CHROMATIC.xp.find(({level}) => level === 20).xp

  constructor() {
    super(...arguments);
    this.#classGroup = CONFIG.CHROMATIC.classGroups[this.classGroup];
  }


  // @todo define schema
  static defineSchema() {
    const { BooleanField, SchemaField, StringField, NumberField, ArrayField, ObjectField } = foundry.data.fields;

    return {
      "description": new StringField(),
      "classGroup": new StringField(),
      "xp": new NumberField({min: 0}),
      "requirements": new SchemaField({
        "str": new NumberField(),
        "int": new NumberField(),
        "wis": new NumberField(),
        "dex": new NumberField(),
        "con": new NumberField(),
        "cha": new NumberField()
      }),
      "resources": new ObjectField(),
      "features": new ObjectField(),
      "skills": new ObjectField(),
      "spellPoints": new ObjectField(),
      "spellSlots": new ObjectField(),
      "preparedSpells": new SchemaField({
        "1": new ArrayField(new StringField()),
        "2": new ArrayField(new StringField()),
        "3": new ArrayField(new StringField()),
        "4": new ArrayField(new StringField()),
        "5": new ArrayField(new StringField()),
        "6": new ArrayField(new StringField()),
        "7": new ArrayField(new StringField()),
        "8": new ArrayField(new StringField()),
        "9": new ArrayField(new StringField())
      }),
      "currentSpellPoints": new NumberField(),
      "hasSkills": new BooleanField(),
      "hasSpellcasting": new BooleanField(),
      "hasSpellPoints": new BooleanField(),
      "hasFullSpellList": new BooleanField(),
      "hasWisdomBonusSlots": new BooleanField(),
      "weaponProf": new StringField(),
      "armorProf": new StringField(),
      "statBonus": new StringField(),
      "isPrimary": new BooleanField(),
      "isSelectedSaveTable": new BooleanField()
    };
  }

  get #classGroupAtLevel() {
    return this.#classGroup.levels[this.level];
  }

  get featuresAtLevel() {
    return Object.keys(this.features)
        .filter(key => this.features?.[key].level <= this.level)
        .reduce((features, key) => ({ ...features, [key]: this.features[key]}), {});
  }
  get spellSlotsAtLevel() {
    return this?.spellSlots?.[this.level] || null;
  }
  get spellPointsAtLevel() {
    return this?.spellPoints?.[this.level] || null;
  }

  get classGroupProps() {
    return this.#classGroup;
  }

  get level() {
    return (this.xp < this.#xpForLevel20)
      ? CONFIG.CHROMATIC.xp.reduce(
        (level, xpRow) =>
          (this.xp >= xpRow.xp) ? xpRow.level : level,
        0
      )
      : 20
  }

  get xpToPrevLevel() {
    return (this.xp >= CONFIG.CHROMATIC.xp[0])
      ? 0
      : CONFIG.CHROMATIC.xp[this.level - 1].xp;
  }

  get xpToNextLevel() {
    return (this.xp < this.#xpForLevel20)
      ? CONFIG.CHROMATIC.xp.find(
        (xpRow) => this.xp < xpRow.xp
      ).xp
      : this.#xpForLevel20;
  }

  get hitDice () {
    const maxLevelWithHitDice = this.#classGroup.levels.findIndex(i => i.hitDieMod);

    const parentConMod = (this.parent.parent)
      ? (
        getDerivedStatWithContext('con', 'modHP', this.parent.parent) *
        (this.level >= maxLevelWithHitDice ? maxLevelWithHitDice : this.level)
      )
      : 0;

    if (this.classGroup !== 'warrior' && parentConMod > 2)
      parentConMod = 2;
    
    const totalMod = this.#classGroupAtLevel.hitDieMod + parentConMod;

    const dieSize = this.#classGroup.hitDie;
    const dieCount = this.#classGroupAtLevel.hitDieCount;

    return `${dieCount}d${dieSize}+${totalMod}`;
  }

  get saves () {
    return this.#classGroupAtLevel.saves;
  }

  get modToHit() {
    return this.#classGroupAtLevel.modToHit;
  }

  get preparedSpellSlots() {
    if (!this.hasSpellcasting) return null;

    let characterSpells;
    
    try {
      characterSpells = this.parent?.parent?.items.filter(item => item.type === 'spell');
    } catch (e) {
      characterSpells = [];
    }

    return Object.keys(this.preparedSpells)
      .map(level => this.preparedSpells[level]
        .map(id => characterSpells.find(item => item.id === id)));
  }

  get preparedSpellObjects() {
    return Object.keys(this.preparedSpells).reduce((list, spellLevel) => {
      return {
        ...list,
        [spellLevel]: this.preparedSpells[spellLevel].map((spell) => {
          return this.parent.parent.items.get(spell)
        })
      }
    }, {});
  }

  // class methods

  async prepareSpell(spell, level) {
    const maxSlotsAtLevel = (!this.hasWisdomBonusSlots)
      ? this.spellSlotsAtLevel
      : getWisBonusSlots(
          this.spellSlotsAtLevel,
          this.hasWisdomBonusSlots,
          this.parent?.parent?.system.attributes.wis
        )[level];

    const preparedSpellsAtLevel = [...this.preparedSpells[level]];

    if (preparedSpellsAtLevel.length >= maxSlotsAtLevel) {
      ui.notifications.warn(`You've already prepared as many level ${level} ${this.name} spells as you can!`)
      return false;
    }

    return await this.parent.update({
      ['system.preparedSpells']: {
        [level]: [...preparedSpellsAtLevel, spell.id]
      }
    });
  }

  castSpell(spellId, spellLevel) {
    try {
      if (this.hasSpellPoints) {
        /**
         * @todo Empowered Casting dialog
         */

        const spellToCast = this.parent?.parent?.items.get(spellId);
        const cost = CONFIG.CHROMATIC.spellPointCosts[spellLevel];

        if (parseInt(this.currentSpellPoints) >= cost)
          spellToCast.roll().then(() => {
            this.parent.update({
              ['system.currentSpellPoints']: parseInt(this.currentSpellPoints) - cost
            });
          })
        else
          reportAndQuit(`You don't have enough spell points to cast ${spellToCast.name}!`)

      } else {
        return this.preparedSpellSlots[parseInt(spellLevel) - 1]
          .find(spell => spell.id === spellId)          
          .roll()
          .then(() => this.clearSpell(spellId, spellLevel));
      }
    } catch (e) {
      ui.notifications.warn('You can\'t cast a spell from an empty slot!');
    }
  }

  async clearSpell(spellId, spellLevel) {
    const spellToPrune = this.preparedSpells[spellLevel]
          .findIndex(spell => spell.indexOf(spellId) >= 0)

    const copiedSpellsAtLevel = [...this.preparedSpells[spellLevel]];

    copiedSpellsAtLevel.splice(spellToPrune, 1);

    return await this.parent.update({
      [`system.preparedSpells.${spellLevel}`]: copiedSpellsAtLevel
    });
  }

  hasSpellAsPrepared(spellId, spellLevel) {
    return this.preparedSpells[spellLevel]
      .some(spell => spell.indexOf(spellId) >= 0)
  }
}

export default ClassDataModel;

