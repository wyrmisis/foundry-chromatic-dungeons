Hooks.once("ready", async function() {
  Hooks.on('applyActiveEffect', async (actor, change) => {    
    if (change.mode === 0 && change.key === CONFIG.CHROMATIC.dataKeys.language) {
      const find = (i, name = '') =>
        actor.data.data.languages[i] === name

      if (actor.data.data.languages === undefined) return;

      const languageIndexes = Object.keys(actor.data.data.languages);
      const alreadyHasLanguage = !!languageIndexes.find(
        i => find(i, change.value)
      );
      const firstEmptyIndex = languageIndexes.find(
        i => find(i)
      );

      if (!alreadyHasLanguage && firstEmptyIndex)
        actor.data.data.languages[firstEmptyIndex] = change.value;
    }
  });
});
