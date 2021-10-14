Hooks.once('init', () => {
  setupClientSettings();
  setupGloablSettings();
});

const setupClientSettings = () => {
  game.settings.register("foundry-chromatic-dungeons", "horizontal-attributes", {
    name: "(Client) Use Horizontal Attributes Bar",
    hint: "Move the attributes from the left side of the character sheet to in between the header and tabs.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
  
  game.settings.register("foundry-chromatic-dungeons", "gear-cards", {
    name: "(Client) Use Item Cards for Gear",
    hint: "Use the alternative Item Cards UI for the Gear section of the Items tab on character sheets",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });  
}

const setupGloablSettings = () => {
  game.settings.register("foundry-chromatic-dungeons", "class-restrictions", {
    name: "Use Class Restrictions",
    hint: "Allow a character's attributes to restrict what classes a character has access to.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("foundry-chromatic-dungeons", "max-heritages", {
    name: "Max Heritages",
    hint: "Set how many heritages a character can use. The system recommends 2.",
    scope: "world",
    config: true,
    type: Number,
    range: {
      step: 1,
      min: 0,
      max: 10
    },
    default: 2
  });
  
  game.settings.register("foundry-chromatic-dungeons", "encumbrance", {
    name: "Use Encumbrance",
    hint: "Use the optional encumbrance rules, which impose penalties for carrying too much weight or using armor that your Class Group hasn't prepared you for.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
}
