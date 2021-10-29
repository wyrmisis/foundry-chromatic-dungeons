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

  game.settings.register("foundry-chromatic-dungeons", "derived-stats-tab", {
    name: "(Client) Enable the Derived Stats tab",
    hint: "Add a tab to the player character sheet that details stats derived from your core attributes.",
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
    default: true,
    onChange: () => window.location.reload()
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
    default: 2,
    onChange: () => window.location.reload()
  });
  
  game.settings.register("foundry-chromatic-dungeons", "encumbrance", {
    name: "Use Encumbrance",
    hint: "Use the optional encumbrance rules, which impose penalties for carrying too much weight or using armor that your Class Group hasn't prepared you for.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => window.location.reload()
  });

  game.settings.register("foundry-chromatic-dungeons", "critical-hits", {
    name: "Critical Hits",
    hint: "Which optional rules would you like to use for critical hits (a result of 20 on an attack roll)?",
    scope: "world",
    config: true,
    type: String,
    default: "none",
    choices: {
      "none": "None",
      "double": "Double damage",
      "table": "Use the Critical Hit table"
    },
    onChange: () => window.location.reload()
  });
}
