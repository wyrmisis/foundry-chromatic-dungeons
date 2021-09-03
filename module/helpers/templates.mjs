/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Actor partials
    "systems/chromatic-dungeons/templates/actor/parts/actor-attribute.hbs",
    "systems/chromatic-dungeons/templates/actor/parts/actor-features.hbs",
    "systems/chromatic-dungeons/templates/actor/parts/actor-items.hbs",
    "systems/chromatic-dungeons/templates/actor/parts/actor-spells.hbs",
    "systems/chromatic-dungeons/templates/actor/parts/actor-effects.hbs",
    "systems/chromatic-dungeons/templates/actor/parts/actor-biography.hbs",

    // Actor Grid Partials
    "systems/chromatic-dungeons/templates/actor/parts/grids/actor-weapon-grid.hbs",
    "systems/chromatic-dungeons/templates/actor/parts/grids/actor-armor-grid.hbs",
    "systems/chromatic-dungeons/templates/actor/parts/grids/actor-gear-grid.hbs",
    "systems/chromatic-dungeons/templates/actor/parts/grids/actor-wealth-grid.hbs",
    "systems/chromatic-dungeons/templates/actor/parts/grids/item-grid-actions.hbs",

    // Item partials
    "systems/chromatic-dungeons/templates/item/parts/item-attribute.hbs",
    "systems/chromatic-dungeons/templates/item/parts/item-description.hbs",
    "systems/chromatic-dungeons/templates/item/parts/item-effects.hbs",
  ]);
};
