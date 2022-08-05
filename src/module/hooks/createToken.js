import { getVisionAndLight } from '../helpers/utils';

Hooks.once("ready", async function() {
  Hooks.on('createToken', async (token, options, userId) => {
    const tokenActor = getTokenActor(token);

    if (tokenActor.type === 'npc' && tokenActor.data.canAutocalculateHP) {
      const hp = await getRolledHP(tokenActor);

      token.modifyActorDocument({
        ['data.hp.value']: hp,
        ['data.hp.max']: hp
      });
    }

    await doLightingUpdates(token, tokenActor);

    const {width, height} = getDimensionsForSize(token);

    await token.update({ width, height });
  });

  // @todo Get this working at some point to make encounters easier to set up
  // Hooks.on('dropCanvasData', async (canvas, {type, id, pack, ...data}) => {
  //   const uuid = (pack)
  //     ? `Compendium.${pack}.${id}`
  //     : `${type}.${id}`; 

  //   console.info(uuid);

  //   const actor = await fromUuid(uuid);

  //   console.info(canvas, data, actor);

  //   const quantityRoll = new Roll(`${actor.system.numberAppearing}-1`);
  //   const { total } = await quantityRoll.roll({async: true});

  //   console.info(total);

  //   const t = new Token(actor.name, actor)
  // })
});

const getTokenActor = (token) => token.actor.system;

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


const doLightingUpdates = (token, actor) =>
  getVisionAndLight(token, actor);

const getDimensionsForSize = (token) => {
  switch (getTokenActor(token).size) {
    case 'tiny':        return {width: .5,  height: .5};
    case 'small':       return {width: .75, height: .75};
    case 'large':       return {width: 2,   height: 2};
    case 'huge':        return {width: 3,   height: 3};
    case 'gargantuan':  return {width: 4,   height: 4};
    case 'medium':
    default:            return {width: 1,   height: 1};
  }
}