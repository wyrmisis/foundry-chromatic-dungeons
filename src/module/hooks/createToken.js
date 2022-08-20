import { getVisionAndLight } from '../helpers/utils';

Hooks.once("ready", async function() {
  Hooks.on('createToken', async (token, options, userId) => {
    if (token.actor.type === 'npc' && token.actor.system.canAutocalculateHP) {
      const hp = await getRolledHP(token.actor.system);

      token.modifyActorDocument({
        ['system.hp.value']: hp,
        ['system.hp.max']: hp
      });
    }

    await token.update(
      getDimensionsForSize(token)
    );
  });
});

const getRolledHP = ({calculatedHitDice, hitDieSize, hitDiceBonus}) => {
  const hitDice = parseInt(calculatedHitDice);
  const size = parseInt(hitDieSize || CONFIG.CHROMATIC.defaultHitDieSize);
  const bonus = parseInt(hitDiceBonus || 0)
  
  const formula = `${hitDice}d${size}+${bonus}`;
  const hpRoll = new Roll(formula);

  return hpRoll
    .roll({async: true})
    .then(({total}) => total);
}

const getDimensionsForSize = (token) => {
  switch (token.actor.system.size) {
    case 'tiny':        return {width: .5,  height: .5};
    case 'small':       return {width: .75, height: .75};
    case 'large':       return {width: 2,   height: 2};
    case 'huge':        return {width: 3,   height: 3};
    case 'gargantuan':  return {width: 4,   height: 4};
    case 'medium':
    default:            return {width: 1,   height: 1};
  }
}