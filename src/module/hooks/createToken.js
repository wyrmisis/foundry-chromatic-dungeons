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

    const {width, height} = getDimensionsForSize(token);

    token.update({ width, height });
  });

  // @todo Get this working at some point to make encounters easier to set up
  // Hooks.on('dropCanvasData', async (canvas, {type, id, pack, ...data}) => {
  //   const uuid = (pack)
  //     ? `Compendium.${pack}.${id}`
  //     : `${type}.${id}`; 

  //   console.info(uuid);

  //   const actor = await fromUuid(uuid);

  //   console.info(canvas, data, actor);

  //   const quantityRoll = new Roll(`${actor.data.data.numberAppearing}-1`);
  //   const { total } = await quantityRoll.roll({async: true});

  //   console.info(total);

  //   const t = new Token(actor.name, actor)
  // })
});

const getTokenActor = (token) => token.actor.data;

const getRolledHP = (tokenActor) => {
  const hitDice = parseInt(tokenActor.data.calculatedHitDice);
  const hitDieSize = parseInt(tokenActor.data.hitDieSize || CONFIG.CHROMATIC.defaultHitDieSize);
  const bonus = parseInt(tokenActor.data.hitDiceBonus || 0)
  
  const formula = `${hitDice}d${hitDieSize}+${bonus}`;
  const hpRoll = new Roll(formula);

  return hpRoll
    .roll({async: true})
    .then(({total}) => total);
}


const getDimensionsForSize = (token) => {
  switch (getTokenActor(token).data.size) {
    case 'tiny':        return {width: .5,  height: .5};
    case 'small':       return {width: .75, height: .75};
    case 'large':       return {width: 2,   height: 2};
    case 'huge':        return {width: 3,   height: 3};
    case 'gargantuan':  return {width: 4,   height: 4};
    case 'medium':
    default:            return {width: 1,   height: 1};
  }
}