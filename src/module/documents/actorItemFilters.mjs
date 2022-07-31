import {
  hasThisAlready,
  reportAndQuit,
  getDerivedStatWithContext,
  getLevelFromXP,
  getAllItemsOfType,
  getItemsOfActorOfType
} from '../helpers/utils.mjs';

export const filterStartingKit = async (kit) => {
  const { contents } = kit.data;
  const gear = await getAllItemsOfType('gear', 'foundry-chromatic-dungeons.gear');
  const selectedKeys = Object.keys(contents);
  const selectedItems = gear
    .filter(item => selectedKeys.includes(item.id))
    .map(item => {
      const clone = structuredClone(item);
      clone.system.quantity.value = contents[item.id]
      delete clone.effects;
      return clone;
    });

  return selectedItems;
};

export const filterHeritages = (droppedItem, {items, name}) => {
  if (droppedItem.type === 'heritage') {
    const maxHeritages = game.settings.get("foundry-chromatic-dungeons", "max-heritages");

    const actorHeritages = items.filter(item => item.type === 'heritage');

    if (hasThisAlready('heritage', droppedItem, actorHeritages))
      return reportAndQuit(`${name} already has the ${droppedItem.name} heritage`);

    if (actorHeritages.length >= maxHeritages)
      return reportAndQuit(`${name} already has ${maxHeritages} heritage${maxHeritages === 1 ? '' : 's'}.`);
  }

  return true;
};

export const filterAncestries = (droppedItem, {items, name}) => {
  if (droppedItem.type === 'ancestry') {
    const actorAncestry = items.find(item => item.type === 'ancestry');

    if (actorAncestry)
      return reportAndQuit(`${name} already has an ancestry`);
  }

  return true;
};

export const filterClasses = (droppedItem, {items, name, system}) => {
  // @todo Add a setting for class stat requirements
  if (droppedItem.type === 'class') {
    const actorClasses = items.filter(item => item.type === 'class');

    if (hasThisAlready('class', droppedItem, actorClasses))
      return reportAndQuit(`${name} already has the ${droppedItem.name} class`);

    const canRestrict = game.settings.get("foundry-chromatic-dungeons", "class-restrictions");

    if (canRestrict) {
      const reqs = droppedItem.system.requirements
      const attributes = system.attributes;
      const missedReqs = Object.keys(reqs).filter(
        (reqKey) => attributes[reqKey] < reqs[reqKey]
      );

      if (missedReqs.length)
        return reportAndQuit(`${name} does not meet the attribute requirements to become a ${droppedItem.name}.`);
    }
  }

  return true;
};

export const filterPCOnlyData = (droppedItem, {type}) => {
  if (
    type !== 'pc' && (
    droppedItem.type === 'ancestry' ||
    droppedItem.type === 'heritage' ||
    droppedItem.type === 'class'
  ))
    return reportAndQuit('Only PCs can have an ancestry, heritage, or class');
  return true;
};

export const filterSpell = async (droppedItem, actor) => {
  if (droppedItem.type === 'spell') {
    const spell = await new Promise((resolve) => {
      const spellcastingClasses = getItemsOfActorOfType(
        actor, 'class', ({system}) => system.hasSpellcasting
      );

      if (!spellcastingClasses.length) {
        resolve(false);
        return false;
      }

      const classAlreadyHasSpell = caster => {
        const casterId = caster.getFlag('core', 'sourceId');
        const hasCasterSpell = getItemsOfActorOfType(
          actor,
          'spell',
          ({system}) => {
            const spellKeys = Object.keys(system.spellLevels);

            return spellKeys.find(key => system.spellLevels[key].sourceId === casterId);
          })
          .some(spell => spell.getFlag('core', 'sourceId') === droppedItem.flags.core.sourceId);

        return !hasCasterSpell;
      }

      const getMaxSpellLevel = caster => {
        let casterLevel = getLevelFromXP(caster.system.xp);
        let maxSpellLevelFromAttributes;
        let maxSpellLevel;
        
        if (caster.system.hasWisdomBonusSlots) { // This is a divine caster
          if (getDerivedStatWithContext('wis', 'hasLv7Divine', actor.system))
            maxSpellLevelFromAttributes = 7;
          else if (getDerivedStatWithContext('wis', 'hasLv6Divine', actor.system))
            maxSpellLevelFromAttributes = 6;
          else
            maxSpellLevelFromAttributes = 5;
        } else {
          maxSpellLevelFromAttributes = getDerivedStatWithContext('int', 'maxSpellLevel', actor.system)
        }

        if (caster.system.hasSpellPoints) {
          maxSpellLevel = caster.system.spellPoints[casterLevel].maxSpellLevel;
        } else {
          const casterSlotLevels = caster.system.spellSlots[casterLevel];
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
        const {spellLevels} = updatedSpell.system;
        const key = Object
          .keys(spellLevels)
          .find(key => 
            spellLevels[key].sourceId === caster.getFlag('core', 'sourceId')
          );
        const level = spellLevels[key];

        updatedSpell.system.spellLevels = { [key]: level };

        resolve(updatedSpell);
      }

      const eligibleCasterClasses = spellcastingClasses
        .filter(classAlreadyHasSpell)
        .filter(caster => {
          const casterId = caster.getFlag('core', 'sourceId');

          let maxSpellLevel = getMaxSpellLevel(caster);
          
          return Object
            .keys(droppedItem.system.spellLevels)
            .filter(key => droppedItem.system.spellLevels[key].level <= maxSpellLevel)
            .reduce(
              (arr, key) => [...arr, droppedItem.system.spellLevels[key].sourceId], []
            )
            .includes(casterId);
        });

      if (eligibleCasterClasses.length === 1) {
        addSpellToCaster(eligibleCasterClasses[0]);
        return;
      }

      /**
       * @todo Add filtering for "actor's slot-casting 
       *       class has max Arcane spells per spell 
       *       level for this class"
       * @todo Add filtering for "actor's points-casting
       *       class has max spells for this character level"
       */
      const buttons = eligibleCasterClasses
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
        return reportAndQuit(`${actor.name} doesn't have any classes that can cast this spell!`);
      }

      buttons.cancel = {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("Cancel"),
        callback: html => {
          resolve(false);
        }
      }

      new Dialog({
        title: `Adding spell ${droppedItem.name} to ${actor.name}`,
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
};