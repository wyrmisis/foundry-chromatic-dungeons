const getDerivedStat = (attrAbbr, attrValue, derivedKey) =>
  CONFIG.CHROMATIC.attributes[attrAbbr][attrValue][derivedKey];


export {
  getDerivedStat
};