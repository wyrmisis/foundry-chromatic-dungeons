/**
 * Execute a sequence of chat messages for save actions.
 * @param {*} actor 
 * @param {*} save 
 * @param {*} roll 
 * @param {*} target 
 * @param {*} triggers 
 */
const saveSequence = async (actor, save, roll, target, triggers = {}) => {
  const has3dDice = !!game.dice3d;
  
  if (!actor) throw new Error('A save sequence is missing its actor!');
  if (!save) throw new Error('A save sequence is missing its save type!');
  if (!roll) throw new Error('A save sequence is missing its roll!');
  if (!target) throw new Error('A save sequence is missing its target number!');

  /**
   * Dice So Nice! integration
   * For the pals :)
   */
  if (has3dDice)
    await game.dice3d.showForRoll(roll, game.user, true);

  await ChatMessage.create(
    getSaveMessage(actor, save, roll, target)
  );
};

const getSaveMessage = (actor, save, roll, target) => ({
  ...rollMessageOptions(actor),
  flavor: `Save: ${save} (target: >= ${target})`,
  flags: {
    'foundry-chromatic-dungeons': {
      rollType: 'save',
      critical: {
        success: roll.dice[0].total === 20,
        failure: roll.dice[0].total === 1
      },
      success: roll.total >= target,
      roll,
      tooltip: roll.dice.map(d => d.getTooltipData())
    }  
  }
})

const rollMessageOptions = (actor) => {
  const speaker = ChatMessage.getSpeaker({ actor });
  const rollMode = game.settings.get('core', 'rollMode');

  return ChatMessage.applyRollMode({speaker}, rollMode);
}

export default saveSequence;