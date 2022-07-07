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

  actor.saveRoll(
    game.i18n.localize(`SHEET.save.${key}`),
    `1d20+${actor.system.saves.mods[key]}`,
    actor.system.saves.targets[key]
  );
}

export default saveRollMacro;