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

  const critTooltip = await renderTemplate(
    Roll.TOOLTIP_TEMPLATE,
    { parts: tooltips.crit }
  )

  const context = {
    actor,
    target,
    source,
    critical,
    message,
    attack: {
      formula:  rolls.attack.formula,
      total:    rolls.attack.total,
      tooltip:  attackTooltip
    },
    damage: (!rolls.damage) ? null : {
      formula:  rolls.damage.formula,
      total:    rolls.damage.total,
      tooltip:  damageTooltip
    },
    crit: (!rolls.crit && !critical.successEffect) ? null : {
      effect:   critical.successEffect,
      formula:  rolls.crit?.formula,
      total:    rolls.crit?.total,
      tooltip:  critTooltip
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

const formatClassRoll = async (message, html, data) => {
  const
    img         = message.getFlag('foundry-chromatic-dungeons', 'img'),
    xp          = message.getFlag('foundry-chromatic-dungeons', 'xp'),
    previous    = message.getFlag('foundry-chromatic-dungeons', 'previous'),
    next        = message.getFlag('foundry-chromatic-dungeons', 'next');

  const context = { img, xp, previous, next, ...data };

  const updatedTemplate = await renderTemplate(
    `${CONFIG.CHROMATIC.templateDir}/chat/class.hbs`,
    context
  );

  html
    .find('.message-content')
    .replaceWith(updatedTemplate);
}

const formatArmorRoll = async (message, html, data) => {
  const
    ac          = message.getFlag('foundry-chromatic-dungeons', 'ac'),
    img         = message.getFlag('foundry-chromatic-dungeons', 'img'),
    type        = message.getFlag('foundry-chromatic-dungeons', 'type');

  const context = {ac, img, type, ...data };

  const updatedTemplate = await renderTemplate(
    `${CONFIG.CHROMATIC.templateDir}/chat/armor.hbs`,
    context
  );

  html
    .find('.message-content')
    .replaceWith(updatedTemplate);
}

const formatSpellRoll = async (message, html, data) => {
  const
    img           = message.getFlag('foundry-chromatic-dungeons', 'img'),
    range         = message.getFlag('foundry-chromatic-dungeons', 'range'),
    duration      = message.getFlag('foundry-chromatic-dungeons', 'duration'),
    areaOfEffect  = message.getFlag('foundry-chromatic-dungeons', 'areaOfEffect'),
    castingTime   = message.getFlag('foundry-chromatic-dungeons', 'castingTime'),
    components    = {
      verbal      : message.getFlag('foundry-chromatic-dungeons', 'hasVerbalComponent'),
      material    : message.getFlag('foundry-chromatic-dungeons', 'hasMaterialComponent'),
      somatic     : message.getFlag('foundry-chromatic-dungeons', 'hasSomaticComponent')
    },
    hasComponents = ~foundry.utils.isEmpty(components);

  const context = {
    img,
    range,
    duration,
    areaOfEffect,
    castingTime,
    components,
    hasComponents,
    ...data
  };

  const updatedTemplate = await renderTemplate(
    `${CONFIG.CHROMATIC.templateDir}/chat/spell.hbs`,
    context
  );

  html
    .find('.message-content')
    .replaceWith(updatedTemplate);
}

/**
 * ======== TEMPLATES TO ADD ========
 *
 * -------- Class --------
 * * Current Level
 * * XP / Next (with progress bar?)
 * 
 * -------- Treasure --------
 * * Value
 * * Quantity
 * * Description (if any)
 * 
 * -------- Spell --------
 * * (Spell School), (Spell Level)th level
 * * Table containing: range, duration, AoE, save type (if any)
 * * Description
 */

/**
 * 
 * @param {ChatMessage} message   The ChatMessage document being rendered
 * @param {jQuery} html           The pending HTML as a jQuery object
 * @param {object} data           The input data provided for template rendering 
 */
const messageFormattingDelegator = (message, html, data) => {
  let formatter;
  const noOp = console.info;

  switch (message.getFlag('foundry-chromatic-dungeons', 'rollType')) {
    case 'armor':     formatter = formatArmorRoll;     break;
    case 'class':     formatter = formatClassRoll;     break;
    // case 'treasure':  formatter = noOp; break;
    case 'spell':     formatter = formatSpellRoll;     break;
    case 'attribute': formatter = formatAttributeRoll; break;
    case 'attack':    formatter = formatAttackRoll;    break;
    case 'save':      formatter = formatSaveRoll;      break;
  }

  if (formatter) formatter(message, html, data);
}

Hooks.on('renderChatMessage', messageFormattingDelegator)