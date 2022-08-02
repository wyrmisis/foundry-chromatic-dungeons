import { getAllItemsOfType } from '../helpers/utils.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export default class SpellSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["chromatic-dungeons", "sheet", "item", "sheet--spell"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }]
    });
  }

  /** @override */
  get template() {
    const path = `${CONFIG.CHROMATIC.templateDir}/item`;
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    return `${path}/item-${this.item.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }

    // Add some constants for easier lookup
    context.castingClasses = await this._getClasses();
    context.spellSchools = CONFIG.CHROMATIC.spellSchools;
    context.saves = CONFIG.CHROMATIC.saves;

    return context;
  }

  async _getClasses () {
    const classes = await getAllItemsOfType('class', 'foundry-chromatic-dungeons.class');

    return classes
      .filter(item => item.system.hasSpellcasting)
      .reduce((list, classObj) => 
        ({ ...list, [classObj.uuid]: classObj.name }),
        {}
      );
  }
}
