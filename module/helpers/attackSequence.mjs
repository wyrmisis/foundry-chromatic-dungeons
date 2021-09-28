import { getFirstTargetOfSelf } from '../helpers/utils.mjs';

/**
 * Execute a sequence of chat messages for attack actions.
 * @param actor 
 * @param attackRoll 
 * @param damageRoll 
 * @param damageSource
 * @param triggers 
 * @param triggers.beforeAttack
 * @returns 
 */
const attackSequence = (
  actor,
  attackRoll,
  damageRoll,
  damageSource = "natural weapons",
  triggers = {}
) => {
  // EMOTE: 3
  // IC: 2
  // OOC: 1
  // OTHER: 0
  // ROLL: 5

  console.info(actor);
  
  if (!actor) throw new Error('An attack sequence is missing an actor!');
  if (!attackRoll) throw new Error('An attack sequence is missing an attack roll!');
  if (!damageRoll) throw new Error('An attack sequence is missing a damage roll!');

  const target = getFirstTargetOfSelf();

  const rollMessageOptions = (newActor) => {
    const speaker = ChatMessage.getSpeaker({ actor: newActor || actor });
    const rollMode = game.settings.get('core', 'rollMode');

    return { speaker, rollMode };
  }

  return attackRoll
    .toMessage({
      ...rollMessageOptions(),
      flavor: `Attacking with ${damageSource}...`,
    })
    .then(result => {
      triggers.beforeAttack?.();

      if (target && attackRoll.total < target.data.data.ac) {
        ChatMessage.create({
          ...rollMessageOptions(),
          content: `${actor.name}'s attack <strong>misses</strong>!`
        });

        return Promise.reject();
      }

      return damageRoll
        .toMessage({
          ...rollMessageOptions(),
          flavor: `Damage with ${damageSource}`,
        });
    })
    .then(damageResult => (!damageResult || !target || damageRoll.total <= 0)
        ? null
        : target.update({
          ['data.hp.value']: target.data.data.hp.value - damageRoll.total
        })
    )
    .then(updatedTarget => {
      if (updatedTarget && updatedTarget.data.data.hp.value <= 0) 
        return ChatMessage.create({
          ...rollMessageOptions(updatedTarget),
          type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
          content: `${updatedTarget.name} collapses in a heap from their injuries!`
        });
    });
};

export default attackSequence;