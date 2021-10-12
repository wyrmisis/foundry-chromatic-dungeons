import {
  hasThisAlready,
  reportAndQuit,
  getMonsterXP,
  getDerivedStatWithContext,
  getLevelFromXP,
  getClassGroupAtLevel,
  sourceId,
  getWisBonusSlots
} from '../helpers/utils.mjs';

import attackSequence from '../helpers/rollSequences/attackSequence.mjs';
import saveSequence   from '../helpers/rollSequences/saveSequence';
import attributeSequence from '../helpers/rollSequences/attributeSequence';

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
    if (this.name.includes('#[CF_tempEntity]')) return;

    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags.boilerplate || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);

    // Shared properties get set here
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

    data.perception = this._getPerception();

    data.initiative = this._getInitiative();

    if (this.isToken)
      this.token.update({ ['data.overlayEffect']: this._getOverlayIcon() });
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

    data.carryWeight = this._getCarryWeight();

    data.move = this._getMoveSpeed();

    data.spellcasting = this._getSpellSlots();

    data.maxLanguages = getDerivedStatWithContext('int', 'languages', this.data.data)
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    const data = actorData.data;

    data.ac = this._getAC();

    data.morale = parseInt(data.hitDice) + data.baseMorale;

    data.calculatedXP = getMonsterXP(
      data.hitDice,
      data.hasSpecialAbility,
      data.isExceptional
    )
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

  _getPerception() {
    return this.data.data.modPerception
      + getDerivedStatWithContext('wis', 'modPerception', this.data.data)
      + parseInt(this.data.data.perceptionMod || 0); // @todo refactor NPC template data to not have this name
  }

  /**
   * 
   * @returns Number  the initiative modifier value.
   */
  _getInitiative() {
    return (this.data.data.modInitiative || 0) + getDerivedStatWithContext('dex', 'modInitiative', this.data.data)
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
    let baseAC = (parseInt(this.data.data.baseAC) || CONFIG.CHROMATIC.baseAC);
    let ac = baseAC;

    // If the AC is equal to baseAC, it's pretty safe
    // to get the dex mod for AC, even if dex is already
    // factored into baseAC

    // If the AC is greater than baseAC, it's probably
    // a monster from the book, which has dex factored
    // into its AC

    let usingBaseAC = baseAC === CONFIG.CHROMATIC.baseAC;

    // Why both checks here?
    // * Custom monsters can't alter baseAC
    // * PCs can use the dex mod even if their
    //   base AC is higher than normal
    // * Book monsters have baseAC baked in
    if (usingBaseAC || this._isPC())
      ac += getDerivedStatWithContext('dex', 'modAgility', this.data.data);

    // The AC modifier usually comes from magic items
    // It can be used to fine-tune monster AC too!
    ac += this.data.data.modAC;
    
    // If your base AC is higher than the default base AC
    // and you're not an NPC, you don't get the benefit of 
    // armor (see Bracers of Protection, etc)
    if (this._isPC() && !usingBaseAC)
      return ac;

    const getArmor = ({data}) => data.data.equipped;

    return this
      ._getItemsOfType('armor', getArmor)
      .reduce((prev, {data}) => prev + data.data.ac, ac);
  }

  _getSaves() {
    const worstSaves = { reflex: 18, poison: 16, creature: 17, spell: 19 };

    let classGroup, level;

    if (this._isPC()) {
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

      classGroup = savingClass.data.data.classGroup;
      level = parseInt(getLevelFromXP(savingClass.data.data.xp));
    } else {
      classGroup = 'npc';
      level = parseInt(this.data.data.hitDice);
    }

    return {
      ...getClassGroupAtLevel(classGroup, level).saves
    }
  }

  _getSaveMods() {
    let { saveMods } = this.data.data;

    if (!saveMods) saveMods = {reflex: 0, poison: 0, creature: 0, spell: 0}

    return {
      ...saveMods,
      reflex: saveMods.reflex + getDerivedStatWithContext('dex', 'modAgility', this.data.data)
    }
  }

  _getMeleeToHitMod() {
    const classToHit = (this._isPC()) 
      ? this._getItemsOfType('class', ({data}) => data.data.isPrimary)[0]?.modToHit || 0
      : getClassGroupAtLevel('npc', parseInt(this.data.data.hitDice)).modToHit;

    const attrToHit = getDerivedStatWithContext('str', 'modToHit', this.data.data);

    return classToHit + attrToHit + (this.data.data.modToHit || 0);
  }

  _getRangedToHitMod() {
    const classToHit = (this._isPC()) 
      ? this._getItemsOfType('class', ({data}) => data.data.isPrimary)[0]?.modToHit || 0
      : getClassGroupAtLevel('npc', parseInt(this.data.data.hitDice)).modToHit;

    const attrToHit = getDerivedStatWithContext('dex', 'modAgility', this.data.data);

    return classToHit + attrToHit + (this.data.data.modToHit || 0);
  }

  _getStrDamageMod() {
    return (this.data.data.modDamage || 0) +
      getDerivedStatWithContext('str', 'modMeleeDamage', this.data.data);
  }

  _getRangedDamageMod() {
    return this.data.data.modDamage || 0;
  }

  _getSpellSlots() {
    const slotsFormat = (classname) => ({
      id: classname.id,
      sourceId: sourceId(classname),
      slots: getWisBonusSlots(
        classname.data.data.spellSlots[
          getLevelFromXP(classname.data.data.xp)
        ],
        classname.data.data.hasWisdomBonusSlots,
        this.data.data.attributes.wis
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

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.data.type !== 'pc') return;

    // Class levels
    // e.g. @barbarianLevel
    this._getItemsOfType('class').forEach( ({name, data: classData}) => {
      let escapedName = name.split(' ')
        .map((str, idx) => !idx 
          ? str.toLowerCase() 
          : str.replace(/^\w/, c => c.toUpperCase())
        )
        .join('') + 'Level';

      data[escapedName] = getLevelFromXP(classData.data.xp);
    });
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.data.type !== 'npc') return;

    // Process additional NPC data here.
  }

  _isPC() {
    return this.data.type === 'pc';
  }

  createEmbeddedDocuments(docname, droppedItems) {
    const filterAncestries = (droppedItem) => {
      if (droppedItem.type === 'ancestry') {
        const actorAncestry = this.items.find(item => item.type === 'ancestry');
  
        if (actorAncestry)
          return reportAndQuit(`${this.name} already has an ancestry`);
      }

      return true;
    }

    const filterPCOnlyData = (droppedItem) => {
      if (
        this.type !== 'pc' && (
        droppedItem.type === 'ancestry' ||
        droppedItem.type === 'heritage' ||
        droppedItem.type === 'class'
      ))
        return reportAndQuit('Only PCs can have an ancestry, heritage, or class');
      return true;
    }

    const filterHeritages = (droppedItem) => {
      // @todo Add a setting for number of heritages
      if (droppedItem.type === 'heritage') {
        const actorHeritages = this.items.filter(item => item.type === 'heritage');
  
        if (hasThisAlready('heritage', droppedItem, actorHeritages))
          return reportAndQuit(`${this.name} already has the ${droppedItem.name} heritage`);
  
        if (actorHeritages.length >= 2)
          return reportAndQuit(`${this.name} already has two heritages`);
      }

      return true;
    }

    const filterClasses = (droppedItem) => {
      // // // @todo Add a setting for class stat requirements
      if (droppedItem.type === 'class') {
        const actorClasses = this.items.filter(item => item.type === 'class');

        if (hasThisAlready('class', droppedItem, actorClasses))
          return reportAndQuit(`${this.name} already has the ${droppedItem.name} class`);

        const reqs = droppedItem.data.requirements
        const attributes = this.data.data.attributes;
        const missedReqs = Object.keys(reqs).filter(
          (reqKey) => attributes[reqKey] < reqs[reqKey]
        );

        if (missedReqs.length)
          return reportAndQuit(`${this.name} does not meet the attribute requirements to become a ${droppedItem.name}.`);
      }

      return true;
    }

    const filterSpell = async (droppedItem) => {
      if (droppedItem.type === 'spell') {
        const spell = await new Promise((resolve) => {
          const spellcastingClasses = this._getItemsOfType(
            'class', ({data}) => data.data.hasSpellcasting
          );

          if (!spellcastingClasses.length) {
            resolve(false);
            return false;
          }

          const classAlreadyHasSpell = caster => {
            const casterId = caster.getFlag('core', 'sourceId');
            const hasCasterSpell = this
              ._getItemsOfType('spell', ({data}) => {
                const spellKeys = Object.keys(data.data.spellLevels);

                return spellKeys.find(key => data.data.spellLevels[key].sourceId === casterId);
              })
              .some(spell => spell.getFlag('core', 'sourceId') === droppedItem.flags.core.sourceId);

            return !hasCasterSpell;
          }

          const getMaxSpellLevel = caster => {
            let casterLevel = getLevelFromXP(caster.data.data.xp);
            let maxSpellLevelFromAttributes;
            let maxSpellLevel;
            
            if (caster.data.data.hasWisdomBonusSlots) { // This is a divine caster
              if (getDerivedStatWithContext('wis', 'hasLv7Divine', this.data.data))
                maxSpellLevelFromAttributes = 7;
              else if (getDerivedStatWithContext('wis', 'hasLv6Divine', this.data.data))
                maxSpellLevelFromAttributes = 6;
              else
                maxSpellLevelFromAttributes = 5;
            } else {
              maxSpellLevelFromAttributes = getDerivedStatWithContext('int', 'maxSpellLevel', this.data.data)
            }

            if (caster.data.data.hasSpellPoints) {
              maxSpellLevel = caster.data.data.spellPoints[casterLevel].maxSpellLevel;
            } else {
              const casterSlotLevels = caster.data.data.spellSlots[casterLevel];
              maxSpellLevel = Object.keys(casterSlotLevels)
                .reduce( (level, key) =>
                  (casterSlotLevels[key] > 0) ? key : level
                , 1);
            }

            if (maxSpellLevel > maxSpellLevelFromAttributes)
              maxSpellLevel = maxSpellLevelFromAttributes;

            return maxSpellLevel;
          }

          const addSpellToCaster = (caster) => {
            const updatedSpell = { ...droppedItem };
            const {spellLevels} = updatedSpell.data;
            const key = Object
              .keys(spellLevels)
              .find(key => 
                spellLevels[key].sourceId === caster.getFlag('core', 'sourceId')
              );
            const level = spellLevels[key];

            updatedSpell.data.spellLevels = { [key]: level };

            resolve(updatedSpell);
          }

          /**
           * @todo Add filtering for "actor's slot-casting 
           *       class has max Arcane spells per spell 
           *       level for this class"
           * @todo Add filtering for "actor's points-casting
           *       class has max spells for this character level"
           */
          const buttons = spellcastingClasses
            .filter(classAlreadyHasSpell)
            .filter(caster => {
              const casterId = caster.getFlag('core', 'sourceId');

              let maxSpellLevel = getMaxSpellLevel(caster);
              
              return Object
                .keys(droppedItem.data.spellLevels)
                .filter(key => droppedItem.data.spellLevels[key].level <= maxSpellLevel)
                .reduce(
                  (arr, key) => [...arr, droppedItem.data.spellLevels[key].sourceId], []
                )
                .includes(casterId);
            })
            .reduce((buttonObj, caster) => ({
              ...buttonObj,
              [caster.uuid]: {
                icon: '<i class="fa fa-star"></i>',
                label: caster.name,
                callback: () => addSpellToCaster(caster)
              }
            }), {});

          if (!Object.keys(buttons).length) {
            resolve(false);
            return reportAndQuit(`${this.name} doesn't have any classes that can cast this spell!`);
          }

          buttons.cancel = {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize("Cancel"),
            callback: html => {
              resolve(false);
            }
          }

          new Dialog({
            title: `Adding spell ${droppedItem.name} to ${this.name}`,
            content: `Which class will you add this spell to?`,
            buttons,
            default: "close",
            close: () => {
              resolve(false);
            },
          }).render(true);
        });

        return Promise.resolve(spell);
      }
    }

    Promise
      .all(
        droppedItems.map(async (droppedItem) => {
          const passPCOnlyData  = filterPCOnlyData(droppedItem);
          const passHeritages   = filterHeritages(droppedItem);
          const passAncestries  = filterAncestries(droppedItem);
          const passClasses     = filterClasses(droppedItem);
          const passSpell       = (droppedItem.type === 'spell')
                                  ? await filterSpell(droppedItem)
                                  : true;
      
          if (
            !passPCOnlyData ||
            !passHeritages  ||
            !passAncestries ||
            !passClasses    ||
            !passSpell
          ) return false;

          if (droppedItem.type === 'spell')
            return await passSpell;
      
          return droppedItem;
        })
      )
      .then(items => {
        if (items.filter(item => !!item).length)
          super.createEmbeddedDocuments(docname, items);
      });
  }

  /**
   * @override
   */
  update(...args) {
    super
      .update(...args)
      .then(updated => this._setOverlayIconOnUpdate(updated));
  }

  _setOverlayIconOnUpdate(updated) {
    /**
     * @todo There's got to be a better way to do this.
     */
    if (updated?.isToken && updated?.token?.object) {
      const hp = updated.data.data.hp.value;
      const alreadyDead = updated.token.data.overlayEffect === CONFIG.CHROMATIC.ICONS.DEATH;
      const alreadyUnconscious = updated.token.data.overlayEffect === CONFIG.CHROMATIC.ICONS.UNCONSCIOUS;

      let isDead = false,
          isUnconscious = false;

      if (this.type === 'npc' && hp <= 0)
        isDead = true;

      if (this.type === 'pc' && hp <= -10)
        isDead = true;

      if (this.type === 'pc' && hp <= 0 && hp > -10)
        isUnconscious = true;

      const doToggle = (already, is, effect) => {
        if ((already && !is) || (!already && is))
          updated.token.object.toggleEffect(
            effect,
            {overlay: true}
          );
      }

      doToggle(alreadyDead, isDead, CONFIG.CHROMATIC.ICONS.DEATH);
      doToggle(alreadyUnconscious, isUnconscious, CONFIG.CHROMATIC.ICONS.UNCONSCIOUS);
    }

    return updated;
  }

  _getOverlayIcon() {
    if (this.data.data.hp.value <= 0)
      return CONFIG.CHROMATIC.ICONS[
        (this.type === 'pc') ? 'UNCONSCIOUS' : 'DEATH'
      ];

    if (this.data.data.hp.value <= -10)
      return CONFIG.CHROMATIC.ICONS.DEATH;

    return null;
  }


  naturalAttack(damage, attackType = 'melee') {
    return new Dialog({
      title: `Attacking with ${this.data.name}'s natural weapons`,
      content: `
        <div>
          <label for="attack-roll-modifier">Attack Modifier:</label>
          <input name="attack-roll-modifier" placeholder="-2, 4, etc"  />
        </div>

        <div>
          <label for="damage-roll-modifier">Damage Modifier:</label>
          <input name="damage-roll-modifier" placeholder="-2, 4, etc"  />
        </div>
      `,
      buttons: {
        attack: {
          label: 'Attack',
          callback: (html) => {
            const rollData = this.getRollData();

            const circumstantialAttackMod = parseInt(html.find('[name="attack-roll-modifier"]').val() || 0),
                  circumstantialDamageMod = parseInt(html.find('[name="damage-roll-modifier"]').val() || 0);

            const toHitMod = this.data.data.toHitMods[attackType],
                  damageMod = this.data.data.damageMods[attackType];

            const attackRoll = new Roll(`1d20+${toHitMod}+${circumstantialAttackMod}`, rollData).roll(),
                  damageRoll = new Roll(`${damage}+${damageMod}+${circumstantialDamageMod}`, rollData).roll();

            return attackSequence(this.data, attackRoll, damageRoll);
          }
        },
        cancel: {
          label: 'Cancel'
        }
      },
      default: 'attack'
    }).render(true);
  }

  _rollModal(label, rollType, callback) {
    let rollLabel = label
      ? `${rollType ? `[${rollType}] ` : ''}${label}`
      : '';

    let buttons = {
      roll: {
        label: 'Roll',
        callback: (html) => {
          callback(
            parseInt(html.find('[name="modifier"]').val() || 0)
          );
        }
      },
      cancel: {
        label: 'Cancel'
      }
    };
    
    return new Dialog({
      title: `${this.name} is rolling: ${rollLabel}`,
      content: `
        <div class="roll-modifiers-modal">
          <label for="modifier">Modifier:</label>
          <input name="modifier" placeholder="-2, 4, etc"  />
        </div>
      `,
      buttons,
      default: 'roll'
    });
  }

  saveRoll(name, formula, target) {
    target = parseInt(target);

    const callback = (modifier) => {
      const roll = new Roll(`${formula}+${modifier}`, this.getRollData()).roll();

      saveSequence(this, name, roll, target)
    }

    return this
      ._rollModal(name, 'save', callback)
      .render(true);
  }

  attributeRoll(name, formula, target) {
    target = parseInt(target);

    const callback = (modifier) => {
      const roll = new Roll(`${formula}-${modifier}`, this.getRollData()).roll();

      attributeSequence(this, name, roll, target)
    }

    return this
      ._rollModal(name, 'save', callback)
      .render(true);
  }
}