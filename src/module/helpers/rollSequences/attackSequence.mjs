import { getFirstTargetOfSelf, rollMessageOptions } from '../utils.mjs';

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
  const targetWasHit =
    !target ||
    attackRoll.total >= target.data.data.ac ||
    attackRoll.dice[0].total === 20;
  const critical = {
    success: true,
    // success: attackRoll.dice[0].total === 20 && attackRoll.total - target.data.data.ac > 0,
    failure: attackRoll.dice[0].total === 1
  }
  const critType = game.settings.get('foundry-chromatic-dungeons', 'critical-hits');
  let critEffect;

  const diceToRoll = [
    game.dice3d.showForRoll(attackRoll, game.user, true)
  ];

  if (critical.success && critType !== 'none') {
    let critEffectRoll;

    if (critType === 'table') {
      critEffectRoll = await new Roll('1d20', {async: true}).roll();
      diceToRoll.push(game.dice3d.showForRoll(critEffectRoll, game.user, true));
    }

    critEffect = handleCrits(critEffectRoll?.total);

    console.info(critEffect);
  }

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
};

const handleCrits = (critTableRoll) => {
  if (critTableRoll) {
    let critResult;

    if      (critTableRoll === 20)  critResult = 'decapitate';
    else if (critTableRoll === 19)  critResult = 'blind';
    else if (critTableRoll === 18)  critResult = 'acPenalty';
    else if (critTableRoll === 17)  critResult = 'attackPenalty';
    else if (critTableRoll === 16)  critResult = 'bleed';
    else if (critTableRoll >= 14)   critResult = 'stun';
    else if (critTableRoll >= 12)   critResult = 'armBreak';
    else if (critTableRoll >= 10)   critResult = 'legBreak';
    else if (critTableRoll >= 18)   critResult = 'triple';
    else                            critResult = 'double';

    return CONFIG.CHROMATIC.critTypes[critResult];
  }

  return CONFIG.CHROMATIC.critTypes.double;
}

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

export default attackSequence;