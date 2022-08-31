class PartyDataModel extends foundry.abstract.DataModel {
  constructor() {
    super(...arguments);
  }

  static defineSchema() {
    const { StringField, ArrayField, NumberField, SchemaField } = foundry.data.fields;

    return {
      party: new ArrayField(new StringField()),
      henchmen: new ArrayField(new StringField()),
      pets: new ArrayField(new StringField()),
      hirelings: new ArrayField(new SchemaField({
        uuid: new StringField(),
        count: new NumberField({
          min: 0
        })
      })),
      wealth: new SchemaField({
        pp: new NumberField(),
        gp: new NumberField(),
        ep: new NumberField(),
        sp: new NumberField(),
        cp: new NumberField()
      }),
      notes: new StringField,
      gmNotes: new StringField,
    }
  }
}

export default PartyDataModel;