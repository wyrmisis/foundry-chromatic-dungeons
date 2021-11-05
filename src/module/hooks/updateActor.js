import {getStatus, rollMessageOptions} from '../helpers/utils';

Hooks.once("ready", async function() {
  Hooks.on('updateActor', async (actor) => {
    if (!actor.token) return;
    
    const combatant = game.combat.getCombatantByToken(actor.token.id);    
    const hp = actor.data.data.hp.value;
    const isUnconscious =
      actor.type === 'pc' &&
      hp <= 0 &&
      hp >= -9;
    const isDead =
      (actor.type === 'pc' && hp <= -10) ||
      (actor.type === 'npc' && hp <= 0);

    if (isDead)
      await ChatMessage.create({
        ...rollMessageOptions(actor),
        type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
        content: `${actor.name} breathes their last!`
      })
    else if (isUnconscious)
      await ChatMessage.create({
        ...rollMessageOptions(actor),
        type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
        content: `${actor.name} collapses in a heap from their injuries!`
      });

    await actor.token.object.toggleEffect(
      getStatus('unconscious').icon,
      {active: (isUnconscious && !isDead), overlay: true}
    );

    if (combatant)
      await combatant.update({defeated: isDead});

    if (isDead)
      await actor.token.object.toggleEffect(
        getStatus('dead').icon,
        {active: (isDead), overlay: true}
      );
  });
});
