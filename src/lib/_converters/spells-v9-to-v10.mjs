/**
 * This code can be pasted in your browser's dev console to 
 * convert spells from the v9 format, where spells could have
 * multiple classes and levels, to the v10 format, where each
 * class gets its own copy of a spell. The result of this change
 * will be implemented once the Compendium Folders module is
 * compatible with Foundry v10.
 * 
 * Why this change? It was maddening for my own players to figure
 * out which spells they could take at first level from the VTT!
 */

 const classComp = 'foundry-chromatic-dungeons.class';

 const classListFromList = (uuid, list) => 
   list
     .filter(spell => spell.system.class === uuid);
 
 const getClassIdFromName = (name) => 
   game.packs.get(classComp).index
     .find(obj => obj.name === name)._id
 
 const wizardUUID = `Compendium.${classComp}.${ getClassIdFromName('Wizard')}`;
 const sorcererUUID = `Compendium.${classComp}.${ getClassIdFromName('Sorcerer')}`;
 const clericUUID = `Compendium.${classComp}.${ getClassIdFromName('Cleric')}`;
 const druidUUID = `Compendium.${classComp}.${ getClassIdFromName('Druid')}`;
 const bardUUID = `Compendium.${classComp}.${ getClassIdFromName('Bard')}`;
 const paladinUUID = `Compendium.${classComp}.${ getClassIdFromName('Paladin')}`;
 const rangerUUID = `Compendium.${classComp}.${ getClassIdFromName('Ranger')}`;
 
 const folderColors = {
   Wizard: {
     level: '#0e3a81',
     school: '#092753',
   },
   Cleric: {
     level: '#0e8173',
     school: '#09534a',
   },
   Druid: {
     level: '#31810e',
     school: '#1f5309',
   },
   Sorcerer: {
     level: '#810e31',
     school: '#53091f',
   },
   Bard: {
     level: '#730e81',
     school: '#4a0953'
   },
   Paladin: {
     level: '#0e8173',
     school: '#09534a',
   },
   Ranger: {
     level: '#31810e',
     school: '#1f5309',
   },
 }
 
 getAllItemsOfType('spell', 'foundry-chromatic-dungeons.spell').then(spells => {
   const spellList = formatV9Spells(spells);;
   
   // const spellListsPerClassSchoolAndLevel = {
   //   Wizard: sortBySchoolAndLevel(classListFromList(wizardUUID, spellList)),
   //   Cleric: sortBySchoolAndLevel(classListFromList(clericUUID, spellList)),
   //   Paladin: sortBySchoolAndLevel(classListFromList(paladinUUID, spellList)),
   //   Druid: sortBySchoolAndLevel(classListFromList(druidUUID, spellList)),
   //   Ranger: sortBySchoolAndLevel(classListFromList(rangerUUID, spellList)),
   //   Sorcerer: sortBySchoolAndLevel(classListFromList(sorcererUUID, spellList)),
   //   Bard: sortBySchoolAndLevel(classListFromList(bardUUID, spellList)),
   // };
   // buildClassSchoolLevelFolders(spellListsPerClassSchoolAndLevel);
 
   const spellListsPerClass = {
    //  Wizard: classListFromList(wizardUUID, spellList),
     Cleric: classListFromList(clericUUID, spellList),
    //  Paladin: classListFromList(paladinUUID, spellList),
    //  Druid: classListFromList(druidUUID, spellList),
    //  Ranger: classListFromList(rangerUUID, spellList),
    //  Sorcerer: classListFromList(sorcererUUID, spellList),
    //  Bard: classListFromList(bardUUID, spellList),
   };
   buildClassFolders(spellListsPerClass);
 });
 
 const buildClassSchoolLevelFolders = async (spellListsPerClassSchoolAndLevel) => {
   Object.keys(spellListsPerClassSchoolAndLevel).forEach(async (classname) => {
     const castingClass = spellListsPerClassSchoolAndLevel[classname]
     const classFolder = await Folder.create({
       type: 'Item', name: classname
     });
     // Create class folder
 
     Object.keys(castingClass).forEach(async (level) => {
       const castingLevel = castingClass[level];
       const ordinalLevel = withOrdinalSuffix(level);
       const levelFolder = await Folder.create({
         type: 'Item', name: `${ordinalLevel} Level`, color: folderColors[classname].level, folder: classFolder._id
       });
       // Create level folder
 
       Object.keys(castingLevel).forEach(async (school) => {
         const castingSchool = castingLevel[school];
         const schoolFolder = await Folder.create({
           type: 'Item', name: school, color: folderColors[classname].school, folder: levelFolder._id
         });
         // create school folder
 
         Item.create(castingSchool.map(spell => ({
           ...spell,
           folder: schoolFolder._id
         })))
       })
     })
   })
 }
 
 const buildClassFolders = async (spellListsPerClass) => {
   Object.keys(spellListsPerClass).forEach(async (classname) => {
     const castingClass = spellListsPerClass[classname]
     const classFolder = await Folder.create({
       type: 'Item', name: classname
     });
     
     Item.create(castingClass.map(spell => ({
       ...spell,
       folder: classFolder._id
     })))
   })
 }
 
 const sortBySchoolAndLevel = (list) =>
   list.reduce((prev, curr) => {
     const hasLevel = prev?.[curr.system.level];
     if (!hasLevel)
       prev[curr.system.level] = {};
 
     const hasSchool = prev[curr.system.level]?.[curr.system.school];
     if (!hasSchool)
       prev[curr.system.level][curr.system.school] = [];
 
     prev[curr.system.level][curr.system.school].push(curr);
     return prev;
   }, {});
 
 const withOrdinalSuffix = (n) =>
   `${n}${[,'st','nd','rd'][n/10%10^1&&n%10]||'th'}`
 
 const formatV9Spells = (spells) => {
   const spellList = [];
 
   spells.forEach(spell => {
     // This spell has already been converted
     if (!spell.system.spellLevels)
       return;
 
     const spellLevels = Object.keys(spell.system.spellLevels);
 
     spellLevels.forEach(castingClass => {
       const castingUUID = `Compendium.foundry-chromatic-dungeons.class.${spell.system.spellLevels[castingClass].sourceId.split('.')[1]}`;
 
       const { school } = spell.system;
 
       if (
         (castingUUID === sorcererUUID) &&
         (
           school === 'Abjuration' ||
           school === 'Conjuration' ||
           school === 'Illusion' ||
           school === 'Enchantment'
         ) &&
         spell.system.spellLevels[castingClass].level <= 7
       ) {
         // Bard spells!
         const bardSpell = {
           name: spell.name,
           img: spell.img,
           type: 'spell',
           system: {
             ...spell.system,
             level: spell.system.spellLevels[castingClass].level,
             class: bardUUID
           }
         };
   
         delete bardSpell.system.spellLevels;
 
         spellList.push(bardSpell);
       };
 
       if (
         (castingUUID === rangerUUID || castingUUID === paladinUUID) &&
         spell.system.spellLevels[castingClass].level > 4
       ) return;
 
       const reformatted = {
         name: spell.name,
         img: spell.img,
         type: 'spell',
         system: {
           ...spell.system,
           level: spell.system.spellLevels[castingClass].level,
           class: castingUUID
         }
       };
 
       delete reformatted.system.spellLevels;
       
       spellList.push(reformatted)
     })    
   });
 
   return spellList;
 }