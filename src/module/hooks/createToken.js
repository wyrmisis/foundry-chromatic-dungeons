Hooks.once("ready", async function() {
  Hooks.on('createToken', async (token, options, userId) => {
    const tokenActor = getTokenActor(token);

    if (tokenActor.type === 'npc' && !token.isLinked) {
      const hp = await getRolledHP(tokenActor);

      token.modifyActorDocument({
        ['data.hp.value']: hp,
        ['data.hp.max']: hp
      });
    }

    const {width, height} = getDimensionsForSize(token);

    token.update({ width, height });
  });
});

const getTokenActor = (token) => token.actor.data;

const getRolledHP = (tokenActor) => {
  const formula = `${parseInt(tokenActor.data.hitDice)}d6+${tokenActor.data.hitDiceBonus}`;
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