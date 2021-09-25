import { getSelf, getFirstTargetOfSelf, getLevelFromXP } from '../helpers/utils.mjs';

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

  prepareDerivedData() {
    switch (this.type) {
      case 'class': this._prepareClassSpellData(); break;
    }
  }

  async _prepareClassSpellData() {
    if (!this.data.data.hasSpellcasting) return;

    let characterSpells;
    
    try {
      characterSpells = this.parent?.items.filter(item => item.type === 'spell');
    } catch (e) {
      characterSpells = [];
    }
      
    this.data.data.preparedSpellSlots =
      Object.keys(this.data.data.preparedSpells)
        .map(level => this.data.data.preparedSpells[level]
          .map(id => characterSpells
            .find(item => item.id === id)));
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

  prepareSpell(spell, level) {
    const maxSlotsAtLevel = this.data.data.spellSlots[getLevelFromXP(this.data.data.xp)][level];
    const preparedSpellsAtLevel = [...this.data.data.preparedSpells[level]];
    
    console.info(spell)

    if (preparedSpellsAtLevel.length >= maxSlotsAtLevel) {
      ui.notifications.warn(`You've already prepared as many level ${level} ${this.name} spells as you can!`)
      return false;
    }


    preparedSpellsAtLevel.push(spell.id);

    this.update({
      [`data.preparedSpells.${level}`]: preparedSpellsAtLevel
    });
  }

  castSpell(spellId, spellLevel) {
    try {
      const spellToCast = this.data.data.preparedSpellSlots[parseInt(spellLevel) - 1]
        .find(spell => spell.id === spellId);

      const spellToPrune = this.data.data.preparedSpells[spellLevel]
        .findIndex(spell => spell.indexOf(spellId) >= 0)

      const copiedSpellsAtLevel = [...this.data.data.preparedSpells[spellLevel]];

      copiedSpellsAtLevel.splice(spellToPrune, 1);

      spellToCast.roll().then(() => this.update({
        [`data.preparedSpells.${spellLevel}`]: copiedSpellsAtLevel
      }));
    } catch (e) {
      ui.notifications.warn('You can\'t cast a spell from an empty slot!');
    }
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    // const item = this.data;
    const { data: item } = this.data.document;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    switch (item.type) {
      case 'weapon':
        this._generateWeaponDialog()?.render(true);
        break;
      default:
        this._defaultRoll();
        break;
    }
  }

  _getRollMessageOptions(actor) {
    const speaker = ChatMessage.getSpeaker({ actor: actor || this.actor });
    const rollMode = game.settings.get('core', 'rollMode');

    return { speaker, rollMode };
  }

  _getItemActorData() {
    const { data: item } = this.data.document;
    const actor = this.data.document?.actor?.data || this.actor?.data;

    return [item, actor];
  }

  _generateWeaponDialog() {
    const [item, actor] = this._getItemActorData();

    let buttons = {};

    const isItemAmmoAndAboveZeroQty = (ammo) => {
      if (ammo.type !== 'weapon') return false;

      return  ammo.data.data.quantity.value > 0 &&
              ammo.data.data.weaponType === 'ammunition' &&
              ammo.data.data.ammunitionType === item.data.ammunitionType;
    }

    const actorAmmunitionForWeapon = actor.items.filter(isItemAmmoAndAboveZeroQty);

    switch (item.data.weaponType) {
      case "melee":
        buttons.attack = {
          label: 'Attack',
          callback: (html) => this._weaponRoll(html)
        };
        break;
      case "ranged":
        if (!actorAmmunitionForWeapon.length) {
          return {
            render: () => ui.notifications.warn(`You are out of ammunition for your ${item.name}!`)
          };
        }
        buttons.attack = {
          label: 'Fire',
          callback: (html) => {
            const ammoToUse = actor.items.get(html.find('[name="ammunition-item"]').val()).data;
            this._weaponRoll(
              html,
              ammoToUse,
              ['arrow', 'sling']
                .includes(ammoToUse.data.ammunitionType)
            );
          }
        };
        break;
      case "thrown":
        buttons.attack = {
          label: 'Attack',
          callback: (html) => this._weaponRoll(html)
        };
        buttons.throw = {
          label: 'Throw',
          callback: (html) => this._weaponRoll(html, item)
        };
    }
    
    buttons.cancel = {
      label: 'Cancel'
    }

    return new Dialog({
      title: `Attacking with ${actor.name}'s ${item.name}`,
      content: `
        <div>
          <label for="attack-roll-modifier">Attack Modifier:</label>
          <input name="attack-roll-modifier" placeholder="-2, 4, etc"  />
        </div>

        <div>
          <label for="damage-roll-modifier">Damage Modifier:</label>
          <input name="damage-roll-modifier" placeholder="-2, 4, etc"  />
        </div>

        ${actorAmmunitionForWeapon.length ? (`
        <div>
          <label for="ammunition-item">Ammunition to use:</label>
          <select name="ammunition-item">
            ${actorAmmunitionForWeapon.reduce((optionStr, ammo) => 
              optionStr + `<option value=${ammo.id}>${ammo.name}</option>`, ''
            )}
          </select>
        </div>
        `) : ''}
      `,
      buttons,
      default: 'attack'
    });
  }

  _weaponRoll(html, ammoItem, useAmmoDamage) {
    const circumstantialAttackMod = parseInt(html.find('[name="attack-roll-modifier"]').val() || 0);
    const circumstantialDamageMod = parseInt(html.find('[name="damage-roll-modifier"]').val() || 0);

    const [item, actor] = this._getItemActorData();
    const rollData = this.getRollData();

    let toHitMod = item.data.modToHit + actor.data.toHitMods[item.data.weaponType],
      damageMod = item.data.modDamage + actor.data.damageMods[item.data.weaponType];

    const target = getFirstTargetOfSelf();

    const attackRoll = new Roll(`1d20+${toHitMod}+${circumstantialAttackMod}`, rollData).roll();
    const damageRoll = new Roll(`${(useAmmoDamage ? ammoItem : item).data.damage}+${damageMod}+${circumstantialDamageMod}`, rollData).roll();

    // EMOTE: 3
    // IC: 2
    // OOC: 1
    // OTHER: 0
    // ROLL: 5


    return attackRoll
      .toMessage({
        ...this._getRollMessageOptions(),
        flavor: `Attacking with ${item.name}...`,
      })
      .then(result => {
        // @TODO automate ammo usage?
        console.info(ammoItem);
        if (ammoItem) actor.items.get(ammoItem._id).update({
          ['data.quantity.value']: ammoItem.data.quantity.value - 1
        });

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
      .then(damageResult => (!damageResult || !target || damageRoll.total <= 0)
          ? null
          : target.update({
            ['data.hp.value']: target.data.data.hp.value - damageRoll.total
          })
      )
      .then(updatedTarget => {
        if (updatedTarget && updatedTarget.data.data.hp.value <= 0) 
          return ChatMessage.create({
            ...this._getRollMessageOptions(updatedTarget),
            type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
            content: `${updatedTarget.name} collapses in a heap from their injuries!`
          });
      });
  }

  _defaultRoll() {
    const [item, actor] = this._getItemActorData();

    console.info(item, actor);

    // If there's no roll data, send a chat message.
    if (!this.data.data.formula) {
      console.info(item);
      return ChatMessage.create({
        ...this._getRollMessageOptions(),
        flavor: `[${item.type}] ${item.name}`,
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
        ...this._getRollMessageOptions(),
      });
      return roll;
    }
  }
}
