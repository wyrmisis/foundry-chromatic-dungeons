import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
class ChromaticItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["chromatic-dungeons", "sheet", "item", "object"],
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
  getData() {
    // Retrieve base data structure.
    const context = super.getData();

    context.effects = prepareActiveEffectCategories(this.item.effects);

    // Use a safe clone of the item data for further operations.
    const itemData = context.item;

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = itemData.system;
    context.flags = itemData.flags;

    // Add some constants for easier lookup
    if (context.item.type === 'weapon') {
      context.weaponTypes = CONFIG.CHROMATIC.weaponTypes;
      context.damageTypes = CONFIG.CHROMATIC.damageTypes;
    }
    if (context.item.type === 'armor') context.armorTypes = CONFIG.CHROMATIC.armorTypes;

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.

    html.find('.feature__add').click(() => {
      this.item.update({
        _id: this.item.id,
        [`data.features.${randomID()}`]: 'New Feature'
      });
    });

    html.find('.feature__delete').click((evt) => {
      const targetFeature = $(evt.target)
        .parents('.feature__list-item')
        .data('id');

      this.item.update({
        _id: this.item.id,
        'data.features': {
          [`-=${targetFeature}`]: null
        }
      });
    });
    
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.item));
  }
}

export default ChromaticItemSheet;
