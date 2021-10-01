import { hasThisAlready, reportAndQuit } from '../helpers/utils.mjs';


Hooks.once("ready", async function() {
  Hooks.on('dropActorSheetData', async (actor, sheet, dropped) => {
    const [droppedItem, droppedSourceId] = await 
      !dropped.pack
        ? [dropped.data, dropped.sourceId]
        : game.packs
          .get(dropped.pack)
          .getDocument(dropped.id)
          .then((item) => [
            item,
            item.getFlag('core', 'sourceId')
          ]);

    if (
      actor.type !== 'pc' && (
      droppedItem.type === 'ancestry' ||
      droppedItem.type === 'heritage' ||
      droppedItem.type === 'class'
    ))
      return reportAndQuit('Only PCs can have an ancestry, heritage, or class');

    if (droppedItem.type === 'ancestry') {
      const actorAncestry = actor.items.find(item => item.type === 'ancestry');

      if (actorAncestry)
        return reportAndQuit(`${actor.name} already has an ancestry`);
    }

    // @todo Add a setting for number of heritages
    if (droppedItem.type === 'heritage') {
      const actorHeritages = actor.items.filter(item => item.type === 'heritage');

      if (hasThisAlready('heritage', droppedItem, actorHeritages))
        return reportAndQuit(`${actor.name} already has the ${droppedItem.name} heritage`);

      if (actorHeritages.length >= 2)
        return reportAndQuit(`${actor.name} already has two heritages`);
    }

    // // @todo Add a setting for class stat requirements
    if (droppedItem.type === 'class') {
      const actorClasses = actor.items.filter(item => item.type === 'class');

      if (hasThisAlready('class', droppedItem, actorClasses))
        return reportAndQuit(`${actor.name} already has the ${droppedItem.name} class`);

      const reqs = droppedItem.data.data.requirements
      const attributes = actor.data.data.attributes;
      const missedReqs = Object.keys(reqs).filter(
        (reqKey) => attributes[reqKey] < reqs[reqKey]
      );

      if (missedReqs.length)
        return reportAndQuit(`${actor.name} does not meet the attribute requirements to become a ${droppedItem.name}.`);
    }

    if (droppedItem.type === 'spell') {
      const actorSpells = actor.items
        .filter(item => item.type === 'spell')
        .map(item => item.data);

      if (hasThisAlready('spell', droppedItem, actorSpells))
        return reportAndQuit(`${actor.name} already has the ${droppedItem.name} spell`);

      return false;
    }
  });
});