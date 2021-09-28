// Import document classes.
import { BoilerplateActor } from "./documents/actor.mjs";
import { BoilerplateItem } from "./documents/item.mjs";
// Import sheet classes.
import { BoilerplateActorSheet } from "./sheets/actor-sheet.mjs";
import { BoilerplateItemSheet } from "./sheets/item-sheet.mjs";
import CDAncestrySheet from "./sheets/ancestry-sheet.mjs";
import CDClassSheet from "./sheets/class-sheet.mjs";
import CDSpellSheet from './sheets/spell-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { CHROMATIC } from "./helpers/config.mjs";
import setupHandlebarsHelpers from './helpers/handlebarsHelpers.mjs';
import { hasThisAlready, reportAndQuit } from './helpers/utils.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.boilerplate = {
    BoilerplateActor,
    BoilerplateItem,
    rollItemMacro
  };

  // Add custom constants for configuration.
  CONFIG.CHROMATIC = CHROMATIC;

  console.info(CONFIG.CHROMATIC.ascii);
  console.info(CONFIG.CHROMATIC.logPrefix, 'initializing');

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
  Items.registerSheet("chromatic-dungeons", BoilerplateItemSheet, '', {
    types: ['weapon', 'armor', 'goods', 'gear', 'treasure', "heritage"],
    makeDefault: true
  });
  Items.registerSheet("chromatic-dungeons", CDClassSheet, { 
    types: ['class'],
    makeDefault: true 
  });
  Items.registerSheet("chromatic-dungeons", CDSpellSheet, { 
    types: ['spell'],
    makeDefault: true 
  });
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

  Hooks.on('createToken', (token, options, userId) => {
    const tokenActor = token.actor.data;

    if (tokenActor.type === 'npc' && !token.isLinked) {
      const hpRoll = new Roll(`${parseInt(tokenActor.data.hitDice)}d6+${tokenActor.data.hitDiceBonus}`);

      hpRoll
        .roll({async: true})
        .then(({total}) =>
          token.modifyActorDocument({
            ['data.hp.value']: total,
            ['data.hp.max']: total
          })
        );
    }

    return token;
  })

  Hooks.on('dropActorSheetData', async (actor, sheet, dropped) => {

    const [droppedItem, droppedSourceId] = await 
      !dropped.pack
        ? [dropped.data, dropped.sourceId]
        : game.packs
          .get(dropped.pack)
          .getDocument(dropped.id)
          .then((item) => [
            item,
            item.getFlag('core', 'sourceId')
          ]);

    if (
      actor.type === 'pc' && (
      droppedItem.type === 'ancestry' ||
      droppedItem.type === 'heritage' ||
      droppedItem.type === 'class'
    ))
      return reportAndQuit('Only PCs can have an ancestry, heritage, or class');

    if (droppedItem.type === 'ancestry') {
      const actorAncestry = actor.items.find(item => item.type === 'ancestry');

      if (actorAncestry)
        return reportAndQuit(`${actor.name} already has an ancestry`);
    }

    // @todo Add a setting for number of heritages
    if (droppedItem.type === 'heritage') {
      const actorHeritages = actor.items.filter(item => item.type === 'heritage');

      if (hasThisAlready('heritage', droppedItem, actorHeritages))
        return reportAndQuit(`${actor.name} already has the ${droppedItem.name} heritage`);

      if (actorHeritages.length >= 2)
        return reportAndQuit(`${actor.name} already has two heritages`);
    }

    // // @todo Add a setting for class stat requirements
    if (droppedItem.type === 'class') {
      const actorClasses = actor.items.filter(item => item.type === 'class');

      if (hasThisAlready('class', droppedItem, actorClasses))
        return reportAndQuit(`${actor.name} already has the ${droppedItem.name} class`);

      const reqs = droppedItem.data.data.requirements
      const attributes = actor.data.data.attributes;
      const missedReqs = Object.keys(reqs).filter(
        (reqKey) => attributes[reqKey] < reqs[reqKey]
      );

      if (missedReqs.length)
        return reportAndQuit(`${actor.name} does not meet the attribute requirements to become a ${droppedItem.name}.`);
    }

    if (droppedItem.type === 'spell') {
      const actorSpells = actor.items
        .filter(item => item.type === 'spell')
        .map(item => item.data);

      if (hasThisAlready('spell', droppedItem, actorSpells))
        return reportAndQuit(`${actor.name} already has the ${droppedItem.name} spell`);

      return false;
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