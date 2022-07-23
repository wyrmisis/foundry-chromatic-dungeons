import showdown from 'showdown';
import {getDerivedStat} from './utils.mjs';

const mdParser = new showdown.Converter({
  tables: true
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

const setupHandlebarsHelpers = () => {
  Handlebars.registerHelper('partial', (partialPath) => `${CONFIG.CHROMATIC.templateDir}/${partialPath}`)

  /**
   * arbitraryLoop
   * 
   * We need to do something X number of times in a Handlebars
   * template, but we don't have an array for it.
   */
  Handlebars.registerHelper('arbitraryLoop', (length) => Array.from({length}));
  Handlebars.registerHelper('sum', (...args) => parseInt(args.reduce((total, add) => total + add, 0)));
  Handlebars.registerHelper('markdown', (input) => mdParser.makeHtml(input));
  Handlebars.registerHelper('default', (value, defaultValue) => 
    [null, undefined].includes(value) 
      ? defaultValue
      : value
  );

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('itemIndexFromId', (actor, itemId) =>
    actor.items.findIndex((i) => i._id === itemId)
  );

  Handlebars.registerHelper(
    'equals',
    (...args) => args.every(val => val === args[0]) 
  );

  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  });
  
  /**
   * localizeAttr
   * 
   * Given an attribute abbreviation, get the localized attribute name.
   */
  Handlebars.registerHelper(
    'localizeAttr',
    (attrAbbr) => game.i18n.localize(CONFIG.CHROMATIC.attributeLabels[attrAbbr])
  );

  /**
   * signedString
   * 
   * Return a number with a preceeding +/-
   */
  Handlebars.registerHelper(
    'signedString',
    (...values) => {
      const total = values
        .filter(v => typeof v === 'number')
        .reduce((prev, curr) => prev + curr, 0);
      if (total === 0) return '+0';

      return total > 0 ? `+${total}` : `${total}`
    }
   );

   Handlebars.registerHelper(
      'classXpProgress',
      ({level, xp, xpNext}) => ({
        min: level === 1 ? 0 : CONFIG.CHROMATIC.xp[level - 2].xp,
        max: xpNext,
        value: xp
      })
   );

  /**
   * derivedStat
   * 
   * @param {String} attrAbbr The attribute abbreviation
   * @param {Number} attrValue The attribute value
   * @param {String} derivedKey The key to look up on the derived stat table
   * 
   * Return the requested derived stat.
   */
  Handlebars.registerHelper('derivedStat', getDerivedStat);

  /**
   * optionalAttr
   * 
   * @param {string} key The HTML attribute to set
   * @param {string|number} value The value to use, if the value exists.
   */
  Handlebars.registerHelper('optionalAttr', (key, value) =>
    (!Handlebars.Utils.isEmpty(value)) &&
      new Handlebars.SafeString(`${key}="${Handlebars.escapeExpression(value)}"`)
  );

  /**
   * equals
   */
  Handlebars.registerHelper('equals', (a, ...b) =>
    (Array.isArray(b))
      ? b.every(i =>  i === a || i.name === 'equals')
      : a === b
  );

  /**
   * dynamicProp
   */
  Handlebars.registerHelper('dynamicProp', (obj, key) => obj[key]);

  /**
   * stringify
   */
  Handlebars.registerHelper('stringify', (obj) => JSON.stringify(obj));

  Handlebars.registerHelper('paddedTo', (arr = [], minimum) =>
    (arr.length >= minimum)
      ? arr
      : Array.from({...arr, length: minimum})
  );

  Handlebars.registerHelper('spellsAtLevel', (spells, classname, level) => {
    const filtered = spells
      .filter(spell => {
        const { spellLevels } = spell.system;
        const spellClasses = Object.keys(spellLevels);

        // @todo Do this with source IDs
        return !!spellClasses.find(spellClass => 
          spellLevels[spellClass].class === classname.name &&
          spellLevels[spellClass].level === parseInt(level)
        );
      })

    return filtered;
  });

  Handlebars.registerHelper('getFeatureContentKey', (key) => `data.features.${key}.content`);

  Handlebars.registerHelper('getClassPreparedSpellsAtLevel',
    (classes, key, level) => classes.find( ({id}) => id === key)?.preparedSpellSlots?.[parseInt(level) - 1]
  );
};

export default setupHandlebarsHelpers;