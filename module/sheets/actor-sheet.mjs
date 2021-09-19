import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import {
  getDerivedStat,
  getLevelFromXP,
  getNextLevelXP,
  getClassGroupAtLevel,
  reportAndQuit,
  hasThisAlready
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

    // Constants for the template
    context.armorTypes = CONFIG.CHROMATIC.armorTypes;
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

      switch (item.type) {
        case 'weapon':
          weapons.push(item);
          break;
        case 'armor':
          armor.push(item);
          break;
        case 'gear':
          gear.push(item);
          break;
        case 'goods':
          goods.push(item);
          break;
        case 'treasure': 
          treasure.push(item);
          break;
        case 'ancestry': 
          ancestry = item;
          break;
        case 'heritage': 
          heritages.push(item);
          break;
        case 'class': 
          classes.push(this._formatClassForUse(item));
          break;
        case 'spell': 
          if (item.data.level)
            spells[item.data.level].push(item);
          break;
      }
    });

    // Stuff that relies on knowing the character classes
    const primaryClass = classes.find(obj => obj.isPrimary);
    const classForSaves = classes.find(obj => obj.isSelectedSaveTable) || context.primaryClass;
    
    // gear
    context.weapons = weapons.map((item) => 
      this._formatWeaponForUse(item, this.actor.data)
    );
    context.armor = armor;
    context.gear = gear;
    context.goods = goods;
    context.treasure = treasure;
    context.spells = spells;
    context.equippedItems = [...weapons, ...armor].filter(item => item.data.equipped);

    // character traits
    context.ancestry = ancestry;
    context.heritages = heritages;
    context.classes = classes;
    
    // computed/derived stats
    context.move = this.actor.data.data.move;
    context.hasSpellcasting = !!classes.filter(obj => obj.hasSpellcasting).length;
    context.saves = this.actor.data.data.saves.targets;
    context.saveMods = this.actor.data.data.saves.mods;
    context.carryWeight = this.actor.data.data.carryWeight
    context.ac = this.actor.data.data.ac;
  }

  _formatWeaponForUse(item, actor) {
    item.data.modToHit += actor.data.toHitMods[item.data.weaponType];
    item.data.modDamage += actor.data.damageMods[item.data.weaponType];
    
    return item;
  }

  _formatClassForUse({_id, name, data}) {
    const level = getLevelFromXP(data.xp);
    const classGroupData = getClassGroupAtLevel(data.classGroup, level)
    
    const filteredFeatures = Object.keys(data.features)
      .filter(key => data.features?.[key].level <= level)
      .reduce((features, key) => ({ ...features, [key]: data.features[key]}), {});

    console.info(filteredFeatures);

    return {
      id: _id,
      name,
      ...data,
      level,
      ...getClassGroupAtLevel(data.classGroup, level),
      spellSlots: data?.spellSlots?.[level],
      features: filteredFeatures,
      xpNext: getNextLevelXP(data.xp)
    }
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    const itemClass = '.items__list-item';

    this.itemMenu = new ContextMenu(
      $(itemClass).parent('ul'),
      `${itemClass}:not(${itemClass}--header)`,
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
    
    html.find('[data-item-action]').click(ev => {
      const {itemId, itemAction} = ev.currentTarget.dataset;
      const item = this.actor.items.get(itemId);

      switch (itemAction) {
        case 'edit': item.sheet.render(true); break;
        case 'delete': item.delete(); break;
      }
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
        if (li.classList.contains("items__list-item--header")) return;
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
      let label = dataset.label ? `[${dataset.rollType ? dataset.rollType : ''}] ${dataset.label}` : '';
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
