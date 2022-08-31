import Tagify from '@yaireo/tagify';
import {
  prepareActiveEffectCategories
} from "../helpers/effects.mjs";
import {
  getLevelFromXP,
  getWisBonusSlots,
  reportAndQuit
} from '../helpers/utils.mjs';

import commonActorSheetBehaviors from './helpers/commonActorSheetBehaviors.mjs';
import prepareItems from './helpers/prepareItems.mjs';

/**
 * Extend the basic ActorSheet
 * @extends {ActorSheet}
 */
class ChromaticActorPCSheet extends ActorSheet {
  itemMenu = null;

  /** @override */
  static get defaultOptions() {
    const sheetClasses = ["chromatic-dungeons", "sheet", "sheet--actor", "sheet--pc"];

    if (game.settings.get('foundry-chromatic-dungeons', 'horizontal-attributes'))
      sheetClasses.push('sheet--horizontal-attributes')

    return mergeObject(super.defaultOptions, {
      classes: sheetClasses,
      template: `${CONFIG.CHROMATIC.templateDir}/actor/actor-pc-sheet.hbs`,
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".tab-group__container", initial: "summary" }]
    });
  }

  /** @override */
  get template() {
    return `${CONFIG.CHROMATIC.templateDir}/actor/actor-pc-sheet.hbs`;
  }

  /** @override */
  getData() {
    const context = super.getData();

    context.armorTypes = CONFIG.CHROMATIC.armorTypes;
    context.weaponTypes = CONFIG.CHROMATIC.weaponTypes;
    context.sizes = CONFIG.CHROMATIC.sizes;
    context.alignments = CONFIG.CHROMATIC.alignment

    this._prepareItems(context);

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    // Settings
    context.horizontalAttributes  = game.settings.get('foundry-chromatic-dungeons', 'horizontal-attributes');
    context.showDerivedStatsTab   = game.settings.get('foundry-chromatic-dungeons', 'derived-stats-tab');
    context.useGearCards          = game.settings.get('foundry-chromatic-dungeons', 'gear-cards');

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    const languageTags = new Tagify(
      document.querySelector(`#actor-${this.actor.id} [name="languages"]`),
      {
        maxTags: this.actor.system.maxLanguages,
        originalInputValueFormat: valuesArr => valuesArr.map(item => item.value)
      }
    );

    languageTags.on('change', async (e) => {
      this.actor.update({
        'system.languages': e.detail.value ? e.detail.value.split(',') : []
      })
    })

    /**
     * COMMON EVENTS
     */
     const {share, edit, remove} = commonActorSheetBehaviors(this, html);

    /**
     * CLASS & XP
     */
    html.find('[data-actor-action]').click(ev => {
      const action = ev.currentTarget.dataset.actorAction;

      switch (action) {
        case 'update-xp': this._addXP(); break;
      }
    })

    /**
     * SPELLS & CASTING
     */

    this.knownSlotSpellMenu = new ContextMenu(
      html.find('.known-spells--slot-caster'),
      '.spell:not(.spell--empty)',
      [
        {
          name: 'Prepare',
          icon: '<i class="fa fa-book"></i>',
          condition: (node) => this._canPrepareSpell(node),
          callback: (node) => this._prepareSpell(node)
        },
        edit,
        {
          name: 'Delete',
          icon: '<i class="fa fa-trash"></i>',
          callback: (node) => this._deleteSpell(node)
        },
      ]
    );

    this.knownPointSpellMenu = new ContextMenu(
      html.find('.known-spells--points-caster'),
      '.spell:not(.spell--empty)',
      [ 
        {
          name: 'Cast',
          icon: '<i class="fa fa-star"></i>',
          callback: (node) => this._castSpell(node)
        },
        share,
        edit,
        remove
      ]
    );

    this.preparedSpellMenu = new ContextMenu(
      html.find('.prepared-spells'),
      '.spell:not(.spell--empty)',
      [
        {
          name: 'Cast',
          icon: '<i class="fa fa-star"></i>',
          callback: (node) => this._castSpell(node)
        },
        share,
        {
          name: 'Clear',
          icon: '<i class="fa fa-trash"></i>',
          callback: (node) => this._clearSpell(node)
        },
      ]
    );

    html.find('.spell-points__values input').change(async (ev) => {
      const updatedValue = ev.currentTarget.value;
      const {itemId} = ev.currentTarget.dataset;

      await this.actor.items.get(itemId).update({
        'system.currentSpellPoints': updatedValue
      });
    })

    // @todo Condense this and the next event
    html.find('.known-spells--points-caster .spell, .prepared-spells .spell:not(.spell--empty)').click(async (ev) => {
      this._castSpell($(ev.currentTarget));
    })

    html.find('.known-spells--slot-caster .spell:not(.spell--empty)').click(async (ev) => {
      this._prepareSpell($(ev.currentTarget));
    })
  }

  /**
   * ====================== PRIVATE ====================== 
   */

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   * 
   * @return {undefined}
   */
  _prepareItems(context) {
    prepareItems(context);
  }

  /**
   * @overrides
   */
   async _onDropItem(event, data) {
    const item = await Item.implementation.fromDropData(data);
    const result = await super._onDropItem(event, data);
    
    if (item.parent)
      await item.delete();

    return result;
  }


  /**
   * ---------------------- CLASS & XP ---------------------- 
   * @todo How much of this can be moved to the Actor?
   */

  /**
   * @todo Move this to the dialogs folder?
   * @todo Move this to the PC data model?
   * @returns 
   */
  _addXP() {
    return Dialog.confirm({
      title: `Add XP to ${this.actor.name}`,
      content: `
        <div class="roll-modifiers-field">
          <label for="modifier">XP to add:</label>
          <input name="modifier" placeholder="-2, 4, etc"  />
        </div>
      `,
      yes: async (html) => {
        const xp = parseInt(html.find('[name="modifier"]').val() || 0);
        const classes = this.actor.items.filter(i => i.type === 'class');
        const xpToAdd = Math.floor(xp / (classes.length || 1))

        for (let i = 0, j = classes.length; i < j; i++) {
          const item = classes[i];

          await item.update({
            ['system.xp']: item.system.xp + xpToAdd
          })
        }
      },
      defaultYes: 'false'
    });
  }

  /**
   * ---------------------- SPELLCASTING ---------------------- 
   * @todo How much of this can be moved to the Actor?
   */

  _canPrepareSpell(itemNode) {
    const {itemId: classId, spellLevel} = itemNode.parents('.spell-level').data();
    const classItem = this.actor.items.get(classId);

    const slotsAtLevel = classItem.system.spellSlots[getLevelFromXP(classItem.system.xp)];
    const maxSlotsAtLevel = (!classItem.system.hasWisdomBonusSlots)
      ? slotsAtLevel[spellLevel]
      : getWisBonusSlots(
          slotsAtLevel,
          classItem.system.hasWisdomBonusSlots,
          this.actor.system.attributes.wis
        )[spellLevel];

    const preparedSpellsAtLevel = classItem.system.preparedSpells[spellLevel].length;

    return maxSlotsAtLevel > preparedSpellsAtLevel;
  }

  _prepareSpell(itemNode) {
    if (!this._canPrepareSpell(itemNode)) return;

    const [classItem, spellLevel, spellId, spellItem] = this._getSpellPropsFromNode(itemNode);
    classItem.system.prepareSpell(spellItem, spellLevel);
  }

  async _castSpell(itemNode) {
    const [classItem, spellLevel, spellId] = this._getSpellPropsFromNode(itemNode);

    if (!classItem.system.hasSpellPoints) {
      itemNode.addClass('spell--removing');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    classItem.system.castSpell(spellId, spellLevel)
  }

  async _clearSpell(itemNode) {
    const [classItem, spellLevel, spellId] = this._getSpellPropsFromNode(itemNode);

    if (!classItem.system.hasSpellPoints) {
      itemNode.addClass('spell--removing');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    
    classItem.system.clearSpell(spellId, spellLevel)
  }

  async _deleteSpell(itemNode) {
    const [classItem, spellLevel, spellId] = this._getSpellPropsFromNode(itemNode);
    if (classItem.system.hasSpellAsPrepared(spellId, spellLevel))
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

  /**
   * ---------------------- EQUIPMENT ---------------------- 
   * @todo How much of this can be moved to the Actor?
   */

  _canAttackWithItem(node) {
    const {itemId: id} = node.closest('[data-item-id]').data();
    const item = this.actor.items.get(id);

    if (item.system.weaponType === 'thrown')
      return (item.system.quantity.value > 0);

    return (
      item.type === 'weapon' &&
      item.system.equipped
    )
  }

  _canSetEquipStateTo(node, newState) {
    const {itemId: id} = node.closest('[data-item-id]').data();

    const itemToEquip = this.actor.items.get(id);
    const canEquip = () => itemToEquip.system.equipped !== newState;

    if (!itemToEquip.system.equippable)
      return false;

    // We'll need to open things up for accessories later
    if (
      itemToEquip.type !== 'weapon' &&
      itemToEquip.type !== 'armor'
    ) return false;

    if (
      itemToEquip.type === 'weapon' &&
      itemToEquip.system.weaponType === 'ammunition'
    ) return false;

    if (
      itemToEquip.system.weaponType === 'thrown' &&
      itemToEquip.system.quantity.value <= 0 &&
      newState
    ) return false;

    if (
      itemToEquip.type === 'armor' &&
      itemToEquip.system.armorType !== 'shield'
    ) return canEquip();

    return canEquip();
  }

  _toggleEquippedState(node, newState) {
    const isWeapon    = (i) => i.type === 'weapon';
    const isArmor     = (i) => i.type === 'armor';
    const isShield    = (i) => i.system.armorType === 'shield';
    const isTwoHanded = (i) => !!i.system.twoHanded;
    const isEquipped  = (i) => !!i.system.equipped;
    const hasTwoHanded= (i) => isWeapon(i) && isEquipped(i) && isTwoHanded(i);
    
    const handsFullMessage = `${this.actor.name}'s hands are full! Unequip something and try again.`;

    const {itemId: id} = node.closest('[data-item-id]').data();

    const item = this.actor.items.get(id);

    // Weapon/shield validation
    if (newState && (isWeapon(item) || isShield(item))) {
      // Validate only being allowed two weapons
      if (
        this.actor.items.filter(
          i => isWeapon(i) && isEquipped(i)
        ).length >= this.actor.system.hands
      ) return reportAndQuit(handsFullMessage);

      // Validate only being allowed one two-handed weapon
      if (
        !!this.actor.items.find(hasTwoHanded)
      ) return reportAndQuit(handsFullMessage);

      // Validate not being able to equip a two handed weapon 
      // when you don't have both hands free
      if (
        isTwoHanded(item) &&
        !!this.actor.items.find(i => isEquipped(i) && (
          isWeapon(i) || isShield(i)
        ))
      ) return reportAndQuit(handsFullMessage);

      // Validate only being allowed one weapon with a shield equipped
      if (
        !!this.actor.items.find(i => isWeapon(i) && isEquipped(i)) &&
        !!this.actor.items.find(i => isShield(i) && isEquipped(i))
      ) return reportAndQuit(handsFullMessage);
    }

    // Helmet/Barding/Armor validation
    if (newState && (isArmor(item) && !isShield(item))) {
      const { armorType } = item.system;

      if (this.actor.type === 'pc' && armorType === 'barding')
        return reportAndQuit(`${this.actor.name} cannot equip ${item.name}, because it is barding, and they are not a horse.`);

      const equippedItemsInSlot = this.actor.items.filter(
        i => i.system.armorType === armorType && isEquipped(i)
      );

      equippedItemsInSlot.forEach(i => i.update({
        'system.equipped': false
      }));
    }
    
    item.update({
      'system.equipped': newState
    });
  }

  _validateEquippedArmor(li, item, ev) {
    const siblings = li
      .siblings()
      .filter((_, node) => node.dataset.armorType === item.system.armorType)
      .not('.items__list-item--header');

    const overlappingArmorTypes = !!siblings.filter((_, node) => {
      const siblingItem = this.actor.items.get(node.dataset.itemId);

      return (siblingItem.system.armorType === item.system.armorType) &&
        siblingItem.system.equipped
    }).length;

    if (overlappingArmorTypes) {
      siblings
        .children('.items__list-column--equipped input[type="checkbox"]')
        .prop('checked', false);

      siblings.each((_, node) => {
        const siblingItem = this.actor.items.get(node.dataset.itemId);

        siblingItem.update({
          _id: siblingItem.id,
          'system.equipped': false
        });
      });
    }

    return item.update({
      _id: item.id,
      'system.equipped': ev.target.checked
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
      'system.equipped': ev.target.checked
    });
  }

  /**
   * ---------------------- ITEM CRUD ---------------------- 
   */
  _editOwnedItem(itemNode) {
    const {itemId: id} = itemNode.closest('[data-item-id]').data();
    this.actor.items.get(id).sheet.render(true);
  }

  _deleteOwnedItem(itemNode) {
    const {itemId: id} = itemNode.closest('[data-item-id]').data();
    this.actor.items.get(id).delete();
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
}

export default ChromaticActorPCSheet;


