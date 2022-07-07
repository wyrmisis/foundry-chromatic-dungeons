Hooks.once("ready", async function() {

  // Classgroup Specific
  Hooks.on('createItem', async (item, options, userId) => {
    if (item.type !== 'classgroup') return;

    if (!item.system.levels.length) {
      const rawHitDieMax = 9;
      let levels = Array.from(Array(20), (_v, index) => ({
        saves: { reflex: 18, poison: 16, creature: 17, spell: 19 },
        addsFullConModToHP: true,
        modToHit: 1
      }));
      levels.unshift('');
      levels = {...levels};

      delete levels[0];

      await item.update({ data: {
        levels,
        lastLevelForHitDice: rawHitDieMax,
        lastLevelForConMod: rawHitDieMax
      }});
    }
  });
});