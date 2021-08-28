import {getDerivedStat} from './utils.mjs';

const setupHandlebarsHelpers = () => {
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