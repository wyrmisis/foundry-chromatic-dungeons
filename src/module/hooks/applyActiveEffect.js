Hooks.once("ready", async function() {
  Hooks.on('applyActiveEffect', async (actor, change) => {    
    if (change.mode === 0 && change.key === CONFIG.CHROMATIC.dataKeys.language) {
      const find = (i, name = '') =>
        actor.system.languages[i] === name

      if (actor.system.languages === undefined) return;

      const languageIndexes = Object.keys(actor.system.languages);
      const alreadyHasLanguage = !!languageIndexes.find(
        i => find(i, change.value)
      );
      const firstEmptyIndex = languageIndexes.find(
        i => find(i)
      );

      if (!alreadyHasLanguage && firstEmptyIndex)
        actor.system.languages[firstEmptyIndex] = change.value;
    }
  });
});
