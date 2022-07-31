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
    spells = [];

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

  // Equipped gear
  context.equippedItems = [...weapons, ...armor].filter(item => item.system.equipped);
}

export default prepareItems;
