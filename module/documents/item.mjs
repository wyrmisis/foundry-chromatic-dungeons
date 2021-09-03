import { getDerivedStat } from '../helpers/utils.mjs';

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class BoilerplateItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
   getRollData() {
    // If present, return the actor's roll data.
    if ( !this.actor ) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.data.data);

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this.data;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    console.info(item.type, item.data);

    if (item.type === 'weapon')
      this._weaponRoll();

    // If there's no roll data, send a chat message.
    if (!this.data.data.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.data.description ?? ''
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.item.formula, rollData).roll();
      roll.CHAT_TEMPLATE = `${CONFIG.CHROMATIC.templateDir}/item/rolls/weapon-roll.hbs`;
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }

  _weaponRoll() {
    const { data: item } = this.data.document;
    const { data: actor } = this.data.document.actor;

    let toHitMod = 0, damageMod = 0;

    // console.info(actor, item);

    if (item.data.weaponType === 'ranged') {
      toHitMod += getDerivedStat('dex', actor.data.attributes.dex, 'modAgility');
    } else {
      toHitMod += getDerivedStat('str', actor.data.attributes.str, 'modToHit');
      damageMod += getDerivedStat('str', actor.data.attributes.str, 'modMeleeDamage');
    }

    toHitMod += item.data.modToHit;
    damageMod += item.data.modDamage;

    console.info(toHitMod, damageMod);
  }
}
