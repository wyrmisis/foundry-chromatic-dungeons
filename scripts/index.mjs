Hooks.once("init", () => {
  console.info('Chromatic Dungeons | Initializing');

  Actors.unregisterSheet("core", ActorSheet);
  Items.unregisterSheet("core", ItemSheet);

  // @todo register system sheets
});
