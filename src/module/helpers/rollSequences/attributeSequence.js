/**
 * Execute a sequence of chat messages for save actions.
 * @param {*} actor 
 * @param {*} save 
 * @param {*} roll 
 * @param {*} target 
 * @param {*} triggers 
 */
const attributeSequence = async (actor, attribute, roll, target, triggers = {}) => {
  const has3dDice = !!game.dice3d;

  if (!actor) throw new Error('An attribute sequence is missing its actor!');
  if (!attribute) throw new Error('An attribute sequence is missing its save type!');
  if (!roll) throw new Error('An attribute sequence is missing its roll!');
  if (!target) throw new Error('An attribute sequence is missing its target number!');

  /**
   * Dice So Nice! integration
   * For the pals :)
   */
  if (has3dDice)
    await game.dice3d.showForRoll(roll, game.user, true);

  await ChatMessage.create(
    getAttributeMessage(actor, attribute, roll, target)
  );
};

const getAttributeMessage = (actor, attribute, roll, target) => ({
  ...rollMessageOptions(actor),
  flavor: `Attribute: ${attribute} (target: <= ${target})`,
  flags: {
    'foundry-chromatic-dungeons': {
      rollType: 'attribute',
      critical: {
        success: roll.dice[0].total === 1,
        failure: roll.dice[0].total === 20
      },
      roll,
      success: roll.total <= target,
      tooltip: roll.dice.map(d => d.getTooltipData())
    }  
  }
});

const rollMessageOptions = (actor) => {
  const speaker = ChatMessage.getSpeaker({ actor });
  const rollMode = game.settings.get('core', 'rollMode');

  return ChatMessage.applyRollMode({speaker}, rollMode);
}

export default attributeSequence;