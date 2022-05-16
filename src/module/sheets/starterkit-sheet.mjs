import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import {getAllItemsOfType} from '../helpers/utils.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export default class ClassgroupSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["chromatic-dungeons", "sheet", "item", "object", "starter-kit"],
      width: 520,
      height: 480,
      filters: [{inputSelector: '.search-filter__input--gear', contentSelector: ".gear-list--available"}]
    });
  }

  /** @override */
  get template() {
    const path = `${CONFIG.CHROMATIC.templateDir}/item`;
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    return `${path}/item-${this.item.data.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve base data structure.
    const context = super.getData();

    context.effects = prepareActiveEffectCategories(this.item.effects);

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

    context.gear = await this._getGear();
    context.selectedGear = await this._getSelectedGear(this.item.data.data.contents)

    return context;
  }

  /**
   * Handle changes to search filtering controllers which are bound to the Application
   * @param {KeyboardEvent} event   The key-up event from keyboard input
   * @param {string} query          The raw string input to the search field
   * @param {RegExp} rgx            The regular expression to test against
   * @param {HTMLElement} html      The HTML element which should be filtered
   * @private
   */
   _onSearchFilter(event, query, rgx, html) {
    const isSearch = !!query;
    const nodes = html.querySelectorAll('.item-card');

    nodes.forEach(node => {
      if (isSearch && !rgx.test(node.querySelector('.item-card__name').textContent))
        node.style.display = 'none';
      else node.style.display = null;
    });
   }

  /* -------------------------------------------- */

  async _getGear() {
    return getAllItemsOfType('gear', 'foundry-chromatic-dungeons.gear');
  }

  async _getSelectedGear(selected) {
    const gear = await this._getGear();
    const selectedKeys = Object.keys(selected);

    return gear
      .filter(item => selectedKeys.includes(item.id))
      .map((item) => ({
        id: item.id,
        img: item.img,
        name: item.name,
        quantity: selected[item.id]
      }));
  }

  async _addToKit(ev) {
    const {itemId} = ev.currentTarget.dataset;
    const gearlist = await this._getGear();
    const itemToAdd = gearlist.find(item => item.id === itemId);
    let {contents} = this.item.data.data;

    if (contents[itemId] !== undefined)
      this.item.update({
        'data.contents': {
          [itemId]: contents[itemId] + itemToAdd.data.data.quantity.value
        }
      });
    else
      this.item.update({
        'data.contents': {
          [itemId]: itemToAdd.data.data.quantity.value
        }
      });
  }

  async _removeFromKit(ev) {
    const {itemId} = ev.currentTarget.dataset;
    const newQuantity = this.item.data.data.contents[itemId] - 1;

    if (newQuantity <= 0)
      this.item.update({
        'data.contents': {
          [`-=${itemId}`]: null
        }
      });
    else
      this.item.update({
        'data.contents': {
          [itemId]: newQuantity
        }
      });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    html.find('.gear-list--available .item-card').click(this._addToKit.bind(this));
    html.find('.gear-list--selected .item-card').click(this._removeFromKit.bind(this));
  }
}
