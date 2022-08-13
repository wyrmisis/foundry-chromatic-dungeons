import {
  getDerivedStatWithContext
} from '../../helpers/utils.mjs';

const { NumberField, SchemaField, StringField } = foundry.data.fields;

export const numberFieldsFromKeys = (obj) =>
  obj && Object.keys(obj).reduce(
    (prev, curr) => ({
      ...prev,
      [curr]: new NumberField()
    }),
    {}
  );

export const sharedSchemaKeys = () => ({
  alignment: new StringField(),
  attributes: new SchemaField({
    ...numberFieldsFromKeys(CONFIG?.CHROMATIC?.attributes)
  }),
  attributeMods: new SchemaField({
    ...numberFieldsFromKeys(CONFIG?.CHROMATIC?.attributes)
  }),
  hp:  new SchemaField({
    'value': new NumberField({
      step: 1,
      integer: true
    }),
    'min': new NumberField({
      step: 1,
      integer: true
    }),
    'max': new NumberField({
      step: 1,
      integer: true
    }),
  }),
  baseAC: new NumberField(),
  modInitiative: new NumberField(),
  modAC: new NumberField(),
  modMove: new NumberField(),
  moveMultiplier: new NumberField(),
  modToHit: new NumberField(),
  modDamage: new NumberField(),
  modPerception: new NumberField(),
});

const getDerivedPCToHitMod = (datamodel, classMod, isMelee) => {
  const attrToHit = isMelee 
    ? getDerivedStatWithContext('str', 'modToHit', datamodel)
    : getDerivedStatWithContext('dex', 'modAgility', datamodel);

  return classMod + attrToHit + (datamodel.modToHit || 0);
}

const getDerivedMonsterClassToHitMod = (datamodel, classMod, isMelee) => {
  const attrToHit = isMelee 
    ? getDerivedStatWithContext('str', 'modToHit', datamodel)
    : getDerivedStatWithContext('dex', 'modAgility', datamodel);

  const monsterToHit = isMelee
    ? (datamodel.monsterVariant?.modToHit?.melee || 0)
    : (datamodel.monsterVariant?.modToHit?.ranged || 0);

  return classMod + attrToHit + monsterToHit + (datamodel.modToHit || 0);
}


export const getMeleeToHitMod = (datamodel, classMod = 0, isPC) => {
  return (isPC 
    ? getDerivedPCToHitMod 
    : getDerivedMonsterClassToHitMod
  )(datamodel, classMod, true);
}

export const getRangedToHitMod = (datamodel, classMod = 0, isPC) => {
  return (isPC 
    ? getDerivedPCToHitMod 
    : getDerivedMonsterClassToHitMod
  )(datamodel, classMod);
}

export const getRangedDamageMod = (datamodel) =>
  (datamodel.modDamage || 0) +
  (datamodel.monsterVariant?.modDamage?.ranged || 0);

export const getStrDamageMod = (datamodel) =>
  (datamodel.modDamage || 0) +
  (datamodel.monsterVariant?.modDamage?.melee || 0) +
  getDerivedStatWithContext('str', 'modMeleeDamage', datamodel);
