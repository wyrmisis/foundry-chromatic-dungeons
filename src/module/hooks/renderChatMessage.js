const formatAttributeRoll = async (message, html) => {
  const
    {
      formula,
      total
    }        = message.getFlag('foundry-chromatic-dungeons', 'roll'),
    critical = message.getFlag('foundry-chromatic-dungeons', 'critical'),
    parts    = message.getFlag('foundry-chromatic-dungeons', 'tooltip'),
    actor    = message.getFlag('foundry-chromatic-dungeons', 'actor'),
    success  = message.getFlag('foundry-chromatic-dungeons', 'success');

  const tooltip = await renderTemplate(
    Roll.TOOLTIP_TEMPLATE,
    { parts }
  )

  const context = {
    actor,
    critical,
    message,
    success,
    roll: {
      formula,
      total,
      tooltip
    }
  };

  const updatedTemplate = await renderTemplate(
    `${CONFIG.CHROMATIC.templateDir}/chat/attribute.hbs`,
    context
  );

  html
    .find('.message-content')
    .replaceWith(updatedTemplate);
}

const formatAttackRoll = async (message, html) => {
  const
    critical = message.getFlag('foundry-chromatic-dungeons', 'critical'),
    rolls    = message.getFlag('foundry-chromatic-dungeons', 'rolls'),
    tooltips = message.getFlag('foundry-chromatic-dungeons', 'tooltips'),
    source   = message.getFlag('foundry-chromatic-dungeons', 'source'),
    actor    = message.getFlag('foundry-chromatic-dungeons', 'actor'),
    target   = message.getFlag('foundry-chromatic-dungeons', 'target');

  const attackTooltip = await renderTemplate(
    Roll.TOOLTIP_TEMPLATE,
    { parts: tooltips.attack }
  )

  const damageTooltip = await renderTemplate(
    Roll.TOOLTIP_TEMPLATE,
    { parts: tooltips.damage }
  )

  const context = {
    actor,
    target,
    source,
    critical,
    message,
    attack: {
      formula: rolls.attack.formula,
      total: rolls.attack.total,
      tooltip: attackTooltip
    },
    damage: (!rolls.damage) ? null : {
      formula: rolls.damage.formula,
      total: rolls.damage.total,
      tooltip: damageTooltip
    }
  };

  const updatedTemplate = await renderTemplate(
    `${CONFIG.CHROMATIC.templateDir}/chat/attack.hbs`,
    context
  );

  html
    .find('.message-content')
    .replaceWith(updatedTemplate);
}

const formatSaveRoll = async (message, html) => {
  const
    {
      formula,
      total
    }        = message.getFlag('foundry-chromatic-dungeons', 'roll'),
    critical = message.getFlag('foundry-chromatic-dungeons', 'critical'),
    parts    = message.getFlag('foundry-chromatic-dungeons', 'tooltip'),
    actor    = message.getFlag('foundry-chromatic-dungeons', 'actor'),
    success  = message.getFlag('foundry-chromatic-dungeons', 'success');

  const tooltip = await renderTemplate(
    Roll.TOOLTIP_TEMPLATE,
    { parts }
  )

  const context = {
    actor,
    critical,
    message,
    success,
    roll: {
      formula,
      total,
      tooltip
    }
  };

  const updatedTemplate = await renderTemplate(
    `${CONFIG.CHROMATIC.templateDir}/chat/save.hbs`,
    context
  );

  html
    .find('.message-content')
    .replaceWith(updatedTemplate);
}

Hooks.on('renderChatMessage', (message, html) => {
  switch (message.getFlag('foundry-chromatic-dungeons', 'rollType')) {
    case 'attribute': formatAttributeRoll(message, html); break;
    case 'attack':    formatAttackRoll(message, html); break;
    case 'save':      formatSaveRoll(message, html); break;
    default:          return;
  }
})