import {
  getLevelFromXP,
  getNextLevelXP,
  getClassGroupAtLevel
} from '../../helpers/utils.mjs';

const prepareItems = (context) => {
  // Init containers
  let weapons = [],
    armor = [],
    gear = [],
    wealth = [],
    ancestry = {},
    heritages = [],
    classes = [],
    spells = [];

  
  /**
   * @todo Move this to the Class type's data model
   * @param {*} param0 
   * @returns 
   */
  // const formatClassForUse = 

  // Divide the items out
  context.items.forEach(item => {
    item.img = item.img || DEFAULT_TOKEN;

    switch (item.type) {
      case 'weapon':
        weapons.push(item);
        break;
      case 'armor':
        armor.push(item);
        break;
      case 'gear':
        gear.push(item);
        break;
      case 'goods':
      case 'treasure':
      case 'magicItem':
        wealth.push(item);
        break;
      case 'ancestry': 
        ancestry = item;
        break;
      case 'heritage': 
        heritages.push(item);
        break;
      case 'class': 
        classes.push(
          (({_id, name, system}) => {
          const level = getLevelFromXP(system.xp);
          const classGroupData = getClassGroupAtLevel(system.classGroup, level)
          
          const filteredFeatures = Object.keys(system.features)
            .filter(key => system.features?.[key].level <= level)
            .reduce((features, key) => ({ ...features, [key]: system.features[key]}), {});
      
          return {
            id: _id,
            name,
            ...system,
            level,
            ...classGroupData,
            spellSlots: system?.spellSlots?.[level],
            features: filteredFeatures,
            xpNext: getNextLevelXP(system.xp)
          }
        })(item)
        );
        break;
      case 'spell': 
        spells.push(item);
        break;
    }
  });

  // weapons and ammunition
  context.weapons = weapons
    .filter(item =>item.system.weaponType !== 'ammunition');
  context.ammunition = weapons
    .filter(item => item.system.weaponType === 'ammunition' && item.system.ammunitionType)
    .reduce((types, ammo) => {
      const currentAmmoType = ammo.system.ammunitionType;
      return (types[currentAmmoType])
        ? { ...types, [currentAmmoType]: [ ...types[currentAmmoType], ammo ] }
        : { ...types, [currentAmmoType]: [ammo] };          
    }, {});

  // gear
  context.armor = armor;
  context.gear = [
    ...gear,
    ...weapons.filter(item => item.system.weaponType === 'ammunition')
  ];
  context.wealth = wealth;
  context.spells = spells;

  // character traits
  context.ancestry = ancestry;
  context.heritages = heritages.reduce(
    (list, item) => ({...list, [item._id]: item}),
    {}
  );
  context.classes = classes;

  // Equipped gear
  context.equippedItems = [...weapons, ...armor].filter(item => item.system.equipped);
}

export default prepareItems;
