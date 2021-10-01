Hooks.once("ready", async function() {
  Hooks.on('createToken', (token, options, userId) => {
    const tokenActor = token.actor.data;

    if (tokenActor.type === 'npc' && !token.isLinked) {
      const hpRoll = new Roll(`${parseInt(tokenActor.data.hitDice)}d6+${tokenActor.data.hitDiceBonus}`);

      hpRoll
        .roll({async: true})
        .then(({total}) =>
          token.modifyActorDocument({
            ['data.hp.value']: total,
            ['data.hp.max']: total
          })
        );
    }

    return token;
  });
});