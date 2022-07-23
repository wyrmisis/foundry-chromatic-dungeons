const getDerivedStat = (attrAbbr, attrValue, derivedKey) => {
  if (attrValue < 3)  attrValue = 3;
  if (attrValue > 25) attrValue = 25;
  return CONFIG.CHROMATIC.attributes[attrAbbr][attrValue][derivedKey];
}

const getDerivedStatWithContext = (attrAbbr, derivedKey, context) => {
  let attrValue = context.attributes[attrAbbr];
  if (attrValue < 3)  attrValue = 3;
  if (attrValue > 25) attrValue = 25;
  return CONFIG.CHROMATIC.attributes[attrAbbr][attrValue][derivedKey];
}

const getSelf = () => game.users.find(user => user.id === game.userId);

const getFirstTargetOfSelf = () => getSelf()?.targets?.values()?.next()?.value?.actor;

const get20thLevelXP = () => CONFIG.CHROMATIC
  .xp.find(({level}) => level === 20).xp

const getNextLevelXP = (xp) =>
  (xp < get20thLevelXP())
    ? CONFIG.CHROMATIC.xp.find(
      (xpRow) => xp < xpRow.xp
    ).xp
    : get20thLevelXP();

const getLevelFromXP = (xp) =>
  (xp < get20thLevelXP())
    ? CONFIG.CHROMATIC.xp.reduce(
      (level, xpRow) =>
        (xp >= xpRow.xp) ? xpRow.level : level,
      0
    )
    : 20

const getClassGroupAtLevel = (classGroup, level) => {
  if (level > 20) level = 20;
  if (level < 0) level = 0;

  let group = {
    ... CONFIG.CHROMATIC.classGroups[classGroup]
  };

  const reducedGroup = {
    ...group,
    ...group.levels[level]
  };

  delete reducedGroup.levels;

  return reducedGroup;
};

const reportAndQuit = (msg) => {
  ui.notifications.error(msg);
  return false;
};

const hasThisAlready = (type, droppedItem, actorItems) => !!(
  actorItems
    .filter(item => item.type === type)
    .find((item) => sourceId(item) === sourceId(droppedItem))
);

const sourceId = (item) =>
  item.getFlag 
    ? item.getFlag('core', 'sourceId')
    : item.flags.core.sourceId;

const range = (start, end, length = end - start + 1) =>
  Array.from({ length }, (_, i) => start + i);

const bonusSlots = (wisScore) => Object
  .keys(CONFIG.CHROMATIC.attributes.wis)
  .filter(key => parseInt(key) <= wisScore) // Get scores equal to or below the character's score
  .reduce((extraSlots, key) => // Pick out bonus divine spell levels
    [...extraSlots, CONFIG.CHROMATIC.attributes.wis[key].bonusDivineSpellLevel],
    []
  )
  .filter(val => val) // Prune off undefineds
  .reduce((bonus, value, key) => {// Accumulate total extra slots per level
    return (bonus[key])
      ? ({ ...bonus, [value]: bonus[value] + 1 })
      : ({ ...bonus, [value]: 1 })
    },
    {}
  );

const getWisBonusSlots = (slots, addsBonusSlots, wisScore) => {
  const bonus = (addsBonusSlots) ? bonusSlots(wisScore) : null;

  return (!!bonus)
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

const getStatus = (status) =>
  CONFIG.statusEffects.find(({id}) => id === status);
  

const rollMessageOptions = (actor) => {
  const speaker = ChatMessage.getSpeaker({ actor });
  const rollMode = game.settings.get('core', 'rollMode');

  return ChatMessage.applyRollMode({speaker}, rollMode);
};

const getVisionAndLight = (token, tokenActor) => {
  // const dimSight    = tokenActor.data?.senses?.infravision  || 0 ;
  // const brightSight = tokenActor.data?.senses?.blindvision  || 0 ;
  
  // const dimLight    = tokenActor.data?.light?.dim           || 0 ; 
  // const brightLight = tokenActor.data?.light?.bright        || 0 ;
  // const lightType   = tokenActor.data?.light?.type          || '';

  // console.info({
  //   dimSight,
  //   brightSight,
  //   dimLight,
  //   brightLight,
  //   vision: true,
  //   'lightAnimation.type': lightType
  // })

  // return token.update({
  //   dimSight,
  //   brightSight,
  //   dimLight,
  //   brightLight,
  //   vision: true,
  //   'lightAnimation.type': lightType
  // });
}

/**
 * 
 * @param {string} itemType The `type` of item you want to retrieve
 * @param {string} compendiumName The name of the compendium you want to read from. Usually starts with `foundry-chromatic-dungeons.`
 * @returns 
 */
const getAllItemsOfType = async (itemType, compendiumName) => {
  const compendium = game.packs.get(compendiumName);
  const compendiumItems = compendium.index
    .filter(({name}) => !name.includes('#'));
  const compendiumItemObjects = await Promise.all(
    compendiumItems.map(({_id}) => compendium.getDocument(_id))
  );

  return [
    ...compendiumItemObjects.filter(({type}) => type === itemType),
    ...game.items.filter(({type}) => type === itemType)
  ];
}

const getItemsOfActorOfType = (actor, filterType, filterFn = null) =>
  actor.items
    .filter(({type}) => type === filterType)
    .filter(filterFn ? filterFn : () => true);

export {
  getLevelFromXP,
  getNextLevelXP,
  getClassGroupAtLevel,
  getDerivedStat,
  getDerivedStatWithContext,
  getAllItemsOfType,
  getItemsOfActorOfType,
  reportAndQuit,
  hasThisAlready,
  range,
  sourceId,
  getSelf,
  getFirstTargetOfSelf,
  getWisBonusSlots,
  getStatus,
  rollMessageOptions,
  getVisionAndLight
};