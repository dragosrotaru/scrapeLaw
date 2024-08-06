// 3rd Party
import crypto from 'node:crypto';

// Utility
import { writeJSONFile } from '../utility/io.mts';

// This Step
import type {
  DecisionMethod,
   EntityRecognition,
   Entity,
   SourceRecord,
  Attribute,
  EntityTypeAttribute,
  EntityType,
  Decision,
  Source,
  Data,
  FieldAttribute,
  FieldType,
  ID,
  RelationAttribute,
  RelationType
} from "./types.mts";


export class DecisionBuilder {
  private entities: Entity[] = [];
  private recognitions: EntityRecognition[] = [];
  private attributes: Attribute[] = [];
  private records: SourceRecord[] = [];
  constructor(
    public method: DecisionMethod,
    public timestamp: string = new Date().toISOString(),
    public confidence: number = 1,
    public explanation: string = "handwritten code"
  ) {}
  
  generateUUID(): string {
    return crypto.randomUUID();
  }

  generateHashID(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  createEntity(store: boolean): Entity {
    const entity = {
      id: this.generateUUID(),
    };
    if (store) this.entities.push(entity);
    return entity;
  }

  createDecision(): Decision {
    const decision = {
      ...this.createEntity(false),
      timestamp: this.timestamp,
      confidence: this.confidence,
      explanation: this.explanation,
      decisionMethod: this.method.id,
    };
    return decision;
  }

  addRecord(source: Source, data: Data, original: string, store: boolean, id?: string): SourceRecord {
    const recordID = id ? id : this.generateHashID(original);
    const record: SourceRecord = {
      id: recordID,
      source: source.id,
      retrievedOn: new Date().toISOString(),
      original,
      data,
    };
    if (store) this.records.push(record);
    return record;
  }
  
  recognizeEntity(
    record: SourceRecord,
    type: EntityType,
    store: boolean
  ): {
    entity: Entity;
    recognition: EntityRecognition;
    entityTypeAttribute: EntityTypeAttribute;
  } {
    const entity = this.createEntity(store);
    const recognition: EntityRecognition = {
      ...this.createDecision(),
      entity: entity.id,
      sourceRecord: record.id,
    };
    const entityTypeAttribute: EntityTypeAttribute = {
      ...this.createDecision(),
      entity: entity.id,
      kind: "entity_type",
      type,
    };
    if (store) {
      this.entities.push(entity);
      this.recognitions.push(recognition);
      this.attributes.push(entityTypeAttribute);
    }
    return { entity, recognition, entityTypeAttribute };
  }

  addFieldAttribute(
    entity: Entity,
    fieldType: FieldType,
    value: unknown,
    store: boolean,
    sourcedFrom?: ID
  ): Attribute {
    const attribute: FieldAttribute = {
      ...this.createDecision(),
      entity: entity.id,
      kind: "field",
      type: fieldType,
      value,
      sourcedFrom
    };
    if (store) this.attributes.push(attribute);
    return attribute;
  }

  addRelationAttribute(
    entity: Entity,
    relationType: RelationType,
    toEntity: Entity,
    store: boolean,
    sourcedFrom?: ID
  ): RelationAttribute {
    const attribute: RelationAttribute = {
      ...this.createDecision(),
      entity: entity.id,
      kind: "relation",
      type: relationType,
      toEntity: toEntity.id,
      sourcedFrom
    };
    if (store) this.attributes.push(attribute);
    return attribute;
  }

  save() {
    writeJSONFile("./data/entities.json", this.entities);
    writeJSONFile("./data/recognitions.json", this.recognitions);
    writeJSONFile("./data/attributes.json", this.attributes);
    writeJSONFile("./data/records.json", this.records);

  }
}