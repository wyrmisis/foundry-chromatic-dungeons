import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import {
  getDerivedStat,
  getLevelFromXP,
  getClassGroupAtLevel
} from '../helpers/utils.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class BoilerplateActorSheet extends ActorSheet {
  itemMenu = null;

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["chromatic-dungeons", "sheet", "actor"],
      template: "systems/chromatic-dungeons/templates/actor/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".tab-group__container", initial: "summary" }]
    });
  }

  /** @override */
  get template() {
    return `systems/chromatic-dungeons/templates/actor/actor-${this.actor.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.actor.data;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData.data;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'pc') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle ability scores.
    // for (let [k, v] of Object.entries(context.data.attributes)) {
    //   v.label = game.i18n.localize(CONFIG.CHROMATIC.attributeLabels[k]) ?? k;
    // }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @todo Add default images per type (https://game-icons.net/)
   * 
   * @param {Object} actorData The actor to prepare.
   * 
   * @return {undefined}
   */
  _prepareItems(context) {
    // Init containers
    let weapons = [],
      armor = [],
      gear = [],
      goods = [],
      treasure = [],
      ancestry = {},
      heritages = [],
      classes = [],
      spells = {
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
        7: [],
        8: [],
        9: []
      };

      // Divide the items out
      context.items.forEach(item => {
        item.img = item.img || DEFAULT_TOKEN;

        if (item.type === 'weapon') weapons.push(item);
        if (item.type === 'armor') armor.push(item);
        if (item.type === 'gear') gear.push(item);
        if (item.type === 'goods') goods.push(item);
        if (item.type === 'treasure') treasure.push(item);
        if (item.type === 'ancestry') ancestry = item;
        if (item.type === 'heritage') heritages.push(item);
        if (item.type === 'class') classes.push(this._formatClassForUse(item));
        if (item.type === 'spell' && item.data.level) spells[item.data.level].push(item);
      });

      context.totalItemWeight = []
        .concat(weapons, armor, gear, goods, treasure)
        .reduce((prev, curr) => prev + curr.data.weight.value, 0);

      Object.keys(this.actor.data.data.wealth).forEach(
        (coinType) => context.totalItemWeight += (
          this.actor.data.data.wealth[coinType] / 10
        )
      );

      let baseAC = 10 + 
        this.actor.data.data.modAC + 
        getDerivedStat(
          'dex',
          this.actor.data.data.attributes.dex,
          'modAgility'
        );

      context.ac = armor.reduce((prev, curr) => {
        return !curr.data.equipped ? prev : prev + curr.data.ac
      }, baseAC);

      context.move = this.actor.data.data.modMove + ancestry.data.movement;
      context.primaryClass = classes.find(obj => obj.isPrimary);
      context.saves = classes.find(obj => obj.isSaveSelectedTable)?.data.saves || context.primaryClass.saves;

      context.hasSpellcasting = !!classes.filter(obj => obj.hasSpellcasting).length;

      context.meleeToHitMod = this.actor.data.data.modToHit +
        context.primaryClass.modToHit +
        getDerivedStat(
          'str',
          this.actor.data.data.attributes.str,
          'modToHit'
        );

      context.meleeDamageMod = this.actor.data.data.modDamage +
        getDerivedStat(
          'str',
          this.actor.data.data.attributes.str,
          'modMeleeDamage'
        );

      context.equippedItems = [...weapons, ...armor].filter(item => item.data.equipped);

      console.info(context.meleeDamageMod);

      context.weapons = weapons;
      context.armor = armor;
      context.gear = gear;
      context.goods = goods;
      context.treasure = treasure;
      context.ancestry = ancestry;
      context.heritages = heritages;
      context.classes = classes;
      context.spells = spells;

      context.armorTypes = CONFIG.CHROMATIC.armorTypes;
  }

  _formatClassForUse({_id, name, data}) {
    const level = getLevelFromXP(data.xp);
    const classGroupData = getClassGroupAtLevel(data.classGroup, level)
    
    return {
      id: _id,
      name,
      ...data,
      level,
      ...getClassGroupAtLevel(data.classGroup, level)
    }
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    const itemClass = '.items__list-item';

    this.itemMenu = new ContextMenu(
      $(itemClass).parent('ul'),
      itemClass,
      [
        { name: 'Edit', icon: '<i class="fa fa-edit" />', callback: this._editOwnedItem },
        { name: 'Delete', icon: '<i class="fa fa-trash" />', callback: this._deleteOwnedItem },
      ]
    );

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(itemClass);
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    html.find('.class__name').click(ev => {
      const item = this.actor.items.get(ev.target.dataset.itemId);
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(itemClass);
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    html.find('.items__list-column--equipped input[type="checkbox"]').change(ev => {
      ev.preventDefault();
      ev.stopPropagation();
      
      const li = $(ev.currentTarget).parents(itemClass);
      const item = this.actor.items.get(li.data("itemId"));

      if (item.type === 'armor')
        return this._validateEquippedArmor(li, item, ev);
      else if (item.type === 'weapon')
        return this._validateEquippedWeapon(li, item, ev);
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find(itemClass).each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  _editOwnedItem(itemNode) {

  }

  _deleteOwnedItem(itemNode) {

  }

  _validateEquippedArmor(li, item, ev) {
    const siblings = li
      .siblings()
      .filter((_, node) => node.dataset.armorType === item.data.data.armorType)
      .not('.items__list-item--header');

    const overlappingArmorTypes = !!siblings.filter((_, node) => {
      const siblingItem = this.actor.items.get(node.dataset.itemId);

      return (siblingItem.data.data.armorType === item.data.data.armorType) &&
        siblingItem.data.data.equipped
    }).length;

    if (overlappingArmorTypes) {
      siblings
        .children('.items__list-column--equipped input[type="checkbox"]')
        .prop('checked', false);

      siblings.each((_, node) => {
        const siblingItem = this.actor.items.get(node.dataset.itemId);

        siblingItem.update({
          _id: siblingItem.id,
          'data.equipped': false
        });
      });
    }

    return item.update({
      _id: item.id,
      'data.equipped': ev.target.checked
    });
  }

  _validateEquippedWeapon(li, item, ev) {
    ev.preventDefault();
    ev.stopPropagation();
    
    const equippedItems = li
      .parent('ul')
      .children('li')
      .not('.items__list-item--header')
      .children('.items__list-column--equipped')
      .find('input:checked')

    if (equippedItems.length >= 3) {
      ev.target.checked = false;
      return false;
    }

    return item.update({
      _id: item.id,
      'data.equipped': ev.target.checked
    });
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.items__list-item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData()).roll();
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

}
