import attackSequence from '../helpers/rollSequences/attackSequence.mjs';
import weaponDialog from '../dialogs/attack.mjs';
import { withOrdinalSuffix } from '../helpers/utils.mjs';

/**
 * A data object reflecting the speaker for a chat message from `ChromaticItem.roll()`.
 * @typedef RollMessageOptions
 * @property {Object} speaker The user or actor represented in the chat card
 * @property {String} rollMode The roll mode to use, from CONST.DICE_ROLL_MODES
 */

/**
 * The options for ChromaticItem.roll()
 * @typedef RollOptions
 * @property {Boolean} isDescribing Should the roll output facts about the item or use the item?
 */

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
class ChromaticItem extends Item {

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    // If present, return the actor's roll data.
    if ( !this.actor ) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.system);

    return rollData;
  }

  /**
   * The roll handler for this item, which delegates based on item type.
   * @param {RollOptions} rollOptions The options for this roll
   */
  async roll({isDescribing} = {}) {
    switch (this.type) {
      case 'weapon':
        isDescribing
          ? this.#defaultRoll()
          : weaponDialog(this.parent, this, this.#weaponRoll.bind(this))?.render(true);
        break;
      case 'spell': this.#spellRoll(isDescribing);  break;
      case 'class': this.#classRoll();              break;
      case 'armor': this.#armorRoll();              break;
      default:      this.#defaultRoll();            break;
    }
  }

  /**
   * Prepare the data object for a chat message from `this.roll()`.
   * 
   * @param {Actor} actor The speaking actor for this item's roll
   * @returns {RollMessageOptions} A compiled set of rollmode options
   * @private
   */
  #getRollMessageOptions(actor) {
    const speaker = ChatMessage.getSpeaker({ actor: actor || this.actor });
    const rollMode = game.settings.get('core', 'rollMode');

    return { speaker, rollMode };
  }

  /**
   * 
   * @param {*} param0 
   * @returns
   * @private
   * @async
   */
  async #weaponRoll({
      circumstantialAttackMod,
      circumstantialDamageMod,
      isVersatile,
      ammoItem,
      useAmmoDamage
    } = {}
  ) {
    const actor = this.parent;
    const rollData = this.getRollData();
    const {weaponType} = this.system;

    let toHitMod = actor.system.toHitMods[weaponType] + this.system.modToHit + circumstantialAttackMod,
        damageMod = actor.system.damageMods[weaponType] + this.system.modDamage + circumstantialDamageMod,
        baseDamage = (useAmmoDamage ? ammoItem : this).system.damage;

    if (isVersatile) damageMod += 1;

    let attackRoll = new Roll(`1d20+${toHitMod}`, rollData);
    let damageRoll = new Roll(`${baseDamage}+${damageMod}`, rollData);
    
    attackRoll = await attackRoll.roll({ async: true });
    damageRoll = await damageRoll.roll({ async: true });

    const spendAmmo = async () => {
      if (ammoItem)
        await actor.items.get(ammoItem._id).update({
          ['system.quantity.value']: ammoItem.system.quantity.value - 1
        });
      if (weaponType === 'thrown' && this.system.quantity.value <= 0)
        this.update({ ['system.equipped']: false });
    }

    return attackSequence(
      actor,
      attackRoll,
      damageRoll,
      this.name,
      { beforeAttack: spendAmmo },
      this.#getRollMessageOptions
    );
  }

  #armorRoll() {
    return ChatMessage.create({
      ...this.#getRollMessageOptions(),
      flavor: `Showing off their ${this.name}`,
      content: this.system.description ?? '',
      flags: this.#prepareFlags({
        ac: this.system.ac,
        description: this.system.description,
        type: this.system.armorType
      })
    });
  }

  #classRoll() {
    return ChatMessage.create({
      ...this.#getRollMessageOptions(),
      flavor: `Level ${this.system.level} ${this.name}`,
      content: this.system.description ?? '',
      flags: this.#prepareFlags({
        xp: this.system.xp,
        previous: this.system.xpToPrevLevel,
        next: this.system.xpToNextLevel
      })
    });
  }

  /**
   * Render a spell to chat
   * 
   * @param {Boolean} isDescribing Is this roll showing the item to chat or using it?
   * @returns 
   */
  #spellRoll(isDescribing) {
    return ChatMessage.create({
      ...this.#getRollMessageOptions(),
      flavor: `${!isDescribing ? 'Casting' : 'Describing'} ${this.name} (${withOrdinalSuffix(parseInt(this.system.level))} level ${this.system.school})`,
      content: this.system.description ?? '',
      flags: this.#prepareFlags({
        range: this.system.range,
        duration: this.system.duration,
        areaOfEffect: this.system.areaOfEffect,
        castingTime: this.system.castingTime,
        hasVerbalComponent: this.system.hasVerbalComponent,
        hasMaterialComponent: this.system.hasMaterialComponent,
        hasSomaticComponent: this.system.hasSomaticComponent
      })
    });
  }

  /**
   * 
   * @returns 
   * @private
   */
  #defaultRoll(flags = null) {
    return ChatMessage.create({
      ...this.#getRollMessageOptions(),
      flavor: `[${this.type}] ${this.name}`,
      content: this.system.description ?? '',
      flags: flags && this.#prepareFlags(flags)
    });
  }

  /**
   * @param {Object} flags The flags to prepare for a ChatMessage
   * @returns {Object} The prepared flags
   */
  #prepareFlags (flags) {
    return {
      'foundry-chromatic-dungeons': {
        img: this.img,
        ...flags,
        rollType: this.type
      }
    };
  }

  /**
   * ======== NECESSARY CLASS METHODS ========
   * 
   * -------- Generic --------
   * * Get Roll Data
   * 
   * * Item Rolls - per-type chat output
   * 
   * 
   * -------- Class --------
   * * Cast Spell (could be a roll, separate templates for cast/show)
   */
}

export default ChromaticItem;
