import {getDerivedStat} from './utils.mjs';

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

  Handlebars.registerHelper('paddedTo', (arr = [], minimum) =>
    (arr.length >= minimum)
      ? arr
      : Array.from({...arr, length: minimum})
  );

  Handlebars.registerHelper('spellsAtLevel', (spells, classname, level) =>
    spells.filter(spell =>
      spell.system.class.includes(
        classname.sourceId.split('.')[1]
      ) && spell.system.level === parseInt(level)
    )
  );

  Handlebars.registerHelper('getClassPreparedSpellsAtLevel',
    (castingClass, index) => castingClass.slots[index].preparedSpells
  );

  Handlebars.registerHelper('firstParagraph', html => {
    const parent = document.createElement('div');
    parent.innerHTML = html;

    return parent.firstChild.innerHTML || `<p>${html}</p>`;
  })

  Handlebars.registerHelper('lte', (a, b) => (a <= b));
};

export default setupHandlebarsHelpers;