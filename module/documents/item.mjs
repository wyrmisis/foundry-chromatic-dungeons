import { getSelf, getFirstTargetOfSelf } from '../helpers/utils.mjs';

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
    // const item = this.data;
    const { data: item } = this.data.document;
    const { data: actor } = this.data.document.actor;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    console.info(item.type, item.data);

    switch (item.type) {
      case 'weapon':
        this._generateWeaponDialog().render(true);
        break;
      default:
        this._defaultRoll();
        break;
    }

    // If there's no roll data, send a chat message.
    // if (!this.data.data.formula) {
    //   ChatMessage.create({
    //     speaker: speaker,
    //     rollMode: rollMode,
    //     flavor: label,
    //     content: item.data.description ?? ''
    //   });
    // }
    // // Otherwise, create a roll and send a chat message from it.
    // else {
    //   // Retrieve roll data.
    //   const rollData = this.getRollData();

    //   // Invoke the roll and submit it to chat.
    //   const roll = new Roll(rollData.item.formula, rollData).roll();
    //   roll.CHAT_TEMPLATE = `${CONFIG.CHROMATIC.templateDir}/item/rolls/weapon-roll.hbs`;
    //   roll.toMessage({
    //     speaker: speaker,
    //     rollMode: rollMode,
    //     flavor: label,
    //   });
    //   return roll;
    // }
  }

  _getRollMessageOptions() {
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');

    return { speaker, rollMode };
  }

  _getItemActorData() {
    const { data: item } = this.data.document;
    const { data: actor } = this.data.document.actor;

    return [item, actor];
  }

  _generateWeaponDialog() {
    const [item, actor] = this._getItemActorData();

    return new Dialog({
      title: `Attacking with ${actor.name}'s ${item.name}`,
      buttons: {
        attack: {
          label: 'Roll Attack',
          callback: () => this._weaponRoll()
        },
        cancel: {
          label: 'Cancel'
        }
      },
      default: 'success'
    });
  }

  _weaponRoll() {
    const [item, actor] = this._getItemActorData();
    const rollData = this.getRollData();

    let toHitMod = item.data.modToHit + actor.data.toHitMods[item.data.weaponType],
      damageMod = item.data.modDamage + actor.data.damageMods[item.data.weaponType];

    const target = getFirstTargetOfSelf();

    const attackRoll = new Roll(`1d20+${toHitMod}`, rollData).roll();
    const damageRoll = new Roll(`${item.data.damage}+${damageMod}`, rollData).roll();

    console.info(getSelf());

    // EMOTE: 3
    // IC: 2
    // OOC: 1
    // OTHER: 0
    // ROLL: 5


    return attackRoll
      .toMessage({
        ...this._getRollMessageOptions(),
        type: CONST.CHAT_MESSAGE_TYPES.IC,
        flavor: `Attacking with ${item.name}...`,
      })
      .then(result => {
        // @TODO automate ammo usage?

        if (target && attackRoll.total < target.data.data.ac) {
          ChatMessage.create({
            ...this._getRollMessageOptions(),
            content: `${actor.name}'s attack <strong>misses</strong>!`
          });

          return Promise.reject();
        }

        return damageRoll
          .toMessage({
            ...this._getRollMessageOptions(),
            flavor: `Damage with ${item.name}`,
          });
      })
      .then(damageResult => (!damageResult || !target)
          ? null
          : target.update({
            ['data.hp.value']: target.data.data.hp.value - damageRoll.total
          })
      )
      .then(updatedTarget => {
        if (updatedTarget && updatedTarget.data.data.hp.value <= 0) 
          return ChatMessage.create({
            ...this._getRollMessageOptions(),
            content: `${updatedTarget.name} collapses in a heap from their injuries!`
          });
      });
  }

  _defaultRoll() {

  }
}
