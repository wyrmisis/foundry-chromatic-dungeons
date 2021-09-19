const getDerivedStat = (attrAbbr, attrValue, derivedKey) =>
  CONFIG.CHROMATIC.attributes[attrAbbr][attrValue][derivedKey];

const getDerivedStatWithContext = (attrAbbr, derivedKey, context) =>
  CONFIG.CHROMATIC.attributes[attrAbbr][context.attributes[attrAbbr]][derivedKey];

const getSelf = () => game.users.find(user => user.id === game.userId);

const getFirstTargetOfSelf = () => getSelf()?.targets?.values()?.next()?.value?.actor;

const getLevelFromXP = (xp) =>
  CONFIG.CHROMATIC.xp.reduce(
    (level, xpRow) =>
      (xp >= xpRow.xp) ? xpRow.level : level,
    0
  );

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

const getNextLevelXP = (xp) =>
  CONFIG.CHROMATIC.xp.find(
    (xpRow) => xp < xpRow.xp
  ).xp;

const reportAndQuit = (msg) => {
  ui.notifications.error(msg);
  return false;
};

const hasThisAlready = (type, droppedItem, actorItems) => {
  const actorItemsOfType = actorItems.filter(item => item.type === type);

  if (actorItemsOfType.find( ({name}) => name === droppedItem.name))
    return true;
};

const range = (start, end, length = end - start + 1) =>
  Array.from({ length }, (_, i) => start + i);

export {
  getLevelFromXP,
  getNextLevelXP,
  getClassGroupAtLevel,
  getDerivedStat,
  getDerivedStatWithContext,
  reportAndQuit,
  hasThisAlready,
  range,
  getSelf,
  getFirstTargetOfSelf
};