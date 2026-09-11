export interface RelationshipRecordReference {
  collection: string;
  id: string;
}

export interface RelationshipRecord extends RelationshipRecordReference {
  parent?: RelationshipRecordReference;
  payload: Record<string, unknown>;
}

export interface StoredRelationshipRecord extends RelationshipRecord {
  ownerId: string;
}

export interface RelationshipVault {
  put(record: RelationshipRecord): Promise<void>;
  get(collection: string, id: string): Promise<StoredRelationshipRecord | null>;
  listByCollection(collection: string): Promise<StoredRelationshipRecord[]>;
  listByParent(parent: RelationshipRecordReference): Promise<StoredRelationshipRecord[]>;
  replaceChildIfParentExists(
    parent: RelationshipRecordReference,
    child: RelationshipRecordReference,
    replacementRecord: RelationshipRecord,
  ): Promise<boolean>;
  removeChildIfParentExists(parent: RelationshipRecordReference, child: RelationshipRecordReference): Promise<boolean>;
  replaceChildrenIfSourcesExist(
    parent: RelationshipRecordReference,
    sourceRecords: RelationshipRecordReference[],
    childCollection: string,
    replacementRecords: RelationshipRecord[],
    options?: ReplaceChildrenOptions,
  ): Promise<boolean>;
  deleteCascade(root: RelationshipRecordReference): Promise<void>;
}

export interface ReplaceChildrenOptions {
  preserveChild?: (record: StoredRelationshipRecord) => boolean;
  conflictsWithPreservedChild?: (replacement: RelationshipRecord, preservedChild: StoredRelationshipRecord) => boolean;
}

export interface RelationshipVaultOptions {
  idbFactory?: IDBFactory;
}

export class MissingRelationshipOwnerError extends Error {
  constructor() {
    super("A non-empty relationship-data owner ID is required.");
    this.name = "MissingRelationshipOwnerError";
  }
}

export class RelationshipVaultUnavailableError extends Error {
  constructor() {
    super("IndexedDB is unavailable in this environment.");
    this.name = "RelationshipVaultUnavailableError";
  }
}

export class RelationshipRecordNotFoundError extends Error {
  constructor(reference: RelationshipRecordReference) {
    super(`The ${reference.collection} record "${reference.id}" does not exist for this owner.`);
    this.name = "RelationshipRecordNotFoundError";
  }
}
