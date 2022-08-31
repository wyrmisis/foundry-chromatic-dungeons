import { getStatus } from '../helpers/utils';

Hooks.once("ready", async function() {
  Hooks.on('updateActor', doDamageUpdates);
});

const doDamageUpdates = async (actor, delta, options, user) => {
  if (!['pc', 'npc'].includes(actor.type)) return;

  if (game.userId !== user) return; // This should only happen once!

  const [shouldBeUnconscious, shouldBeDead] = getActorDamageState(actor);
  const [isAlreadyUnconscious, isAlreadyDead] = getActorDamageEffectState(actor);

  // Avoid duplicate status effects
  if (shouldBeUnconscious && isAlreadyUnconscious)
    return;
  if (shouldBeDead && isAlreadyDead)
    return;

  const token = (actor.isToken ? actor.token.object : actor.getActiveTokens()[0])

  if (token) // A token exists for this actor, manage effects the easy way
    manageTokenDamageEffects(
      token,
      shouldBeUnconscious,
      shouldBeDead
    );
  else // No token, manage effects the less easy way
    manageActorDamageEffects(
      actor,
      shouldBeUnconscious,
      shouldBeDead
    );
}

const getActorDamageState = (actor) => {
  const hp = actor.system.hp.value;
  const deathHp =  Math.abs(game.settings.get('foundry-chromatic-dungeons', 'min-negative-hp')) * -1;

  const shouldBeUnconscious =
    deathHp !== 0 &&
    actor.type === 'pc' &&
    hp <= 0 &&
    hp > deathHp;
  const shouldBeDead =
    (actor.type === 'pc' &&  hp <= deathHp) ||
    (actor.type === 'npc' && hp <= 0);

  return [shouldBeUnconscious, shouldBeDead];
}

const getActorDamageEffectState = (actor) => [
  actor.effects.find(
    ({icon}) => icon.includes('unconscious')
  ),
  actor.effects.find(
    ({icon}) => icon.includes('dead') || icon.includes('skull')
  )
];

const manageTokenDamageEffects = async (
  token,
  shouldBeUnconscious,
  shouldBeDead
) => {
  await token.toggleEffect(
    getStatus('unconscious'),
    {active: shouldBeUnconscious, overlay: true}
  );
  
  await token.toggleEffect(
    getStatus('dead'),
    {active: shouldBeDead, overlay: true}
  );
}

const manageActorDamageEffects = async (
  actor,
  shouldBeUnconscious,
  shouldBeDead
) => {
  const [unconsciousStatus, deadStatus] = getActorDamageEffectState(actor);

  toggleActorDamageEffect(actor, shouldBeDead, deadStatus, 'dead');
  toggleActorDamageEffect(actor, shouldBeUnconscious, unconsciousStatus, 'unconscious');
}

const toggleActorDamageEffect = (actor, shouldHaveStatus, status, statusId) => {
  if (!shouldHaveStatus && status) // Remove the status AE
    status.delete();
  else if (shouldHaveStatus)
    actor.createEmbeddedDocuments("ActiveEffect", [{
      ...getStatus(statusId),
      'duration.rounds': undefined,
      flags: {core: { overlay: true, statusId } }
    }])
}