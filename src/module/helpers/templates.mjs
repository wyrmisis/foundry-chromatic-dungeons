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
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/npc-config.hbs`,

    // PC-specific Partials
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/pc-header.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/actor/parts/pc-summary.hbs`,

    // Item partials
    `${CONFIG.CHROMATIC.templateDir}/item/parts/item-header.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/item/parts/item-value.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/item/parts/item-attribute.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/item/parts/item-description.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/item/parts/item-effects.hbs`,

    // Type-specific Item Partials
    `${CONFIG.CHROMATIC.templateDir}/item/parts/class-feature.hbs`,

    // Item Config partials
    `${CONFIG.CHROMATIC.templateDir}/item/configuration/gear.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/item/configuration/weapon.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/item/configuration/armor.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/item/configuration/treasure.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/item/configuration/magic-item.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/item/configuration/class.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/item/configuration/classgroup.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/item/configuration/ancestry.hbs`,

    // Chat cards
    `${CONFIG.CHROMATIC.templateDir}/chat/attack.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/chat/save.hbs`,
    `${CONFIG.CHROMATIC.templateDir}/chat/attribute.hbs`,
  ]);
};
