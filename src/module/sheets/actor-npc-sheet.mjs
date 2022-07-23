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
class ChromaticActorNPCSheet extends ActorSheet {
  itemMenu = null;

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["chromatic-dungeons", "sheet", "actor"],
      template: `${CONFIG.CHROMATIC.templateDir}/actor/actor-npc-sheet.hbs`,
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".tab-group__container", initial: "summary" }]
    });
  }

  /** @override */
  get template() {
    return `${CONFIG.CHROMATIC.templateDir}/actor/actor-npc-sheet.hbs`;
  }

  /** @override */
  getData() {
    const context = super.getData();

    context.armorTypes    = CONFIG.CHROMATIC.armorTypes;
    context.weaponTypes   = CONFIG.CHROMATIC.weaponTypes;
    context.sizes         = CONFIG.CHROMATIC.sizes;
    context.alignments    = CONFIG.CHROMATIC.alignment;
    context.monsterTypes  = CONFIG.CHROMATIC.monsterTypes;
    context.variants      = CONFIG.CHROMATIC.monsterVariants;
    context.moveTypes     = CONFIG.CHROMATIC.moveTypes;
    context.hitDieSizes   = CONFIG.CHROMATIC.hitDieSizes;

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

    /**
     * COMMON EVENTS
     */
     const {share, edit, remove} = commonActorSheetBehaviors(this, html);

    this.spellMenu = new ContextMenu(
      $('.items__list--npc-spells'),
      '.items__list-item:not(.items__list-item--header)',
      [ 
        {
          name: 'Cast',
          icon: '<i class="fa fa-star"></i>',
          callback: this._castSpell.bind(this)
        },
        edit,
        remove
      ]
    );

    html.find('.known-spells .spell:not(.spell--empty)').click(async (ev) => {
      this._castSpell($(ev.currentTarget));
    })

    html.find('[data-roll="morale"]').click(() => this.actor.moraleRoll() );

    html.find('[data-action="add-npc-move"]').click(ev => {
      this.actor.update({
        [`data.move.${randomID()}`]: {type: 'move', distance: 30}
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

  // /**
  //  * ---------------------- SPELLCASTING ---------------------- 
  //  * @todo How much of this can be moved to the Actor?
  //  */

  async _castSpell(node) {
    const {itemId} = node.data();
    console.info(this.actor.items.get(itemId).system)
    this.actor.items.get(itemId).roll();
  }

  // /**
  //  * ---------------------- EQUIPMENT ---------------------- 
  //  * @todo How much of this can be moved to the Actor?
  //  */

  /**
   * Monsters can use *all* of their weapons.
   * @param {*} node 
   * @returns 
   */
  _canAttackWithItem(node) {
    return true
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

  // _toggleEquippedState(node, newState) {
  //   const isWeapon    = (i) => i.type === 'weapon';
  //   const isArmor     = (i) => i.type === 'armor';
  //   const isShield    = (i) => i.system.armorType === 'shield';
  //   const isTwoHanded = (i) => !!i.system.twoHanded;
  //   const isEquipped  = (i) => !!i.system.equipped;
  //   const hasTwoHanded= (i) => isWeapon(i) && isEquipped(i) && isTwoHanded(i);
    
  //   const handsFullMessage = `${this.actor.name}'s hands are full! Unequip something and try again.`;

  //   const {itemId: id} = node.closest('[data-item-id]').data();

  //   const item = this.actor.items.get(id);

  //   // Weapon/shield validation
  //   if (newState && (isWeapon(item) || isShield(item))) {
  //     // Validate only being allowed two weapons
  //     if (
  //       this.actor.items.filter(
  //         i => isWeapon(i) && isEquipped(i)
  //       ).length >= this.actor.system.hands
  //     ) return reportAndQuit(handsFullMessage);

  //     // Validate only being allowed one two-handed weapon
  //     if (
  //       !!this.actor.items.find(hasTwoHanded)
  //     ) return reportAndQuit(handsFullMessage);

  //     // Validate not being able to equip a two handed weapon 
  //     // when you don't have both hands free
  //     if (
  //       isTwoHanded(item) &&
  //       !!this.actor.items.find(i => isEquipped(i) && (
  //         isWeapon(i) || isShield(i)
  //       ))
  //     ) return reportAndQuit(handsFullMessage);

  //     // Validate only being allowed one weapon with a shield equipped
  //     if (
  //       !!this.actor.items.find(i => isWeapon(i) && isEquipped(i)) &&
  //       !!this.actor.items.find(i => isShield(i) && isEquipped(i))
  //     ) return reportAndQuit(handsFullMessage);
  //   }

  //   // Helmet/Barding/Armor validation
  //   if (newState && (isArmor(item) && !isShield(item))) {
  //     const { armorType } = item.system;

  //     if (this.actor.type === 'pc' && armorType === 'barding')
  //       return reportAndQuit(`${this.actor.name} cannot equip ${item.name}, because it is barding, and they are not a horse.`);

  //     const equippedItemsInSlot = this.actor.items.filter(
  //       i => i.system.armorType === armorType && isEquipped(i)
  //     );

  //     equippedItemsInSlot.forEach(i => i.update({
  //       'system.equipped': false
  //     }));
  //   }
    
  //   item.update({
  //     'system.equipped': newState
  //   });
  // }

  // _validateEquippedArmor(li, item, ev) {
  //   const siblings = li
  //     .siblings()
  //     .filter((_, node) => node.dataset.armorType === item.system.armorType)
  //     .not('.items__list-item--header');

  //   const overlappingArmorTypes = !!siblings.filter((_, node) => {
  //     const siblingItem = this.actor.items.get(node.dataset.itemId);

  //     return (siblingItem.system.armorType === item.system.armorType) &&
  //       siblingItem.system.equipped
  //   }).length;

  //   if (overlappingArmorTypes) {
  //     siblings
  //       .children('.items__list-column--equipped input[type="checkbox"]')
  //       .prop('checked', false);

  //     siblings.each((_, node) => {
  //       const siblingItem = this.actor.items.get(node.dataset.itemId);

  //       siblingItem.update({
  //         _id: siblingItem.id,
  //         'system.equipped': false
  //       });
  //     });
  //   }

  //   return item.update({
  //     _id: item.id,
  //     'system.equipped': ev.target.checked
  //   });
  // }

  // _validateEquippedWeapon(li, item, ev) {
  //   ev.preventDefault();
  //   ev.stopPropagation();
    
  //   const equippedItems = li
  //     .parent('ul')
  //     .children('li')
  //     .not('.items__list-item--header')
  //     .children('.items__list-column--equipped')
  //     .find('input:checked')

  //   if (equippedItems.length >= 3) {
  //     ev.target.checked = false;
  //     return false;
  //   }

  //   return item.update({
  //     _id: item.id,
  //     'system.equipped': ev.target.checked
  //   });
  // }

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

export default ChromaticActorNPCSheet;


