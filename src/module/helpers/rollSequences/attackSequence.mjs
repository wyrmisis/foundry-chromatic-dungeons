import { getFirstTargetOfSelf } from '../utils.mjs';

const statusDead = CONFIG.statusEffects[
  CONFIG.statusEffects.findIndex(({id}) => id === 'dead')
];

const statusUnconscious = CONFIG.statusEffects[
  CONFIG.statusEffects.findIndex(({id}) => id === 'unconscious')
]

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
const attackSequence = async (
  actor,
  attackRoll,
  damageRoll,
  damageSource = "natural weapons",
  triggers = {}
) => {
  if (!actor) throw new Error('An attack sequence is missing an actor!');
  if (!attackRoll) throw new Error('An attack sequence is missing an attack roll!');
  if (!damageRoll) throw new Error('An attack sequence is missing a damage roll!');

  const target = getFirstTargetOfSelf();
  const targetWasHit = !target || attackRoll.total >= target.data.data.ac;
  const targetWasDefeated = target && target.data.data.hp.value <= 0

  const diceToRoll = [
    game.dice3d.showForRoll(attackRoll, game.user, true)
  ];

  if (targetWasHit)
    diceToRoll.push(
      game.dice3d.showForRoll(damageRoll, game.user, true)
    );

  triggers.beforeAttack?.();

  /**
   * Dice So Nice! integration
   * For the pals :)
   */
  if (game?.dice3d?.showForRoll)
    await Promise.all(diceToRoll);

  await ChatMessage.create(
    getAttackMessage(
      actor,
      target,
      damageSource,
      attackRoll,
      (targetWasHit) ? damageRoll : null
    )
  )

  if (target && targetWasHit)
    await target.update({
      ['data.hp.value']: target.data.data.hp.value - damageRoll.total
    })

  if (target && targetWasDefeated)
    handleTargetDefeatedState(target)
};

const getAttackMessage = (
  actor,
  target,
  source,
  attackRoll,
  damageRoll
) => ({
  ...rollMessageOptions(actor),
  flavor: `Attacking with ${source}`,
  flags: {
    'foundry-chromatic-dungeons': {
      rollType: 'attack',
      critical: {
        success: attackRoll.dice[0].total === 20,
        failure: attackRoll.dice[0].total === 1
      },
      rolls: {
        attack: attackRoll,
        damage:  damageRoll ||  null
      },
      tooltips: {
        attack: attackRoll.dice.map(d => d.getTooltipData()),
        damage: (damageRoll)
          ? damageRoll.dice.map(d => d.getTooltipData())
          : null
      },
      source,
      actor,
      target
    }  
  }
})

const rollMessageOptions = (actor) => {
  const speaker = ChatMessage.getSpeaker({ actor });
  const rollMode = game.settings.get('core', 'rollMode');

  return ChatMessage.applyRollMode({speaker}, rollMode);
}

const handleTargetDefeatedState = async (target) => {
  console.info(!target, target.data.data.hp.value > 0)

  if (!target || target.data.data.hp.value > 0) return;

  await ChatMessage.create({
    ...rollMessageOptions(target),
    type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
    content: `${target.name} collapses in a heap from their injuries!`
  });

  const {combatant} = target?.token;

  if (combatant && !combatant.data.defeated)
    if (
      target.type === 'pc' &&
      target.data.data.hp.value >= -9
    )
      target.token.object.toggleEffect(statusUnconscious);
    else
      target.token.object.toggleEffect(statusDead);
}

export default attackSequence;