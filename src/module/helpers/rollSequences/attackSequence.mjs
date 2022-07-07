import { getFirstTargetOfSelf, rollMessageOptions, getStatus } from '../utils.mjs';
import { manageActiveEffect } from '../effects.mjs';

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

  const has3dDice = !!game.dice3d;

  const target = getFirstTargetOfSelf();
  const targetWasHit =
    !target ||
    attackRoll.total >= target.system.ac ||
    attackRoll.dice[0].total === 20;
  const critical = {
    success: attackRoll.dice[0].total === 20 &&
             (
               !target ||
               attackRoll.total - target.system.ac > 0
             ),
    failure: attackRoll.dice[0].total === 1
  }
  const critType = game.settings.get('foundry-chromatic-dungeons', 'critical-hits');
  let critEffectRoll;
  let critEffect;
  const diceToRoll = [];

  if (has3dDice)
    diceToRoll.push(
      game.dice3d.showForRoll(attackRoll, game.user, true)
    );

  if (targetWasHit)
    if (has3dDice)
      diceToRoll.push(
        game?.dice3d?.showForRoll(damageRoll, game.user, true)
      );

  if (critical.success && critType !== 'none') {

    if (critType === 'table') {
      critEffectRoll = await new Roll('1d20', {async: true}).roll();
      if (has3dDice)
        diceToRoll.push(game.dice3d.showForRoll(critEffectRoll, game.user, true));
    }

    critEffect = handleCrits(critEffectRoll?.total)[0];
  }

  triggers.beforeAttack?.();

  /**
   * Dice So Nice! integration
   * For the pals :)
   */
  if (has3dDice && diceToRoll.length)
    await Promise.all(diceToRoll);

  await ChatMessage.create(
    getAttackMessage(
      actor,
      target,
      damageSource,
      attackRoll,
      (targetWasHit)      ? damageRoll      : null,
      (critical.success)  ? critEffectRoll  : null,
      (critical.success)  ? critEffect      : null
    )
  );

  let damageValue = (damageRoll.total > 0 ? damageRoll.total : 0);

  if (critEffect === 'double')     damageValue = damageValue * 2;
  if (critEffect === 'triple')     damageValue = damageValue * 3;
  if (critEffect === 'decapitate') damageValue = 999;

  if (target && targetWasHit)
    await target.update({
      ['data.hp.value']: target.system.hp.value - damageValue
    })

  if (critEffect) inflictCritEffect(target, critEffect);
};

const handleCrits = (critTableRoll) => {
  if (critTableRoll) {
    let critResult;

    if      (critTableRoll === 20)  critResult = 'decapitate';
    else if (critTableRoll === 19)  critResult = 'blind';
    else if (critTableRoll === 18)  critResult = 'acPenalty';
    else if (critTableRoll === 17)  critResult = 'attackPenalty';
    else if (critTableRoll === 16)  critResult = 'bleed';
    else if (critTableRoll >=  14)  critResult = 'stun';
    else if (critTableRoll >=  12)  critResult = 'armBreak';
    else if (critTableRoll >=  10)  critResult = 'legBreak';
    else if (critTableRoll >=  6 )  critResult = 'triple';
    else                            critResult = 'double';

    return CONFIG.CHROMATIC.critTypes[critResult];
  }

  return CONFIG.CHROMATIC.critTypes.double;
}

const inflictCritEffect = (target, effect) => {
  if (!target?.token?.object) return;

  const applyEffect = (effect, label, duration = 999, change) => {
    let updatedEffect = effect;

    if (label)
      updatedEffect.label = label;

    // 999 round duration to force
    // the effect to show up on the
    // actor's token
    updatedEffect.duration = {rounds:  duration};
    if (change) updatedEffect.changes = [change];
    updatedEffect.tint = '#F0423B';

    target.createEmbeddedDocuments("ActiveEffect", [updatedEffect]);
  }

  const createEffectChange = (key, value, mode = 2) =>
    ({ key, value, mode });

  switch (effect) {
    case 'blind':
      applyEffect(getStatus('blind'));
      break;
    case 'acPenalty':
      applyEffect(
        getStatus('downgrade'),
        `CRITICAL.Effect.${effect}`,
        undefined,
        createEffectChange('data,modAC', -2)
      );
      break;
    case 'attackPenalty':
      applyEffect(
        getStatus('downgrade'),
        `CRITICAL.Effect.${effect}`,
        undefined,
        createEffectChange('data.modToHit', -2)
      );
      break;
    case 'bleed':
      applyEffect(getStatus('bleeding'));
      break;
    case 'stun':
      applyEffect(getStatus('stun'), null, 1);
      break;
    case 'armBreak':
      applyEffect(
        getStatus('downgrade'),
        `CRITICAL.Effect.${effect}`,
        undefined,
        createEffectChange('data.hands', -1)
      );
      break;
    case 'legBreak':
      applyEffect(
        getStatus('downgrade'),
        `CRITICAL.Effect.${effect}`,
        undefined,
        createEffectChange('data.moveMultiplier', .5, 5)
      );
      break;
    default: break;
  }
}

const getAttackMessage = (
  actor,
  target,
  source,
  attackRoll,
  damageRoll,
  critRoll,
  critEffect
) => ({
  ...rollMessageOptions(actor),
  flavor: `Attacking with ${source}`,
  flags: {
    'foundry-chromatic-dungeons': {
      rollType: 'attack',
      critical: {
        success: attackRoll.dice[0].total === 20,
        successEffect: critEffect || null,
        failure: attackRoll.dice[0].total === 1,
      },
      rolls: {
        attack: attackRoll,
        damage:  damageRoll ||  null,
        crit: critRoll || null
      },
      tooltips: {
        attack: attackRoll.dice.map(d => d.getTooltipData()),
        damage: (damageRoll)
          ? damageRoll.dice.map(d => d.getTooltipData())
          : null,
        crit: (critRoll)
          ? critRoll.dice.map(d => d.getTooltipData())
          : null
      },
      source,
      actor,
      target
    }  
  }
})

export default attackSequence;