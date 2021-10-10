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

const getMonsterXP = (
  hd = 0,
  isSpecial,
  isExceptional
) => {
  const {base, special, exceptional} = 
    CONFIG.CHROMATIC.monsterXP[(hd < 25) ? hd : 25];

  if (isExceptional) return base + exceptional;
  if (isSpecial) return base + special;
  return base;
}

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
    console.info(bonus, value, key)

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

export {
  getMonsterXP,
  getLevelFromXP,
  getNextLevelXP,
  getClassGroupAtLevel,
  getDerivedStat,
  getDerivedStatWithContext,
  reportAndQuit,
  hasThisAlready,
  range,
  sourceId,
  getSelf,
  getFirstTargetOfSelf,
  getWisBonusSlots
};