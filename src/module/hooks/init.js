// Import document classes.
import { BoilerplateActor } from "../documents/actor.mjs";
import { BoilerplateItem } from "../documents/item.mjs";

// Import sheet classes.
import { BoilerplateActorSheet } from "../sheets/actor-sheet.mjs";
import { BoilerplateItemSheet } from "../sheets/item-sheet.mjs";
import CDAncestrySheet from "../sheets/ancestry-sheet.mjs";
import CDClassSheet from "../sheets/class-sheet.mjs";
import CDClassgroupSheet from "../sheets/classgroup-sheet.mjs";
import CDStarterKitSheet from "../sheets/starterkit-sheet.mjs";
import CDSpellSheet from '../sheets/spell-sheet.mjs';

// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "../helpers/templates.mjs";
import { CHROMATIC } from "../helpers/config.mjs";
import setupHandlebarsHelpers from '../helpers/handlebarsHelpers.mjs';
import { rollItemMacro } from '../macros/rollItem.js';
import attributeRollMacro from '../macros/attributeRoll.js';
import saveRollMacro from '../macros/saveRoll.js';

Hooks.once('init', async function() {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.boilerplate = {
    BoilerplateActor,
    BoilerplateItem,
    rollItemMacro,
    attributeRollMacro,
    saveRollMacro,
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
    formula: "1d20+@initiative",
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
  Items.registerSheet("chromatic-dungeons", CDClassgroupSheet, { 
    types: ['classgroup'],
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
  Items.registerSheet("chromatic-dungeons", CDStarterKitSheet, { 
    types: ['starterkit'],
    makeDefault: true 
  });

  // Setup custom Handlebars helpers
  setupHandlebarsHelpers();

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});
  