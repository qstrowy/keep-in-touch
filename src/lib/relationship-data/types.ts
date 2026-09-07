export interface RelationshipRecord {
  id: string;
  collection: string;
  parentId?: string;
  payload: Record<string, unknown>;
}

export interface StoredRelationshipRecord extends RelationshipRecord {
  ownerId: string;
}

export interface RelationshipVault {
  put(record: RelationshipRecord): Promise<void>;
  get(collection: string, id: string): Promise<StoredRelationshipRecord | null>;
  listByParent(parentId: string): Promise<StoredRelationshipRecord[]>;
  deleteCascade(parentId: string): Promise<void>;
}

export class MissingRelationshipOwnerError extends Error {
  constructor() {
    super("A non-empty relationship-data owner ID is required.");
    this.name = "MissingRelationshipOwnerError";
  }
}
