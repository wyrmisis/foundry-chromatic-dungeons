const rollModal = (name, label, rollType, callback) => {
  let rollLabel = label
    ? `${rollType ? `[${rollType}] ` : ''}${label}`
    : '';

  let buttons = {
    roll: {
      label: 'Roll',
      callback: (html) => {
        callback(
          parseInt(html.find('[name="modifier"]').val() || 0)
        );
      }
    },
    cancel: {
      label: 'Cancel'
    }
  };

  return new Dialog({
    title: `${name} is rolling: ${rollLabel}`,
    content: `
      <div class="roll-modifiers-field">
        <label for="modifier">Modifier:</label>
        <input name="modifier" placeholder="-2, 4, etc"  />
      </div>
    `,
    buttons,
    default: 'roll'
  });
}

export default rollModal;