/**
 * Make an attribute roll, given an attribute's key.
 * 
 * @param {string} key An attribute key, based on one of the primary six attributes.
 * @returns 
 */
const attributeRollMacro = (key) => {
  const speaker = ChatMessage.getSpeaker();
  const actor = speaker.token ? game.actors.tokens[speaker.token] : game.actors.get(speaker.actor);

  if (!actor)
    return ui.notifications.warn('No actor selected for this roll!');

  actor.attributeRoll(
    game.i18n.localize(`ATTRIBUTE.${key}`),
    `1d20-${actor.data.data.attributeMods[key]}`,
    actor.data.data.attributes[key]
  );
}

export default attributeRollMacro;