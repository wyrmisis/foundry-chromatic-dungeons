import {getDerivedStat} from './utils.mjs';

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

const setupHandlebarsHelpers = () => {
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
   * derivedStat
   * 
   * @param {String} attrAbbr The attribute abbreviation
   * @param {Number} attrValue The attribute value
   * @param {String} derivedKey The key to look up on the derived stat table
   * 
   * Return the requested derived stat.
   */
  Handlebars.registerHelper('derivedStat', getDerivedStat);
};

export default setupHandlebarsHelpers;