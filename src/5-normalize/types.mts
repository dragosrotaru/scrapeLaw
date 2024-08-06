/* ABSTRACT */

export type ID = string;

/* 
A generic Entity
*/
export interface Entity {
    id: ID;
}

/* STATIC */

/*
The source is the external source of the data,
Which represents the process of extracting the data from the source,
not just the source itself as the domain or url could have multiple 
embedded "sources".
*/
export interface Source extends Entity {
    name: string;
    description?: string;
}

/* 
A decision method is a method of making a decision, used to make many decisions
*/
export interface DecisionMethod extends Entity {
    name: string;
    description: string;
}

/* DYNAMIC */

export type Data = Record<string, unknown>;
/* 
An instance of a record extracted from a source
 */
export interface SourceRecord extends Entity {
    source: ID;
    retrievedOn: string; // date
    original: string; // the original data
    data: Record<string, unknown>; // the extracted data
}


/* 
A decision is an instance of applying a method of decision making - code, a human or AI
to produce a result
*/
export interface Decision extends Entity {
    timestamp: string; // date
    confidence: number;
    explanation: string;
    decisionMethod: ID;
}

/* 
recognition instance of an entity, a decision made from a Record
*/
export interface EntityRecognition extends Decision {
    entity: ID;
    sourceRecord: ID;
}

/* 
An entity Merge which is a merge of multiple entities,
a decision derived from multiple recognition decisions
*/
export interface EntityMerge extends Decision {
    entities: ID[];
}

/* 
An Attribute is a field extracted from a Record,
or derived from another Attribute
*/
/* 
I could derive an attribute from another attribute or set of attributes,
for example, I could derive the domain of an Entity from an email,
or the format of firms emails from the set of all emails
*/
export type AttributeKind = "entity_type" | "relation" | "field";
export  interface Attribute extends Decision {
    kind: AttributeKind;
    type: string;
    entity: ID; // Entity ID
    derivedFrom?: ID[]; // the IDs of the attributes or Entities this attribute is derived from
    sourcedFrom?: ID; // the ID of the SourceRecord this attribute is sourced from
}

export type EntityType = "person" | "firm" | "government";
export interface EntityTypeAttribute extends Attribute {
    kind: "entity_type";
    type: EntityType;
}

export type RelationType = "unknown" | "employee" | "partner" | "owner" | "director";
export interface RelationAttribute extends Attribute {
    kind: "relation";
    type: RelationType; // relation type
    toEntity: ID; // the ID of the related DomainEntity
}

export type FieldType = string;
export interface FieldAttribute extends Attribute {
    kind: "field";
    type: FieldType; // the type of the field
    value: unknown; // the value of the field
}

/* 
the verification of an attribute, a decision made to verify the value of an attribute
*/
export interface Verification extends Decision {
    entity: ID;
    verified: true;
}