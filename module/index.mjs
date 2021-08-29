// Import document classes.
import { BoilerplateActor } from "./documents/actor.mjs";
import { BoilerplateItem } from "./documents/item.mjs";
// Import sheet classes.
import { BoilerplateActorSheet } from "./sheets/actor-sheet.mjs";
import { BoilerplateItemSheet } from "./sheets/item-sheet.mjs";
import CDAncestrySheet from "./sheets/ancestry-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { CHROMATIC } from "./helpers/config.mjs";
import setupHandlebarsHelpers from './helpers/handlebarsHelpers.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  console.info('Chromatic Dungeons | Initializing');


  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.boilerplate = {
    BoilerplateActor,
    BoilerplateItem,
    rollItemMacro
  };

  // Add custom constants for configuration.
  CONFIG.CHROMATIC = CHROMATIC;

  /**
   * Set an initiative formula for the system
   * @type {String}
   * @todo settings for group vs. individual initiative
   * @todo settings for weapon speed factor
   */
  CONFIG.Combat.initiative = {
    formula: "1d20 + @abilities.dex.mod",
    decimals: 2
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = BoilerplateActor;
  CONFIG.Item.documentClass = BoilerplateItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("chromatic-dungeons", BoilerplateActorSheet, '', { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("chromatic-dungeons", BoilerplateItemSheet, {
    // types: ['weapon', 'armor', 'goods', 'gear', 'treasure'],
    makeDefault: true
  });
  // Items.registerSheet("chromatic-dungeons", BoilerplateClassSheet, { 
  //   types: ['class'],
  //   makeDefault: true 
  // });
  // Items.registerSheet("chromatic-dungeons", BoilerplateSpellSheet, { 
  //   types: ['spell'],
  //   makeDefault: true 
  // });
  Items.registerSheet("chromatic-dungeons", CDAncestrySheet, { 
    types: ['ancestry'],
    makeDefault: true 
  });

  // Setup custom Handlebars helpers
  setupHandlebarsHelpers();

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
  Hooks.on('dropActorSheetData', (actor, sheet, {id}) => {
    const droppedItem = game.items.find((item) => item.id === id);

    // Check if Actor is not a PC,
    // Check if dropped item is an ancestry, heritage, or class,
    // Return false if both are met

    if (actor.type !== 'pc') {
      if (
        droppedItem.type === 'ancestry' ||
        droppedItem.type === 'heritage' ||
        droppedItem.type === 'class'
      ) {
        console.warn('Chromatic Dungeons | Only PCs can have an ancestry, heritage, or class');
        return false;
      }
    }

    if (droppedItem.type === 'ancestry') {
      const actorAncestry = actor.items.find(item => item.type === 'ancestry');

      if (actorAncestry) {
        console.warn(`Chromatic Dungeons | Actor ${actor.id} already has an ancestry`);
        return false;
      }
    }

    // @todo Add a setting for number of heritages
    if (droppedItem.type === 'heritage') {
      const actorHeritages = actor.items.filter(item => item.type === 'heritage');

      if (actorHeritages.length >= 2) {
        console.warn(`Chromatic Dungeons | Actor ${actor.id} already has two heritages`);
        return false;
      }

      if (actorHeritages.find(({name}) => name === droppedItem.name)) {
        console.warn(`Chromatic Dungeons | Actor ${actor.id} already has the ${droppedItem.name} heritage`);
        return false;
      }
    }

    // @todo Add a setting for class stat requirements
    if (droppedItem.type === 'class') {
      // Check actor attributes against class requirements
      // If unmet, return false
    }
  });
});

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
async function createItemMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.boilerplate.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
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
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}