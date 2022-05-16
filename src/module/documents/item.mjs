import { getClassGroupAtLevel, getLevelFromXP, reportAndQuit, getWisBonusSlots } from '../helpers/utils.mjs';
import attackSequence from '../helpers/rollSequences/attackSequence.mjs';

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
    const {classGroup, xp} = this.data.data;

    this.data.data.modToHit = getClassGroupAtLevel(
      classGroup,
      getLevelFromXP(xp)
    ).modToHit;
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

  async _prepareClassgroupHitdiceData() {
    const {
      lastLevelForHitDice,
      hitDieModAfterHitDiceMax,
      lastLevelForConMod
    } = this.data.data;
    const getHitDieMod = (level) => {
      if (level <= lastLevelForHitDice) return 0;

      return (level - lastLevelForHitDice) * hitDieModAfterHitDiceMax;
    }
    const getHitDieCount = (level) => level < lastLevelForHitDice ? level : lastLevelForHitDice;
    const canAddFullConModToHP = (level) => level <= lastLevelForConMod; 

    let levels = Object.keys(this.data.data.levels).map(levelKey => ({
      ...this.data.data.levels[levelKey],
      hitDieCount: getHitDieCount(parseInt(levelKey)),
      hitDieMod: getHitDieMod(parseInt(levelKey)),
      addsFullConModToHP: canAddFullConModToHP(parseInt(levelKey)),
    }));

    levels.unshift('');
    levels = {...levels};
    delete levels[0];

    this.data.data.levels = levels;
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
    const slotsAtLevel = this.data.data.spellSlots[getLevelFromXP(this.data.data.xp)];

    const maxSlotsAtLevel = (!this.data.data.hasWisdomBonusSlots)
      ? slotsAtLevel[level]
      : getWisBonusSlots(
          slotsAtLevel,
          this.data.data.hasWisdomBonusSlots,
          this.parent.data.data.attributes.wis
        )[level];

    const preparedSpellsAtLevel = [...this.data.data.preparedSpells[level]];

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
      if (this.data.data.hasSpellPoints) {
        /**
         * @todo Empowered Casting dialog
         */

        const spellToCast = this.parent.items.get(spellId);
        const cost = CONFIG.CHROMATIC.spellPointCosts[spellLevel];

        if (parseInt(this.data.data.currentSpellPoints) >= cost)
          spellToCast.roll().then(() => {
            this.update({
              ['data.currentSpellPoints']: parseInt(this.data.data.currentSpellPoints) - cost
            });
          })
        else
          reportAndQuit(`You don't have enough spell points to cast ${spellToCast.name}!`)

      } else {
        return this.data.data
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
    const spellToPrune = this.data.data.preparedSpells[spellLevel]
          .findIndex(spell => spell.indexOf(spellId) >= 0)

    const copiedSpellsAtLevel = [...this.data.data.preparedSpells[spellLevel]];

    copiedSpellsAtLevel.splice(spellToPrune, 1);

    return this.update({
      [`data.preparedSpells.${spellLevel}`]: copiedSpellsAtLevel
    });
  }

  hasSpellAsPrepared(spellId, spellLevel) {
    return this.data.data.preparedSpells[spellLevel]
      .some(spell => spell.indexOf(spellId) >= 0)
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

    const weaponIsVersatile = item.data.versatile;

    const actorHasHandFree = actor.items.filter(i => {
      if (!i.data.data.equipped)
        return false;
      if (i.type === 'armor' && i.data.data.armorType === 'shield')
        return true;
      return (i.type === 'weapon')
    }).length === 1;

    switch (item.data.weaponType) {
      case "melee":
        buttons.attack = {
          label: 'Attack',
          callback: (html) => this._weaponRoll(html)
        };
        break;
      case "ranged":
        if (!actorAmmunitionForWeapon.length && item.data.ammunitionType !== 'infinite') {
          return {
            render: () => ui.notifications.warn(`You are out of ammunition for your ${item.name}!`)
          };
        }
        buttons.attack = {
          label: 'Fire',
          callback: (html) => {
            const ammoToUse = (item.data.ammunitionType !== 'infinite')
              ? actor.items.get(html.find('[name="ammunition-item"]').val()).data
              : null;
            let args = [html];
            if (ammoToUse)
              args = [
                ...args,
                ammoToUse,
                ['arrow', 'sling']
                  .includes(ammoToUse.data.ammunitionType)
              ];

            this._weaponRoll(...args);
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
          item.data.ammunitionType !== 'infinite' &&
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

    const [item, actor] = this._getItemActorData();
    const rollData = this.getRollData();

    let toHitMod = item.data.modToHit + actor.data.toHitMods[item.data.weaponType],
        damageMod = item.data.modDamage + actor.data.damageMods[item.data.weaponType];

    if (isVersatile) damageMod += 1;

    let attackRoll = new Roll(`1d20+${toHitMod}+${circumstantialAttackMod}`, rollData);
    let damageRoll = new Roll(
      `${
        (useAmmoDamage ? ammoItem : item).data.damage
      }+${
        damageMod
      }+${
        circumstantialDamageMod
      }`,
      rollData
    );
    
    attackRoll = await attackRoll.roll();
    damageRoll = await damageRoll.roll();

    const spendAmmo = () => {
      if (
        ammoItem
      ) actor.items.get(ammoItem._id).update({
        ['data.quantity.value']: ammoItem.data.quantity.value - 1
      });
    }

    return attackSequence(
      actor,
      attackRoll,
      damageRoll,
      item.name,
      { beforeAttack: spendAmmo },
      this._getRollMessageOptions
    );
  }

  _defaultRoll() {
    const [item, actor] = this._getItemActorData();

    // If there's no roll data, send a chat message.
    if (!this.data.data.formula) {
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

  createEmbeddedDocuments(docname, droppedItems) {
    console.info(docname, droppedItems);
  }
}
