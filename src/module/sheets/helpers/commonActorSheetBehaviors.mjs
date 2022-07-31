import { onManageActiveEffect } from "../../helpers/effects.mjs";

/**
 * A common set of Actor sheet behaviors, to be applied to any subclass of ActorSheet
 * 
 * Note: to make sure this works, call it from `ActorSheet.activateListeners(html)` like this: `commonActorSheetBehavior.bind(this, html)`
 * @param {ActorSheet} actorSheet - The ActorSheet to reference when assigning events 
 * @param {HTMLElement} html - The DOM node wrapping the sheet 
 * @returns 
 */
 const commonActorSheetBehaviors = (actorSheet, html) => {
  const itemClass = '.items__list-item';
  const itemCardClass = '.item-card';

  html.find('.class__name').click(ev => {
    const item = actorSheet.actor.items.get(ev.target.dataset.itemId);
    item.sheet.render(true);
  });

  // -------------------------------------------------------------
  // Everything below here is only needed if the sheet is editable
  if (!actorSheet.isEditable) return;

  const commonContextOptions = {
    share: { 
      name: 'Share in Chat',
      icon: '<i class="fa fa-eye"></i>', 
      callback: (node) => {
        const {itemId: id} = node.closest('[data-item-id]').data();
        const item = actorSheet.actor.items.get(id);
        item.roll({showWeapon: true})
      }
    },
    edit: { 
      name: 'Edit',
      icon: '<i class="fa fa-edit"></i>', 
      condition: () => actorSheet.actor.isOwner,
      callback: (node) => actorSheet._editOwnedItem(node)
    },
    remove: {
      name: 'Delete',
      icon: '<i class="fa fa-trash"></i>', 
      condition: () => actorSheet.actor.isOwner,
      callback: (node) => actorSheet._deleteOwnedItem(node)
    }
  };

  actorSheet.itemMenu = new ContextMenu(
    $(itemClass).parent('ul:not(.items__list--npc-spells)'),
    `${itemClass}:not(${itemClass}--header):not(${itemClass}--empty)`,
    [
      {
        name: "Attack",
        icon: '<i class="fas fa-fist-raised"></i>',
        condition: (node) => actorSheet._canAttackWithItem(node),
        callback: (node) => {
          const {itemId: id} = node.closest('[data-item-id]').data();
          const item = actorSheet.actor.items.get(id);
          item.roll()
        }
      },
      commonContextOptions.share,
      {
        name: "Equip",
        icon: '<i class="fas fa-hand-rock"></i>',
        condition: (node) => actorSheet._canSetEquipStateTo(node, true),
        callback: (node) => actorSheet._toggleEquippedState(node, true)
      },
      {
        name: "Unequip",
        icon: '<i class="fas fa-hand-paper"></i>',
        condition: (node) => actorSheet._canSetEquipStateTo(node, false),
        callback: (node) => actorSheet._toggleEquippedState(node, false)
      },
      commonContextOptions.edit,
      commonContextOptions.remove
    ]
  );

  actorSheet.itemCardMenu = new ContextMenu(
    $(itemCardClass).parent('ul'),
    itemCardClass,
    [
      commonContextOptions.share,
      commonContextOptions.edit,
      commonContextOptions.remove
    ]
  )

  /**
   * ACTOR
   */

  // Attribute Rolls
  html.find("[data-roll='attribute']").click((ev) => {
    const { key, bonus } = ev.currentTarget.dataset;
    actorSheet.actor.attributeRoll(key, bonus);
  });

  // Save Rolls
  html.find("[data-roll='save']").click((ev) => {
    const { key, bonus } = ev.currentTarget.dataset;
    actorSheet.actor.saveRoll(key, bonus);
  });

  /**
   * ACTIVE EFFECTS
   */

  // Active Effect management
  html.find(".effect-control").click(ev =>
    onManageActiveEffect(ev, actorSheet.actor)
  );

  /**
   * INVENTORY & USING ITEMS
   */

  html.find("[data-quick-item]").click((ev) => {
    const { itemId } = ev.currentTarget.dataset;
    actorSheet.actor.items.get(itemId).roll();
  });

  /**
   * Things we should be able to do with items from here:
   * * Create (if owner)
   * * Share in Chat (per-type chat template?)
   * * Edit (if owner)
   * * * Equip/Unequip (if allowed)
   * * * Adjust Quantity
   * * Delete
   * * Attack (if equipped)
   * 
   * Cool addons:
   * * Demystify (if Forien's Unidentified Items is installed and are GM)
   * * See rarity (colorful item names?)
   */

  // Add Inventory Item
  // html.find('.item-create').click(actorSheet._onItemCreate.bind(actorSheet));

  // Delete Inventory Item
  html.find('.item-delete').click(ev => {
    const li = $(ev.currentTarget).parents(itemClass);
    const item = actorSheet.actor.items.get(li.data("itemId"));
    item.delete();
    li.slideUp(200, () => actorSheet.render(false));
  });
  
  html.find('[data-item-action]').click(ev => {
    const {itemId, itemAction, itemType} = ev.currentTarget.dataset;
    const updateActions = ['edit', 'delete', 'update-xp', 'share'];
    let item;

    if (updateActions.includes(itemAction))
      item = actorSheet.actor.items.get(itemId);

    switch (itemAction) {
      case 'create': Item.create({
          name: `New ${itemType}`,
          type: itemType,
        }, {
          parent: actorSheet.actor
        }); break;
      case 'share': item.roll({showWeapon: true}); break;
      case 'edit': item.sheet.render(true); break;
      case 'delete': item.delete(); break;
    }
  });


  html.find('[data-edit-item]').change(ev => {
    const {itemId, itemField} = ev.currentTarget.dataset;
    const item = actorSheet.actor.items.get(itemId)

    item.update({
      [itemField]: ev.target.value
    })
  })

  // Roll items
  html.find('[data-roll-type="item"]').click(ev => {
    const {itemId} = ev.currentTarget.closest('li').dataset;
    const item = actorSheet.actor.items.get(itemId)

    item.roll();
  })

  // Drag events for macros.
  if (actorSheet.actor.isOwner) {
    let handler = ev => actorSheet._onDragStart(ev);
    html.find(itemClass).each((i, li) => {
      if (li.classList.contains("items__list-item--header")) return;
      li.setAttribute("draggable", true);
      li.addEventListener("dragstart", handler, false);
    });
  }

  html.find('[data-action="quantity-update"]').change(ev => {
    const item = actorSheet.actor.items.get(
      $(ev.currentTarget).parents(`${itemClass}, ${itemCardClass}`).data('itemId')
    );

    const value = parseInt(ev.currentTarget.value),
          {min, value: old} = item.system.quantity; 

    if (old === value) return; // don't waste resources on non-changes
    
    item.update({
      ['system.quantity.value']: value >= min ? value : min
    });
  });

  return commonContextOptions;
}

export default commonActorSheetBehaviors;