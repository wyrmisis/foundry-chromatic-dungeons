class HeritageDataModel extends foundry.abstract.DataModel {
  #enrichedDescription;

  constructor(...args) {
    super(...args);

    this.setEnrichedDescription(args[0].description).then((enriched) => {
      this.#enrichedDescription = enriched;
    });
    // this.#enrichedDescription = ;
  }
  
  // @todo define schema
  static defineSchema() {
    const { StringField } = foundry.data.fields;

    return {
      "description": new StringField(),
    }
  }

  get enrichedDescription () {
    return this.#enrichedDescription;
  }

  async setEnrichedDescription(description = '') {
    return await TextEditor.enrichHTML(description || this.description, {async: true});
  }
}

export default HeritageDataModel;