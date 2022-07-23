import { getClassGroupAtLevel, getLevelFromXP, reportAndQuit, getWisBonusSlots } from '../helpers/utils.mjs';
import attackSequence from '../helpers/rollSequences/attackSequence.mjs';

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
class ChromaticItem extends Item {
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
      case 'class':
        this._prepareClassToHitData();
        this._prepareClassSpellData();
        break;
      case 'classgroup':
        this._prepareClassgroupHitdiceData();
        break;
    }
  }

  async _prepareClassToHitData() {
    const {classGroup, xp} = this.system;

    this.system.modToHit = getClassGroupAtLevel(
      classGroup,
      getLevelFromXP(xp)
    ).modToHit;
  }

  async _prepareClassSpellData() {
    if (!this.system.hasSpellcasting) return;

    let characterSpells;
    
    try {
      characterSpells = this.parent?.items.filter(item => item.type === 'spell');
    } catch (e) {
      characterSpells = [];
    }
      
    this.system.preparedSpellSlots =
      Object.keys(this.system.preparedSpells)
        .map(level => this.system.preparedSpells[level]
          .map(id => characterSpells
            .find(item => item.id === id)));
  }

  async _prepareClassgroupHitdiceData() {
    const {
      lastLevelForHitDice,
      hitDieModAfterHitDiceMax,
      lastLevelForConMod
    } = this.system;
    const getHitDieMod = (level) => {
      if (level <= lastLevelForHitDice) return 0;

      return (level - lastLevelForHitDice) * hitDieModAfterHitDiceMax;
    }
    const getHitDieCount = (level) => level < lastLevelForHitDice ? level : lastLevelForHitDice;
    const canAddFullConModToHP = (level) => level <= lastLevelForConMod; 

    let levels = Object.keys(this.system.levels).map(levelKey => ({
      ...this.system.levels[levelKey],
      hitDieCount: getHitDieCount(parseInt(levelKey)),
      hitDieMod: getHitDieMod(parseInt(levelKey)),
      addsFullConModToHP: canAddFullConModToHP(parseInt(levelKey)),
    }));

    levels.unshift('');
    levels = {...levels};
    delete levels[0];

    this.system.levels = levels;
  }

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

  prepareSpell(spell, level) {
    const slotsAtLevel = this.system.spellSlots[getLevelFromXP(this.system.xp)];

    const maxSlotsAtLevel = (!this.system.hasWisdomBonusSlots)
      ? slotsAtLevel[level]
      : getWisBonusSlots(
          slotsAtLevel,
          this.system.hasWisdomBonusSlots,
          this.parent.system.attributes.wis
        )[level];

    const preparedSpellsAtLevel = [...this.system.preparedSpells[level]];

    if (preparedSpellsAtLevel.length >= maxSlotsAtLevel) {
      ui.notifications.warn(`You've already prepared as many level ${level} ${this.name} spells as you can!`)
      return false;
    }

    this.update({
      ['data.preparedSpells']: {
        [level]: [...preparedSpellsAtLevel, spell.id]
      }
    });
  }

  castSpell(spellId, spellLevel) {
    try {
      if (this.system.hasSpellPoints) {
        /**
         * @todo Empowered Casting dialog
         */

        const spellToCast = this.parent.items.get(spellId);
        const cost = CONFIG.CHROMATIC.spellPointCosts[spellLevel];

        if (parseInt(this.system.currentSpellPoints) >= cost)
          spellToCast.roll().then(() => {
            this.update({
              ['data.currentSpellPoints']: parseInt(this.system.currentSpellPoints) - cost
            });
          })
        else
          reportAndQuit(`You don't have enough spell points to cast ${spellToCast.name}!`)

      } else {
        return this.system
          .preparedSpellSlots[parseInt(spellLevel) - 1]
          .find(spell => spell.id === spellId)          
          .roll()
          .then(() => this.clearSpell(spellId, spellLevel));
      }
    } catch (e) {
      ui.notifications.warn('You can\'t cast a spell from an empty slot!');
    }
  }

  clearSpell(spellId, spellLevel) {
    const spellToPrune = this.system.preparedSpells[spellLevel]
          .findIndex(spell => spell.indexOf(spellId) >= 0)

    const copiedSpellsAtLevel = [...this.system.preparedSpells[spellLevel]];

    copiedSpellsAtLevel.splice(spellToPrune, 1);

    return this.update({
      [`data.preparedSpells.${spellLevel}`]: copiedSpellsAtLevel
    });
  }

  hasSpellAsPrepared(spellId, spellLevel) {
    return this.system.preparedSpells[spellLevel]
      .some(spell => spell.indexOf(spellId) >= 0)
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll({showWeapon} = {}) {
    switch (this.type) {
      case 'weapon':
        showWeapon
          ? this._defaultRoll()
          : this._generateWeaponDialog()?.render(true);
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

  _generateWeaponDialog() {
    const actor = this.parent;

    let buttons = {};

    const isItemAmmoAndAboveZeroQty = (ammo) => {
      if (ammo.type !== 'weapon') return false;

      return  ammo.system.quantity.value > 0 &&
              ammo.system.weaponType === 'ammunition' &&
              ammo.system.ammunitionType === this.system.ammunitionType;
    }

    const actorAmmunitionForWeapon = actor.items.filter(isItemAmmoAndAboveZeroQty);

    const weaponIsVersatile = this.system.versatile;

    const actorHasHandFree = actor.items.filter(i => {
      if (!i.system.equipped)
        return false;
      if (i.type === 'armor' && i.system.armorType === 'shield')
        return true;
      return (i.type === 'weapon')
    }).length === 1;

    switch (this.system.weaponType) {
      case "melee":
        buttons.attack = {
          label: 'Attack',
          callback: (html) => this._weaponRoll(html)
        };
        break;
      case "ranged":
        if (!actorAmmunitionForWeapon.length && this.system.ammunitionType !== 'infinite') {
          return {
            render: () => ui.notifications.warn(`You are out of ammunition for your ${this.name}!`)
          };
        }
        buttons.attack = {
          label: 'Fire',
          callback: (html) => {
            const ammoToUse = (this.system.ammunitionType !== 'infinite')
              ? actor.items.get(html.find('[name="ammunition-item"]').val())
              : null;
            let args = [html];
            if (ammoToUse)
              args = [
                ...args,
                ammoToUse,
                ['arrow', 'sling']
                  .includes(ammoToUse.system.ammunitionType)
              ];

            this._weaponRoll(...args);
          }
        };
        break;
      case "thrown":
        if (this.system.quantity.value <= 0) {
          return {
            render: () => ui.notifications.warn(`${actor.name} has already thrown their last ${this.name}!`)
          };
        }
        buttons.attack = {
          label: 'Attack',
          callback: (html) => this._weaponRoll(html)
        };
        buttons.throw = {
          label: 'Throw',
          callback: (html) => this._weaponRoll(html, this)
        };
    }
    
    buttons.cancel = {
      label: 'Cancel'
    }

    return new Dialog({
      title: `Attacking with ${actor.name}'s ${this.name}`,
      content: `
        <div class="roll-modifiers-field roll-modifiers-field--attack">
          <label for="attack-roll-modifier">Attack Modifier:</label>
          <input name="attack-roll-modifier" placeholder="-2, 4, etc"  />
        </div>

        <div class="roll-modifiers-field roll-modifiers-field--damage">
          <label for="damage-roll-modifier">Damage Modifier:</label>
          <input name="damage-roll-modifier" placeholder="-2, 4, etc"  />
        </div>

        ${weaponIsVersatile && actorHasHandFree ? (`
          <div class="roll-modifiers-field roll-modifiers-field--is-versatile">
            <label for="is-versatile">Use both hands?</label>
            <input name="is-versatile" type="checkbox" />
          </div>
        `) : ''}

        ${(
          this.system.ammunitionType !== 'infinite' &&
          actorAmmunitionForWeapon.length
        ) ? (`
        <div class="roll-modifiers-field roll-modifiers-field--ammunition">
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

  async _weaponRoll(html, ammoItem, useAmmoDamage) {
    const circumstantialAttackMod = parseInt(html.find('[name="attack-roll-modifier"]').val() || 0);
    const circumstantialDamageMod = parseInt(html.find('[name="damage-roll-modifier"]').val() || 0);
    const isVersatile = !!html.find('[name="is-versatile"]:checked').length;

    const actor = this.parent;
    const rollData = this.getRollData();

    let toHitMod = this.system.modToHit + actor.system.toHitMods[this.system.weaponType],
        damageMod = this.system.modDamage + actor.system.damageMods[this.system.weaponType];

    if (isVersatile) damageMod += 1;

    let attackRoll = new Roll(`1d20+@toHitMods.${this.system.weaponType}+${circumstantialAttackMod}`, rollData);
    let damageRoll = new Roll(
      `${
        (useAmmoDamage ? ammoItem : this).system.damage
      }+${
        damageMod
      }+${
        circumstantialDamageMod
      }`,
      rollData
    );
    
    attackRoll = await attackRoll.roll({ async: true });
    damageRoll = await damageRoll.roll({ async: true });

    const spendAmmo = async () => {
      if (ammoItem)
        await actor.items.get(ammoItem._id).update({
          ['system.quantity.value']: ammoItem.system.quantity.value - 1
        });
      if (this.system.weaponType === 'thrown' && this.system.quantity.value <= 0)
        this.update({
          ['system.equipped']: false
        });
    }

    return attackSequence(
      actor,
      attackRoll,
      damageRoll,
      this.name,
      { beforeAttack: spendAmmo },
      this._getRollMessageOptions
    );
  }

  _defaultRoll() {
    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      return ChatMessage.create({
        ...this._getRollMessageOptions(),
        flavor: `[${this.type}] ${this.name}`,
        content: this.system.description ?? ''
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

export default ChromaticItem;
