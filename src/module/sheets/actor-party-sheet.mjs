/**
 * Extend the basic ActorSheet
 * @extends {ActorSheet}
 */
class ChromaticActorPartySheet extends ActorSheet {
  itemMenu = null;

  /** @override */
  static get defaultOptions() {
    const sheetClasses = ["chromatic-dungeons", "sheet", "sheet--actor", "sheet--party"];

    return mergeObject(super.defaultOptions, {
      classes: sheetClasses,
      template: `${CONFIG.CHROMATIC.templateDir}/actor/actor-party-sheet.hbs`,
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".tab-group__container", initial: "pcs" }]
    });
  }

  /** @override */
  get template() {
    return `${CONFIG.CHROMATIC.templateDir}/actor/actor-party-sheet.hbs`;
  }

  /** @override */
  async getData() {
    const context = super.getData();

    context.pcs = [];
    context.deadPCs = [];

    context.henchpeople = [];
    context.deadHenchpeople = [];

    context.hirelingActors = [];
    context.petActors = [];

    context.enrichedNotes = await TextEditor.enrichHTML(this.actor.system.notes, {
      secrets: game.user.isGM,
      rollData: context.rollData,
      async: true
    });

    this.actor.system.party.forEach(async (uuid) => {
      const pc = await fromUuid(uuid);
      if (pc.system.hp.value)
        context.pcs.push(pc);
      else
        context.deadPCs.push(pc);
    })

    this.actor.system.henchmen.forEach(async (uuid) => {
      const henchperson = await fromUuid(uuid);
      if (henchperson.system.hp.value)
        context.henchpeople.push(henchperson);
      else
        context.deadHenchpeople.push(henchperson);
    })

    this.actor.system.hirelings.forEach(async ({uuid, count}) => {
      const hireling = await fromUuid(uuid);
      hireling.count = count;
      context.hirelingActors.push(hireling);
    })

    this.actor.system.pets.forEach(async (uuid) => {
      const pet = await fromUuid(uuid);
      context.petActors.push(pet);
    })

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    const partySelector = `.card-group--party`;
    const partyItemSelector = `.card-group--party-items`;

    this.partyMenu = new ContextMenu(
      html.find(partySelector),
      '.card',
      [
        {
          name: 'View Sheet',
          icon: '<i class="fa fa-eye"></i>',
          callback: (node) => this.#viewActor(node)
        },
        {
          name: 'Remove',
          icon: '<i class="fa fa-trash"></i>',
          condition: this.actor.isOwner,
          callback: (node) => this.#removeActor(node)
        }
      ]
    );

    this.partyItemsMenu = new ContextMenu(
      html.find(partyItemSelector),
      '.card',
      [
        {
          name: 'View Sheet',
          icon: '<i class="fa fa-eye"></i>',
          callback: (node) => this.#viewItem(node)
        },
        {
          name: 'Remove',
          icon: '<i class="fa fa-trash"></i>',
          condition: this.actor.isOwner,
          callback: (node) => this.#removeItem(node)
        }
      ]
    );

    html.find(`${partySelector} [data-action="quantity-update"]`).change(ev => {
      const uuid = $(ev.currentTarget).parents('.card').data('id')
      const count = parseInt(ev.currentTarget.value);

      this.#updateHirelingCount(uuid, count);
    });

    // Drag events
    if (this.actor.isOwner) {
      let itemHandler = ev => this._onDragStart(ev);
      let actorHandler = ev => this.#onActorDragStart(ev);
      // html.find(`${partySelector} .card`).each((i, card) => {
      document.querySelectorAll(`${partySelector} .card`).forEach(card => {
        // if (li.classList.contains("items__list-item--header")) return;
        card.setAttribute("draggable", true);
        card.addEventListener("dragstart", actorHandler, false);
      });

      document.querySelectorAll(`${partyItemSelector} .card`).forEach(card => {
        // if (li.classList.contains("items__list-item--header")) return;
        card.setAttribute("draggable", true);
        card.addEventListener("dragstart", itemHandler, false);
      });
    }
  }

  /** @override */
  async #onActorDragStart(event) {
    let draggedActor, dragData;
    const id = event.currentTarget.closest('.card').dataset.id;

    if (id) {
      draggedActor = await fromUuid(id);
      dragData = draggedActor.toDragData();
    }

    if (draggedActor && dragData) {
      event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
      const img = event.currentTarget.closest('.card').querySelector("img");
      const pt = draggedActor.prototypeToken;
      const w = pt.width * canvas.dimensions.size * Math.abs(pt.texture.scaleX) * canvas.stage.scale.x;
      const h = pt.height * canvas.dimensions.size * Math.abs(pt.texture.scaleY) * canvas.stage.scale.y;
      const preview = DragDrop.createDragImage(img, w, h);
      event.dataTransfer.setDragImage(preview, w / 2, h / 2);
    }
  }

  #viewActor(node) {
    fromUuid(node.data('id')).then(
      ({sheet}) => sheet.render(true)
    );
  }

  #viewItem(node) {
    const {itemId: id} = node.closest('[data-item-id]').data();
    this.actor.items.get(id).sheet.render(true);
  }

  #removeActor(node) {
    const uuid = node.data('id');
    const category = node.parent('.card-group--party').data('subtype');

    switch(category) {
      case 'pcs':       this.#removePCFromParty(uuid);        break;
      case 'henchmen':  this.#removeHenchmanFromParty(uuid);  break;
      case 'hirelings': this.#removeHirelingFromParty(uuid);  break;
      case 'pets':      this.#removePetFromParty(uuid);       break;
    }
  }

  #removeItem(node) {
    const {itemId: id} = node.closest('[data-item-id]').data();
    this.actor.items.get(id).delete();
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
   * @overrides
   */
  async _onDropActor(ev, {uuid}) {
    if (!this.actor.isOwner) return;

    const actor = await fromUuid(uuid);
    
    // Parties can't join parties!
    if (actor.type === 'party')
      return false;
    
    // Delegate to PC-adding function
    if (actor.type === 'pc')
      this.#addPCToParty(uuid);
    
    // What kind of NPC are we adding?
    if (actor.type === 'npc') {
      const classStem = 'npc-group';
      const droppedOn = (subtype) =>
        ev.path.some(
          node => !!node.classList?.contains(`${classStem}--${subtype}`)
        );
        
      // Add to henchmen if there isn't already a henchman here
      if (droppedOn('henchmen'))
        this.#addHenchmanToParty(uuid);

      // Add to hirelings; increment if this hireling is already here
      if (droppedOn('hirelings'))
        this.#addHirelingToParty(uuid);

      // Add to pets; increment if this pet is already here
      if (droppedOn('pets'))
        this.#addPetToParty(uuid);
    }
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

  #addPCToParty(uuid) {
    const { party } = this.actor.system;

    // Is PC in party already?
    if (party.includes(uuid))
      return false;
    
    this.actor.update({
      'system.party': [...this.actor.system.party, uuid]
    })
  }
  #removePCFromParty(uuid) {
    const { party } = this.actor.system;

    // Is PC not in the party?
    if (!party.includes(uuid))
      return false;
    
    this.actor.update({
      'system.party': this.actor.system.party.filter(id => id !== uuid)
    })
  }

  #addHenchmanToParty(uuid) {
    const { henchmen } = this.actor.system;
    // Is henchperson in party already?
    if (henchmen.includes(uuid))
      return false;
    this.actor.update({
      'system.henchmen': [...this.actor.system.henchmen, uuid]
    })
  }
  #removeHenchmanFromParty(uuid) {
    const { henchmen } = this.actor.system;

    // Is henchperson not in the party?
    if (!henchmen.includes(uuid))
      return false;
    
    this.actor.update({
      'system.henchmen': this.actor.system.henchmen.filter(id => id !== uuid)
    })
  }

  #addHirelingToParty(uuid) {
    const { hirelings } = this.actor.system;

    // Do we already have hirelings with this UUID?
    const previousCount = hirelings.find(hireling => hireling.uuid === uuid)?.count || 0;

    const updatedHirelings = [
      ...hirelings.filter(hireling => hireling.uuid !== uuid),
      { uuid, count: previousCount + 1 }
    ];

    this.actor.update({
      'system.hirelings': updatedHirelings
    })
  }
  #removeHirelingFromParty(uuid) {
    const { hirelings } = this.actor.system;
    const hirelingUUIDs = hirelings.map(hireling => hireling.uuid)
    
    // Is hireling in the party?
    if (hirelingUUIDs.includes(uuid))
      this.actor.update({
        'system.hirelings': this.actor.system.hirelings.filter(hireling => hireling.uuid !== uuid)
      })
  }
  #updateHirelingCount(uuid, count) {
    if (count === 0) {
      this.#removeHirelingFromParty(uuid);
      return;
    }
    
    const { hirelings } = this.actor.system;

    // Do we already have hirelings with this UUID?
    const previousCount = hirelings.find(hireling => hireling.uuid === uuid)?.count || null;

    // We likely never had this hireling, let's create it
    if (previousCount === null) {
      this.#addHirelingToParty(uuid);
      return;
    }

    const updatedHirelings = [
      ...hirelings.filter(hireling => hireling.uuid !== uuid),
      { uuid, count }
    ];

    this.actor.update({
      'system.hirelings': updatedHirelings
    })
  }

  #addPetToParty(uuid) {
    const { pets } = this.actor.system;
    // Is henchperson in party already?
    if (pets.includes(uuid))
      return false;
    this.actor.update({
      'system.pets': [...this.actor.system.pets, uuid]
    })
  }
  #removePetFromParty(uuid) {
    const { pets } = this.actor.system;

    // Is hireling not in the party?
    if (!pets.includes(uuid))
      return false;
    
    this.actor.update({
      'system.pets': this.actor.system.pets.filter(id => id !== uuid)
    })
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

export default ChromaticActorPartySheet;


