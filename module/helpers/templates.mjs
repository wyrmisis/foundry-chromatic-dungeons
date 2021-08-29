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

    // Item partials
    "systems/chromatic-dungeons/templates/item/parts/item-attribute.hbs",
    "systems/chromatic-dungeons/templates/item/parts/item-description.hbs",
    "systems/chromatic-dungeons/templates/item/parts/item-effects.hbs",
  ]);
};
