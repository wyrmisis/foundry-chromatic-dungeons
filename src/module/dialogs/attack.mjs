const generateWeaponDialog = (actor, item, callback) => {
  let buttons = {};

  const actorAmmunitionForWeapon = actor.items.filter((ammo) => isItemAmmoAndAboveZeroQty(ammo, item));
  const weaponIsVersatile = item.system.versatile;
  const basicAttack = {
    label: 'Attack',
    callback: (html) => doCallback(callback, html)
  };

  switch (item.system.weaponType) {
    case "melee":
      buttons.attack = basicAttack;
      break;
    case "ranged":
      if (!actorAmmunitionForWeapon.length && item.system.ammunitionType !== 'infinite') {
        return {
          render: () => ui.notifications.warn(`You are out of ammunition for your ${item.name}!`)
        };
      }
      buttons.attack = {
        label: 'Fire',
        callback: (html) => {
          const ammoToUse = (item.system.ammunitionType !== 'infinite')
            ? actor.items.get(html.find('[name="ammunition-item"]').val())
            : null;
          let args = [callback, html];
          if (ammoToUse)
            args = [
              ...args,
              ammoToUse,
              ['arrow', 'sling']
                .includes(ammoToUse.system.ammunitionType)
            ];

            doCallback(...args);
        }
      };
      break;
    case "thrown":
      if (item.system.quantity.value <= 0) {
        return {
          render: () => ui.notifications.warn(`${actor.name} has already thrown their last ${item.name}!`)
        };
      }
      buttons.attack = basicAttack;
      buttons.throw = {
        label: 'Throw',
        callback: (html) => doCallback(callback, html, item)
      };
  }
  
  buttons.cancel = {
    label: 'Cancel'
  }

  return new Dialog({
    title: `Attacking with ${actor.name}'s ${item.name}`,
    content: `
      <div class="roll-modifiers-field roll-modifiers-field--attack">
        <label for="attack-roll-modifier">Attack Modifier:</label>
        <input name="attack-roll-modifier" placeholder="-2, 4, etc"  />
      </div>

      <div class="roll-modifiers-field roll-modifiers-field--damage">
        <label for="damage-roll-modifier">Damage Modifier:</label>
        <input name="damage-roll-modifier" placeholder="-2, 4, etc"  />
      </div>

      ${weaponIsVersatile && actorHasHandFree(actor) ? (`
        <div class="roll-modifiers-field roll-modifiers-field--is-versatile">
          <label for="is-versatile">Use both hands?</label>
          <input name="is-versatile" type="checkbox" />
        </div>
      `) : ''}

      ${(
        item.system.ammunitionType !== 'infinite' &&
        actorAmmunitionForWeapon.length
      ) ? (`
      <div class="roll-modifiers-field roll-modifiers-field--ammunition">
        <label for="ammunition-item">Ammunition to use:</label>
        <select name="ammunition-item">
          ${actorAmmunitionForWeapon.reduce((optionStr, ammo) => 
            optionStr + `<option value=${ammo.id}>${ammo.name}</option>`, ''
          )}
        </select>
      </div>
      `) : ''}
    `,
    buttons,
    default: 'attack'
  });
}

const doCallback = (callback, html, ammoItem, useDamage) => {
  const circumstantialAttackMod = parseInt(html.find('[name="attack-roll-modifier"]').val() || 0);
  const circumstantialDamageMod = parseInt(html.find('[name="damage-roll-modifier"]').val() || 0);
  const isVersatile = !!html.find('[name="is-versatile"]:checked').length;

  callback({
    circumstantialAttackMod,
    circumstantialDamageMod,
    isVersatile,
    ammoItem,
    useDamage
  });
}

const isItemAmmoAndAboveZeroQty = (ammo, item) => {
  if (ammo.type !== 'weapon') return false;

  return  ammo.system.quantity.value > 0 &&
          ammo.system.weaponType === 'ammunition' &&
          ammo.system.ammunitionType === item.system.ammunitionType;
}

const actorHasHandFree = (actor) =>
  actor.items.filter(i => {
    if (!i.system.equipped)
      return false;
    if (i.type === 'armor' && i.system.armorType === 'shield')
      return true;
    return (i.type === 'weapon')
  }).length === 1;

  export default generateWeaponDialog;
  