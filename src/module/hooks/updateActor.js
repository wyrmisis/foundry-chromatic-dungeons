import {
  getStatus,
  rollMessageOptions,
  getVisionAndLight
} from '../helpers/utils';

Hooks.once("ready", async function() {
  Hooks.on('updateActor', async (actor) => {
    if (!actor.token) return;
    
    doCombatUpdates(actor);
    doLightingUpdates(actor);
  });

  Hooks.on('updateActiveEffect', (effect) => {
    const actor = effect.parent;

    if (actor.token)
      doLightingUpdates(actor);
  })
});

const doCombatUpdates = async (actor) => {
  const hp = actor.data.data.hp.value;

  const deathHp =  Math.abs(game.settings.get('foundry-chromatic-dungeons', 'min-negative-hp')) * -1;

  const isUnconscious =
    deathHp !== 0 &&
    actor.type === 'pc' &&
    hp <= 0 &&
    hp >= deathHp;
  const isDead =
    (actor.type === 'pc' &&  hp < deathHp) ||
    (actor.type === 'npc' && hp <= 0);

  // Avoid duplicate status effects
  if (isUnconscious && actor.token.data.actorData.effects.find(({icon}) => icon.includes('unconscious')))
    return;
  if (isDead && actor.token.data.actorData.effects.find(({icon}) => icon.includes('dead')))
    return;

  await actor.token.object.toggleEffect(
    getStatus('unconscious'),
    {active: isUnconscious, overlay: true}
  );
  await actor.token.object.toggleEffect(
    getStatus('dead'),
    {active: isDead, overlay: true}
  );
}

const doLightingUpdates = (actor) =>
  getVisionAndLight(actor.token, actor.data);