/**
 * Make an attribute roll, given an attribute's key.
 * 
 * @param {string} key A save key, based on one of the four saves.
 * @returns 
 */
 const saveRollMacro = (key) => {
  const speaker = ChatMessage.getSpeaker();
  const actor = speaker.token ? game.actors.tokens[speaker.token] : game.actors.get(speaker.actor);

  if (!actor)
    return ui.notifications.warn('No actor selected for this roll!');

  actor.saveRoll(key);
}

export default saveRollMacro;