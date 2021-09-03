const getDerivedStat = (attrAbbr, attrValue, derivedKey) =>
  CONFIG.CHROMATIC.attributes[attrAbbr][attrValue][derivedKey];

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

const range = (start, end, length = end - start + 1) =>
  Array.from({ length }, (_, i) => start + i)

export {
  getLevelFromXP,
  getNextLevelXP,
  getClassGroupAtLevel,
  getDerivedStat,
  range
};