/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
 export async function createItemMacro(item, slot) {
    if (item.type !== "Item") return;
    // if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  
    // Create the macro command
    const command = `game.boilerplate.rollItemMacro("${item.name}");`;
    let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
    if (!macro) {
      macro = await Macro.create({
        name: item.name,
        type: "script",
        img: item.img,
        command: command,
        flags: { "boilerplate.itemMacro": true }
      });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
  }
  
  /**
   * Create a Macro from an Item drop.
   * Get an existing item macro if one exists, otherwise create a new one.
   * @param {string} itemName
   * @return {Promise}
   */
  export function rollItemMacro(itemName) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    const item = actor ? actor.items.find(i => i.name === itemName) : null;
    if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);
  
    // Trigger the item roll
    return item.roll();
  }