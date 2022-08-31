import {
  getLevelFromXP,
  getItemsOfActorOfType
} from '../helpers/utils.mjs';

import saveSequence   from '../helpers/rollSequences/saveSequence';
import attributeSequence from '../helpers/rollSequences/attributeSequence';

import rollModal from '../dialogs/roll.mjs';

import {
  filterAncestries,
  filterClasses,
  filterHeritages,
  filterPCOnlyData,
  filterCharacterOnlyData,
  filterSpell,
  filterStartingKit
} from './actorItemFilters.mjs';

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
class ChromaticActor extends Actor {

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    if (this.type === 'party') return; // Party doesn't use any of this

    const rollData = {
      attributes: {},
      saves: {}
    };

    // Prepare character roll data.
    this.type === 'pc' && this._getCharacterRollData(rollData);
    this.type === 'npc' && this._getNPCRollData(rollData);

    Object.keys(CONFIG.CHROMATIC.attributes).forEach(key => {
      rollData.attributes[key] = {
        value: this.system.attributes[key],
        mod: this.system.attributeMods[key]
      }
    });

    Object.keys(CONFIG.CHROMATIC.saves).forEach(key => {
      rollData.saves[key] = {
        value: this.system.saves[key],
        mod: this.system.saveMods[key]
      }
    });

    rollData.toHitMods = this.system.toHitMids;
    rollData.damageMods = this.system.damageMods;

    return rollData;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    // Class levels
    // e.g. @barbarianLevel
    getItemsOfActorOfType(this, 'class').forEach( ({name, system}) => {
      let escapedName = name.split(' ')
        .map((str, idx) => !idx 
          ? str.toLowerCase() 
          : str.replace(/^\w/, c => c.toUpperCase())
        )
        .join('') + 'Level';

      data[escapedName] = getLevelFromXP(system.xp);
    });
  }

  /**
   * Prepare NPC/Monster roll data.
   */
   _getNPCRollData(data) {
    data.modMorale = this.system.modMorale;
  }

  async _onCreate(actor, options, user) {
    const attributeKeys = ['str', 'int', 'wis', 'dex', 'con', 'cha'];
    const formula = game.settings.get('foundry-chromatic-dungeons', 'autoroll-pc-stats');
    
    await super._onCreate(actor, options, user);
    
    if (actor.type !== 'pc') return;
    if (formula === 'manual') return;
    if (attributeKeys.every(key =>
      this.system.attributes[key] !== 3
    )) return;

    const rolls = new Array(
      new Roll(formula, {async: true}),
      new Roll(formula, {async: true}),
      new Roll(formula, {async: true}),
      new Roll(formula, {async: true}),
      new Roll(formula, {async: true}),
      new Roll(formula, {async: true})
    );
  
    await Promise.all(rolls.map(
      roll => roll.roll()
    ));

    const totals = rolls.map(roll => roll.total);
    const attributes = attributeKeys.reduce((prev, curr, i) => ({
      ...prev,
      [curr]: totals[i]
    }), {});

    await this.update({ 'system.attributes': attributes, '_id': actor.id });
  }

  createEmbeddedDocuments(docname, droppedItems) {
    Promise.all(
      droppedItems.map(async (droppedItem) => {
        if (this.type === 'npc' && droppedItem.type === 'spell')
          return droppedItem;

        const passCharaacterOnlyData =
                                filterCharacterOnlyData(droppedItem, this);
        const passPCOnlyData  = filterPCOnlyData(droppedItem, this);
        const passHeritages   = filterHeritages(droppedItem, this);
        const passAncestries  = filterAncestries(droppedItem, this);
        const passClasses     = filterClasses(droppedItem, this);
        const passSpell       = (droppedItem.type === 'spell')
                                ? await filterSpell(droppedItem, this)
                                : true;
        const passStartingKit = (droppedItem.type === 'starterkit')
                                ? await filterStartingKit(droppedItem)
                                : true

        if (droppedItem.type === 'starterkit') {
          this.createEmbeddedDocuments(docname, passStartingKit)
          return false;
        }

        if (
          !passCharaacterOnlyData ||
          !passPCOnlyData ||
          !passHeritages  ||
          !passAncestries ||
          !passClasses    ||
          !passSpell      ||
          !passStartingKit
        ) return false;

        if (droppedItem.type === 'spell')
          return await passSpell;
    
        return droppedItem;
      })
    ).then(items => {
      if (items.filter(item => !!item).length)
        super.createEmbeddedDocuments(docname, items);
    });
  }

  saveRoll(key, progModifier = 0) {
    const target = this.system.saves[key];
    const name = game.i18n.localize(`SHEET.save.${key}`);
    const callback = async (modifier) => {
      const roll = new Roll(`1d20 + @saves.${key}.mod + ${parseInt(modifier) + progModifier}`, this.getRollData());
      const rollResult = await roll.roll({ async: true });
      saveSequence(this, name, rollResult, target)
    }
    return rollModal(this.name, name, 'save', callback).render(true);
  }

  attributeRoll(key, progModifier = 0) {
    const target = this.system.attributes[key];
    const name = game.i18n.localize(`ATTRIBUTE.${key}`);
    const callback = async (modifier) => {
      const roll = new Roll(`1d20 - @attributes.${key}.mod - ${parseInt(modifier) + progModifier}`, this.getRollData());
      const rollResult = await roll.roll({ async: true });
      attributeSequence(this, name, rollResult, target)
    }
    return rollModal(this.name, name, 'attribute', callback).render(true);
  }

  moraleRoll(progModifier = 0) {
    const name = game.i18n.localize(`SHEET.save.morale`);
    const callback = async (modifier) => {
      const roll = new Roll(`1d20 + @modMorale + ${parseInt(modifier) + progModifier}`, this.getRollData());
      const rollResult = await roll.roll({ async: true });
      saveSequence(this, name, rollResult, this.system.morale)
    }
    return rollModal(this.name, name, 'save', callback).render(true);
  }
}

export default ChromaticActor;
