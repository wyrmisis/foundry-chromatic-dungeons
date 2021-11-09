import {
  onManageActiveEffect,
  prepareActiveEffectCategories
} from "../helpers/effects.mjs";
import { reportAndQuit } from "../helpers/utils.mjs";
import {
  getLevelFromXP,
  getNextLevelXP,
  getClassGroupAtLevel,
  getWisBonusSlots
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
    return `${CONFIG.CHROMATIC.templateDir}/actor/actor-${this.actor.data.type}-sheet.html`;
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

    context.armorTypes = CONFIG.CHROMATIC.armorTypes;
    context.weaponTypes = CONFIG.CHROMATIC.weaponTypes;
    context.sizes = CONFIG.CHROMATIC.sizes;
    context.alignments = CONFIG.CHROMATIC.alignment

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
    context.saves = this.actor?.data?.data?.saves?.targets;
    context.saveMods = this.actor?.data?.data?.saves?.mods;
    context.ac = this.actor.data.data.ac;

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    // Settings
    context.horizontalAttributes  = game.settings.get('foundry-chromatic-dungeons', 'horizontal-attributes');
    context.showDerivedStatsTab   = game.settings.get('foundry-chromatic-dungeons', 'derived-stats-tab');
    context.useGearCards          = game.settings.get('foundry-chromatic-dungeons', 'gear-cards');

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
    // computed/derived stats
    context.hasSpellcasting = !!context.classes.filter(obj => obj.hasSpellcasting).length;
    context.move = this.actor.data.data.move;
    context.carryWeight = this.actor.data.data.carryWeight
    
    if (this.actor.id === game.user?.character?.id) {
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
    // Constants for the template
    context.monsterTypes  = CONFIG.CHROMATIC.monsterTypes;
    context.variants      = CONFIG.CHROMATIC.monsterVariants;
    context.moveTypes     = CONFIG.CHROMATIC.moveTypes;
    context.hitDieSizes   = CONFIG.CHROMATIC.hitDieSizes;
    context.isNPC         = true;
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
    context.skills = this._formatSkillsForUse(classes);


    // character traits
    context.ancestry = ancestry;
    context.heritages = heritages.reduce(
      (list, item) => ({...list, [item._id]: item}),
      {}
    );
    context.classes = classes;

    // Equipped gear
    context.equippedItems = [...weapons, ...armor].filter(item => item.data.equipped);
  }

  _formatSkillsForUse(classes) {
    const listFactory = (name, id, skills) => ({
      name, id, skills
    });

    const skillFactory = (name, attribute, bonus) => ({
      name, attribute, bonus
    });

    const commonSkills = [
      ['Perception', 'wis', this.actor.data.data.perception]
    ];

    let commonSkillList = [listFactory(
      'Common Skills',
      randomID(),
      commonSkills.map(
        (skill) => skillFactory(...skill)
      )
    )];
    
    let classSkillList = classes
      .filter(item => item?.skills)
      .map(({name, id, skills}) => ({name, id, skills}));

    return [...commonSkillList, ...classSkillList];
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
    const itemCardClass = '.item-card';

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

    const commonContextOptions = {
      edit: { 
        name: 'Edit',
        icon: '<i class="fa fa-edit" />', 
        callback: (node) => this._editOwnedItem(node)
      },
      delete: {
        name: 'Delete',
        icon: '<i class="fa fa-trash" />', 
        callback: (node) => this._deleteOwnedItem(node)
      }
    }

    this.itemMenu = new ContextMenu(
      $(itemClass).parent('ul'),
      `${itemClass}:not(${itemClass}--header):not(${itemClass}--empty)`,
      [
        {
          name: "Attack",
          icon: '<i class="fas fa-fist-raised" />',
          condition: (node) => this._canAttackWithItem(node),
          callback: (node) => {
            const {itemId: id} = node.closest('[data-item-id]').data();
            const item = this.actor.items.get(id);
            item.roll(node, true)
          }
        },
        {
          name: "Equip",
          icon: '<i class="fas fa-hand-rock" />',
          condition: (node) => this._canSetEquipStateTo(node, true),
          callback: (node) => this._toggleEquippedState(node, true)
        },
        {
          name: "Unequip",
          icon: '<i class="fas fa-hand-paper" />',
          condition: (node) => this._canSetEquipStateTo(node, false),
          callback: (node) => this._toggleEquippedState(node, false)
        },
        commonContextOptions.edit,
        commonContextOptions.delete
      ]
    );

    this.itemCardMenu = new ContextMenu(
      $(itemCardClass).parent('ul'),
      itemCardClass,
      [
        commonContextOptions.edit,
        commonContextOptions.delete
      ]
    )

    this.knownSlotSpellMenu = new ContextMenu(
      $('.known-spells--slot-caster'),
      '.spell:not(.spell--empty)',
      [
        {
          name: 'Prepare',
          icon: '<i class="fa fa-book" />',
          condition: (node) => this._canPrepareSpell(node),
          callback: (node) => this._prepareSpell(node)
        },
        commonContextOptions.edit,
        {
          name: 'Delete',
          icon: '<i class="fa fa-trash" />',
          callback: (node) => this._deleteSpell(node)
        },
      ]
    );

    this.knownPointSpellMenu = new ContextMenu(
      $('.known-spells--points-caster'),
      '.spell:not(.spell--empty)',
      [
        commonContextOptions.edit,
        commonContextOptions.delete
      ]
    );

    this.preparedSpellMenu = new ContextMenu(
      $('.prepared-spells'),
      '.spell:not(.spell--empty)',
      [
        {
          name: 'Cast',
          icon: '<i class="fa fa-star" />',
          callback: (node) => this._castSpell(node)
        },
        {
          name: 'Clear',
          icon: '<i class="fa fa-trash" />',
          callback: (node) => this._clearSpell(node)
        },
      ]
    );

    this.npcAttackMenu = new ContextMenu(
      $('.sheet--npc .attack-list'),
      '.attack:not(.attack--header)',
      [
        {
          name: 'Delete',
          icon: '<i class="fa fa-trash" />',
          callback: (node) => this._deleteMonsterAttack(node)
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
      const updateActions = ['edit', 'delete', 'update-xp'];
      let item;

      if (updateActions.includes(itemAction))
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

    html.find('[data-actor-action]').click(ev => {
      const action = ev.currentTarget.dataset.actorAction;

      switch (action) {
        case 'update-xp': this._addXP(); break;
      }
    })

    html.find('[data-edit-item]').change(ev => {
      const {itemId, itemField} = ev.currentTarget.dataset;
      const item = this.actor.items.get(itemId)

      item.update({
        [itemField]: ev.target.value
      })
    })

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    html.find('.prepared-spells .spell:not(.spell--empty)').click(async (ev) => {
      this._castSpell($(ev.currentTarget));
    })

    html.find('.known-spells--slot-caster .spell:not(.spell--empty)').click(async (ev) => {
      this._prepareSpell($(ev.currentTarget));
    })

    html.find('.known-spells--points-caster .spell').click(async (ev) => {
      this._castSpell($(ev.currentTarget));
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

    html.find('[data-action="add-npc-move"]').click(ev => {
      this.actor.update({
        [`data.move.${randomID()}`]: {type: 'move', distance: '0'}
      });
    });
    html.find('[data-action="delete-npc-move"]').click(ev => {
      const { index } = ev.currentTarget.dataset;

      this.actor.update({
        [`data.move`]: {
          [`-=${index}`]: null
        }
      });
    });

    html.find('[data-action="quantity-update"]').change(ev => {
      const item = this.actor.items.get(
        $(ev.currentTarget).parents(`${itemClass}, ${itemCardClass}`).data('itemId')
      );

      const value = parseInt(ev.currentTarget.value),
            {min, value: old} = item.data.data.quantity; 

      if (old === value) return; // don't waste resources on non-changes
      
      item.update({
        ['data.quantity.value']: value >= min ? value : min
      });
    });
  }

  _addXP() {
    return Dialog.confirm({
      title: `Add XP to ${this.actor.name}`,
      content: `
        <div class="roll-modifiers-field">
          <label for="modifier">XP to add:</label>
          <input name="modifier" placeholder="-2, 4, etc"  />
        </div>
      `,
      yes: (html) => {
        const xp = parseInt(html.find('[name="modifier"]').val() || 0);
        const classes = this.actor.items.filter(i => i.type === 'class');
        const xpToAdd = Math.floor(xp / (classes.length || 0))

        classes.forEach(i => {
          i.update({
            ['data.xp']: i.data.data.xp + xpToAdd
          })
        });
      },
      defaultYes: 'false'
    });
  }

  _deleteMonsterAttack(itemNode) {
    const { index } = itemNode.data();

    this.actor.update({
      [`data.attacks`]: {
        [`-=${index}`]: null
      }
    });
  }

  _canPrepareSpell(itemNode) {
    const {itemId: classId, spellLevel} = itemNode.parents('.spell-level').data();
    const classItem = this.actor.items.get(classId);

    const slotsAtLevel = classItem.data.data.spellSlots[getLevelFromXP(classItem.data.data.xp)];
    const maxSlotsAtLevel = (!classItem.data.data.hasWisdomBonusSlots)
      ? slotsAtLevel[spellLevel]
      : getWisBonusSlots(
          slotsAtLevel,
          classItem.data.data.hasWisdomBonusSlots,
          this.actor.data.data.attributes.wis
        )[spellLevel];

    const preparedSpellsAtLevel = classItem.data.data.preparedSpells[spellLevel].length;

    return maxSlotsAtLevel > preparedSpellsAtLevel;
  }

  _prepareSpell(itemNode) {
    if (!this._canPrepareSpell(itemNode)) return;

    const [classItem, spellLevel, spellId, spellItem] = this._getSpellPropsFromNode(itemNode);
    classItem.prepareSpell(spellItem, spellLevel);
  }

  async _castSpell(itemNode) {
    const [classItem, spellLevel, spellId] = this._getSpellPropsFromNode(itemNode);

    if (!classItem.data.data.hasSpellPoints) {
      itemNode.addClass('spell--removing');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    classItem.castSpell(spellId, spellLevel)
  }

  async _clearSpell(itemNode) {
    const [classItem, spellLevel, spellId] = this._getSpellPropsFromNode(itemNode);

    if (!classItem.data.data.hasSpellPoints) {
      itemNode.addClass('spell--removing');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    
    classItem.clearSpell(spellId, spellLevel)
  }

  async _deleteSpell(itemNode) {
    const [classItem, spellLevel, spellId] = this._getSpellPropsFromNode(itemNode);
    if (classItem.hasSpellAsPrepared(spellId, spellLevel))
      reportAndQuit('You cannot delete this spell, because you have it prepared.')
    else {
      itemNode.addClass('spell--removing');
      await new Promise((resolve) => setTimeout(resolve, 100));
      this._deleteOwnedItem(itemNode);
    }
  }


  _getSpellPropsFromNode(itemNode) {
    const {itemId: classId, spellLevel} = itemNode.parents('.spell-level').data();
    const {itemId: spellId} = itemNode.data();
    const classItem = this.actor.items.get(classId);
    const spellItem = this.actor.items.get(spellId);
    return [classItem, spellLevel, spellId, spellItem];
  }

  _editOwnedItem(itemNode) {
    const {itemId: id} = itemNode.closest('[data-item-id]').data();
    this.actor.items.get(id).sheet.render(true);
  }

  _deleteOwnedItem(itemNode) {
    const {itemId: id} = itemNode.closest('[data-item-id]').data();
    this.actor.items.get(id).delete();
  }

  _canAttackWithItem(node) {
    const {itemId: id} = node.closest('[data-item-id]').data();
    const item = this.actor.items.get(id);

    return (item.type === 'weapon' && item.data.data.equipped)
  }

  _canSetEquipStateTo(node, newState) {
    const {itemId: id} = node.closest('[data-item-id]').data();

    const itemToEquip = this.actor.items.get(id);

    if (!itemToEquip.data.data.equippable)
      return false;

    if (newState) {
      const isWeapon    = (i) => i.type === 'weapon';
      const isEquipped  = (i) => i.data.data.equipped;
      const isTwoHanded = (i) => i.data.data.twoHanded;
      const hasTwoHanded= (i) => isWeapon(i) && isEquipped(i) && isTwoHanded(i);
      const hasAShield  = (i) => i.data.data.armorType === 'shield';

      // Validate only being allowed two weapons
      if (
        this.actor.items.filter(i => isWeapon(i) && isEquipped(i)).length >= 2
      ) return false;

      // Validate only being allowed one two-handed weapon
      if (
        !!this.actor.items.find(hasTwoHanded)
      ) return false;

      // Validate not being able to equip a two handed weapon 
      // when you don't have both hands free
      if (
        itemToEquip.data.data.twoHanded &&
        !!this.actor.items.find(i => isEquipped(i) && (
          isWeapon(i) || hasAShield(i)
        ))
      ) return false;

      // Validate only being allowed one weapon with a shield equipped
      if (
        !!this.actor.items.find(i => isWeapon(i) && isEquipped(i)) &&
        !!this.actor.items.find(i => hasAShield(i) && isEquipped(i))
      ) return false;
    }

    return itemToEquip.data.data.equipped !== newState;
  }

  _toggleEquippedState(node, newState) {
    const {itemId: id} = node.closest('[data-item-id]').data();
    
    this.actor.items.get(id).update({
      'data.equipped': newState
    });
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
    event?.preventDefault?.();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      switch(dataset.rollType.toLowerCase()) {
        case 'save':
          return this.actor.saveRoll(dataset.label, dataset.roll, dataset.target)
        case 'attribute':
          return this.actor.attributeRoll(dataset.label, dataset.roll, dataset.target)
        case 'item':
          const itemId = element.closest('[data-item-id]').dataset.itemId;
          const item = this.actor.items.get(itemId);
          if (item) return item.roll();
          break;
        case 'natural-attack':
          let {damage} = element.dataset;
          if (damage.indexOf (' ') >= 0)
            damage = damage.split(' ')[0];
          return this.actor.naturalAttack(damage);
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll){
      return this._rollModal(dataset).render(true);
    }
  }

  _onRollFromItem(node) {
    const {itemId: id} = node.closest('[data-item-id]').data();
    const item = this.actor.items.get(id);

    item._onRoll({
      element: {
        dataset: {
          rollType: 'item',
          label: item.name,
          itemId: item.id
        }
      }
    });
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
        <div class="roll-modifiers-field">
          <label for="modifier">Modifier:</label>
          <input name="modifier" placeholder="-2, 4, etc"  />
        </div>
      `,
      buttons,
      default: 'roll'
    });
  }

}
