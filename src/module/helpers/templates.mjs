/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Actor partials
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/actor-attribute.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/actor-features.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/actor-items.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/actor-spells.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/actor-effects.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/actor-biography.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/actor-derived-stats.hbs`,

    // Actor Grid Partials
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/grids/actor-weapon-grid.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/grids/actor-armor-grid.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/grids/actor-gear-grid.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/grids/actor-gear-cards.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/grids/actor-wealth-grid.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/grids/item-grid-actions.hbs`,

    // NPC-specific Partials
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/npc-header.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/npc-summary.hbs`,

    // PC-specific Partials
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/pc-header.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/pc-summary.hbs`,

    // Item partials
    `${CONFIG.CHROMATIC.templateDir}/item/parts/item-attribute.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/item/parts/item-description.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/item/parts/item-effects.hbs`,

    // Chat cards
    `${CONFIG.CHROMATIC.templateDir}/chat/attack.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/chat/save.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/chat/attribute.hbs`,
  ]);
};
