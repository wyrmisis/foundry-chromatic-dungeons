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
      template: `${CONFIG.CHROMATIC.templateDir}/actor/actor-sheet.html`,
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".tab-group__container", initial: "summary" }]
    });
  }

  /** @override */
  get template() {
    return `systems/foundry-chromatic-dungeons/templates/actor/actor-${this.actor.data.type}-sheet.html`;
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
      this._prepareNpcData(context);
    }

    // Common data
    context.saves = this.actor.data.data.saves.targets;
    context.saveMods = this.actor.data.data.saves.mods;
    context.ac = this.actor.data.data.ac;

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
    
    // computed/derived stats
    context.hasSpellcasting = !!context.classes.filter(obj => obj.hasSpellcasting).length;
    context.move = this.actor.data.data.move;
    context.carryWeight = this.actor.data.data.carryWeight
    
    if (this.actor.id === game.user.character.id) {
      context.accentColor = game.user.color;
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
   _prepareNpcData(context) {
    // Handle ability scores.
    // for (let [k, v] of Object.entries(context.data.attributes)) {
    //   v.label = game.i18n.localize(CONFIG.CHROMATIC.attributeLabels[k]) ?? k;
    // }

    // Constants for the template
    // context.armorTypes = CONFIG.CHROMATIC.armorTypes;
    context.monsterTypes = CONFIG.CHROMATIC.monsterTypes;
    
    // computed/derived stats
    // context.move = this.actor.data.data.move;
    // context.saves = this.actor.data.data.saves.targets;
    // context.saveMods = this.actor.data.data.saves.mods;
    // context.carryWeight = this.actor.data.data.carryWeight
    // context.ac = this.actor.data.data.ac;
  }

  

  /**
   * Organize and classify Items for Character sheets.
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
      wealth = [],
      ancestry = {},
      heritages = [],
      classes = [],
      spells = [];

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
        case 'treasure':
        case 'magicItem':
          wealth.push(item);
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
          spells.push(item);
          break;
      }
    });

    // weapons and ammunition
    context.weapons = weapons
      .filter(item =>item.data.weaponType !== 'ammunition')
      .map(item => this._formatWeaponForUse(item, this.actor.data));
    context.ammunition = weapons
      .filter(item => item.data.weaponType === 'ammunition' && item.data.ammunitionType)
      .reduce((types, ammo) => {
        const currentAmmoType = ammo.data.ammunitionType;
        return (types[currentAmmoType])
          ? { ...types, [currentAmmoType]: [ ...types[currentAmmoType], ammo ] }
          : { ...types, [currentAmmoType]: [ammo] };          
      }, {});

    // gear
    context.armor = armor;
    context.gear = [
      ...gear,
      ...weapons.filter(item => item.data.weaponType === 'ammunition')
    ];
    context.wealth = wealth;
    context.spells = spells;
    context.skills = classes
      .filter(item => item?.skills)
      .map(({name, id, skills}) => ({name, id, skills}));

    // character traits
    context.ancestry = ancestry;
    context.heritages = heritages;
    context.classes = classes;

    // Equipped gear
    context.equippedItems = [...weapons, ...armor].filter(item => item.data.equipped);
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

    return {
      id: _id,
      name,
      ...data,
      level,
      ...classGroupData,
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

    this.itemMenu = new ContextMenu(
      $(itemClass).parent('ul'),
      `${itemClass}:not(${itemClass}--header):not(${itemClass}--empty)`,
      [
        { 
          name: 'Edit',
          icon: '<i class="fa fa-edit" />', 
          callback: (node) => this._editOwnedItem(node)
        },
        { 
          name: 'Delete',
          icon: '<i class="fa fa-trash" />', 
          callback: (node) => this._deleteOwnedItem(node)
        },
      ]
    );

    this.knownSpellMenu = new ContextMenu(
      $('.known-spells'),
      '.known-spell',
      [
        {
          name: 'Prepare',
          icon: '<i class="fa fa-book" />',
          condition: (node) => this._canPrepareSpell(node),
          callback: (node) => this._prepareSpell(node)
        },
        {
          name: 'Edit',
          icon: '<i class="fa fa-edit" />',
          callback: (node) => this._editOwnedItem(node)
        },
        {
          name: 'Delete',
          icon: '<i class="fa fa-trash" />',
          callback: (node) => this._deleteOwnedItem(node)
        },
      ]
    );

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
      const {itemId, itemAction, itemType} = ev.currentTarget.dataset;
      let item;

      if (['edit', 'delete'].includes(itemAction))
        item = this.actor.items.get(itemId);

      switch (itemAction) {
        case 'create': Item.create({
            name: `New ${itemType}`,
            type: itemType,
          }, {
            parent: this.actor
          }); break;
        case 'edit': item.sheet.render(true); break;
        case 'delete': item.delete(); break;
      }
    });

    html.find('[data-edit-item]').change(ev => {
      const {itemId, itemField} = ev.currentTarget.dataset;
      const item = this.actor.items.get(itemId)

      item.update({
        [itemField]: ev.target.value
      })
    })

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

    html.find('.prepared-spell__slot:not(prepared-spell__slot--empty)').click(async (ev) => {
      const spellId = ev.currentTarget.dataset.itemId;
      const spellLevel = ev.currentTarget.closest('.spell-level').dataset.spellLevel;
      const classItem = this.actor.items.get(ev.currentTarget.closest('.spell-level').dataset.itemId);

      classItem.castSpell(spellId, spellLevel)
    })

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

  _canPrepareSpell(itemNode) {
    const {itemId: classId, spellLevel} = itemNode.parents('.spell-level').data();
    const classItem = this.actor.items.get(classId);

    const maxSlotsAtLevel = classItem.data.data.spellSlots[getLevelFromXP(classItem.data.data.xp)][spellLevel];
    const preparedSpellsAtLevel = classItem.data.data.preparedSpells[spellLevel].length;

    return maxSlotsAtLevel > preparedSpellsAtLevel;
  }

  _prepareSpell(itemNode) {
    const {itemId: classId, spellLevel} = itemNode.parents('.spell-level').data();
    const {itemId: spellId} = itemNode.data();
    const classItem = this.actor.items.get(classId);
    const spellItem = this.actor.items.get(spellId);

    classItem.prepareSpell(spellItem, spellLevel);
  }

  _editOwnedItem(itemNode) {
    const {itemId: id} = itemNode.closest('[data-item-id]').data();
    this.actor.items.get(id).sheet.render(true);
  }

  _deleteOwnedItem(itemNode) {
    const {itemId: id} = itemNode.closest('[data-item-id]').data();
    this.actor.items.get(id).delete();
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
        const itemId = element.closest('[data-item-id]').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
      if (dataset.rollType === 'natural-attack') {
        const {damage} = element.dataset;
        return this.actor.naturalAttack(damage)
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll){
      return this._rollModal(dataset).render(true);
    }
  }

  _rollModal({roll, rollType, label}) {
    let rollLabel = label
      ? `${rollType ? `[${rollType}] ` : ''}${label}`
      : '';

    let buttons = {
      roll: {
        label: 'Roll',
        callback: (html) => {
          const modifier = parseInt(html.find('[name="modifier"]').val() || 0);

          let rollObject = new Roll(`${modifier} + ${roll}`, this.actor.getRollData()).roll();
          rollObject.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: rollLabel,
            rollMode: game.settings.get('core', 'rollMode'),
          });
          return rollObject;
        }
      },
      cancel: {
        label: 'Cancel'
      }
    };

    return new Dialog({
      title: `${this.actor.name} is rolling: ${rollLabel}`,
      content: `
        <div>
          <label for="modifier">Modifier:</label>
          <input name="modifier" placeholder="-2, 4, etc"  />
        </div>
      `,
      buttons,
      default: 'roll'
    });
  }
}
