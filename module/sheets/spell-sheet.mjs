/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export default class SpellSheet extends ItemSheet {

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
    const path = "systems/chromatic-dungeons/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    return `${path}/item-${this.item.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item.data;

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = itemData.data;
    context.flags = itemData.flags;

    // Add some constants for easier lookup
    context.spellSchools = CONFIG.CHROMATIC.spellSchools;
    context.saves = CONFIG.CHROMATIC.saves;

    context.castingClasses = 
      game.items
        .filter(item => item.data.data.hasSpellcasting)
        .reduce((list, classObj) => 
          ({ ...list, [classObj.id]: classObj.name }),
          {}
        );

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.

    $('[data-action="add-spell-level"]').click((evt) => {
      this.item.update({
        [`data.spellLevels.${randomID()}`]: { "class": "", "level": 1 }
      });
    });

    $('[data-action="delete-spell-level"]').click((evt) => {
      const levelItem = evt.currentTarget.dataset.class;

      this.item.update({
        'data.spellLevels': {
          [`-=${levelItem}`]: null
        }
      });
    });
  }
}
