import {
  getLevelFromXP,
  getClassGroupAtLevel,
  getNextLevelXP,
  range
} from '../helpers/utils.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export default class ClassSheet extends ItemSheet {
  _deleteConfirmationModal() {
    return Dialog.confirm({
      title: `Delete ${this.item.name}?`,
      content: "Are you sure you want to delete this class? This cannot be undone.",
      yes: () => console.log("Chose One"),
      no: () => console.log("Chose Two"),
      defaultYes: false,
      rejectClose: true
    });
  }


  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["chromatic-dungeons", "sheet", "item", "ancestry"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = `${CONFIG.CHROMATIC.templateDir}/item`;
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
    context.level = getLevelFromXP(itemData.data.xp);
    context.xpToNextLevel = getNextLevelXP(itemData.data.xp);

    if (itemData.data.classGroup) {
      context.classGroupAll = CONFIG.CHROMATIC.classGroups[itemData.data.classGroup];
      context.classGroup = getClassGroupAtLevel(
        itemData.data.classGroup,
        context.level
      );
    }

    context.skillAttributes = CONFIG.CHROMATIC.attributeLabels

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
        [`data.features.${randomID()}`]: {
          level: 1,
          title: '',
          content: ''
        }
      });
    });

    html.find('.feature__delete').click((evt) => {
      const targetFeature = $(evt.target)
        .parents('.feature')
        .data('itemId');

      this.item.update({
        'data.features': {
          [`-=${targetFeature}`]: null
        }
      });
    });

    html.find('.skill__add').click(() => {
      this.item.update({
        [`data.skills.${randomID()}`]: {
          name: '',
          attribute: '',
          bonus: 0
        }
      });
    });

    html.find('.skill__delete').click((evt) => {
      const targetSkill = $(evt.target)
        .parents('.skill')
        .data('itemId');

      this.item.update({
        'data.skills': {
          [`-=${targetSkill}`]: null
        }
      });
    });


    html.find('[name="data.hasSpellcasting"]').change(evt => {
      const hasSpellcasting = evt.target.checked;
      let slots;

      if (hasSpellcasting) {
        const levelRange = range(1, 20);
        const slotRange = range(1, 9);

        // @todo This could be a util with recursion
        slots = levelRange.reduce(
          (levelObj, level) => ({
            ...levelObj,
            [level]: slotRange.reduce(
              (slotObj, slotLevel) => ({
                ...slotObj,
                [slotLevel]: 0
              }), {})
          }), {});
      } else {
        slots = null;
      }

      this.item.update({
        'data.spellSlots': slots
      })
    });

    html.find('[name="data.hasSpellPoints"]').change(evt => {
      const hasSpellPoints = evt.target.checked;
      let spellPoints;

      if (hasSpellPoints) {
        const levelRange = range(1, 20);

        // @todo This could be a util with recursion
        spellPoints = levelRange.reduce(
          (levelObj, level) => ({
            ...levelObj,
            [level]: { spellsKnown: 0, maxSpellLevel: 0, maxSpellPoints: 0 }
          }), {});
      } else {
        spellPoints = null;
      }

      this.item.update({
        'data.spellPoints': spellPoints
      })
    })

    html.find('.class__delete').click(evt => {
      this._deleteConfirmationModal()
        .then(() => {
          this.item.delete();
        });
    })
  }
}