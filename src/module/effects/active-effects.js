class RolldataAwareActiveEffect extends ActiveEffect {
  apply (owner, change) {
    if (change.key.indexOf('@') === 0)
      change.key= change.key.replace('@', 'data.');

    change.value = Roll.replaceFormulaData(change.value, owner.getRollData());

    try {
      change.value = Roll.safeEval(change.value).toString();
    } catch (e) { /* noop */ }

    return super.apply(owner, change);
  }
}

Hooks.once('init', async function() {
  console.info('Rolldata Aware Active Effect | Overriding default ActiveEffect class...')
  CONFIG.ActiveEffect.documentClass = RolldataAwareActiveEffect;
});
