import {
  MissingRelationshipOwnerError,
  RelationshipRecordNotFoundError,
  RelationshipVaultUnavailableError,
  type RelationshipRecordReference,
  type RelationshipVault,
  type RelationshipVaultOptions,
  type StoredRelationshipRecord,
} from "./types";

const DATABASE_NAME = "keep-in-touch-relationship-data";
const DATABASE_VERSION = 2;
const RECORDS_STORE = "records";
const OWNER_INDEX = "by-owner";
const OWNER_PARENT_INDEX = "by-owner-parent";

export function createRelationshipVault(ownerId: string, options: RelationshipVaultOptions = {}): RelationshipVault {
  const normalizedOwnerId = ownerId.trim();
  if (!normalizedOwnerId) {
    throw new MissingRelationshipOwnerError();
  }

  const browserGlobals = globalThis as { indexedDB?: IDBFactory };
  const idbFactory = options.idbFactory ?? browserGlobals.indexedDB;
  if (!idbFactory) {
    throw new RelationshipVaultUnavailableError();
  }

  const database = openDatabase(idbFactory);

  return {
    async put(record) {
      const db = await database;
      const transaction = db.transaction(RECORDS_STORE, "readwrite");
      transaction.objectStore(RECORDS_STORE).put({ ...record, ownerId: normalizedOwnerId });
      await transactionComplete(transaction);
    },
    async get(collection, id) {
      const db = await database;
      const transaction = db.transaction(RECORDS_STORE, "readonly");
      const request = transaction.objectStore(RECORDS_STORE).get([normalizedOwnerId, collection, id]) as IDBRequest<
        StoredRelationshipRecord | undefined
      >;
      return requestResult<StoredRelationshipRecord | undefined>(request).then((record) => record ?? null);
    },
    async listByCollection(collection) {
      const db = await database;
      const transaction = db.transaction(RECORDS_STORE, "readonly");
      const request = transaction.objectStore(RECORDS_STORE).index(OWNER_INDEX).getAll(normalizedOwnerId) as IDBRequest<
        StoredRelationshipRecord[]
      >;
      return requestResult<StoredRelationshipRecord[]>(request).then((records) =>
        records.filter((record) => record.collection === collection),
      );
    },
    async listByParent(parent) {
      const db = await database;
      const transaction = db.transaction(RECORDS_STORE, "readonly");
      const request = transaction
        .objectStore(RECORDS_STORE)
        .index(OWNER_PARENT_INDEX)
        .getAll([normalizedOwnerId, parent.collection, parent.id]) as IDBRequest<StoredRelationshipRecord[]>;
      return requestResult<StoredRelationshipRecord[]>(request);
    },
    async replaceChildIfParentExists(parent, child, replacementRecord, options) {
      const db = await database;
      const transaction = db.transaction(RECORDS_STORE, "readwrite");
      const store = transaction.objectStore(RECORDS_STORE);
      const parentRecord = await requestResult<StoredRelationshipRecord | undefined>(
        store.get([normalizedOwnerId, parent.collection, parent.id]) as IDBRequest<
          StoredRelationshipRecord | undefined
        >,
      );
      const childRecord = await requestResult<StoredRelationshipRecord | undefined>(
        store.get([normalizedOwnerId, child.collection, child.id]) as IDBRequest<StoredRelationshipRecord | undefined>,
      );
      const valid =
        Boolean(parentRecord) &&
        Boolean(childRecord) &&
        sameReference(childRecord?.parent, parent) &&
        replacementRecord.collection === child.collection &&
        replacementRecord.id === child.id &&
        sameReference(replacementRecord.parent, parent);
      if (valid) {
        const siblings = options?.conflictsWithSibling
          ? await requestResult<StoredRelationshipRecord[]>(
              store.index(OWNER_PARENT_INDEX).getAll([normalizedOwnerId, parent.collection, parent.id]) as IDBRequest<
                StoredRelationshipRecord[]
              >,
            )
          : [];
        const matchingSibling = siblings.find(
          (sibling) => !sameReference(sibling, child) && options?.conflictsWithSibling?.(replacementRecord, sibling),
        );
        if (matchingSibling) {
          store.delete([normalizedOwnerId, child.collection, child.id]);
        } else {
          store.put({ ...replacementRecord, ownerId: normalizedOwnerId });
        }
      }
      await transactionComplete(transaction);
      return valid;
    },
    async removeChildIfParentExists(parent, child) {
      const db = await database;
      const transaction = db.transaction(RECORDS_STORE, "readwrite");
      const store = transaction.objectStore(RECORDS_STORE);
      const parentRecord = await requestResult<StoredRelationshipRecord | undefined>(
        store.get([normalizedOwnerId, parent.collection, parent.id]) as IDBRequest<
          StoredRelationshipRecord | undefined
        >,
      );
      const childRecord = await requestResult<StoredRelationshipRecord | undefined>(
        store.get([normalizedOwnerId, child.collection, child.id]) as IDBRequest<StoredRelationshipRecord | undefined>,
      );
      const valid = Boolean(parentRecord) && Boolean(childRecord) && sameReference(childRecord?.parent, parent);
      if (valid) {
        store.delete([normalizedOwnerId, child.collection, child.id]);
      }
      await transactionComplete(transaction);
      return valid;
    },
    async replaceChildrenIfSourcesExist(parent, sourceRecords, childCollection, replacementRecords, options) {
      const db = await database;
      const transaction = db.transaction(RECORDS_STORE, "readwrite");
      const store = transaction.objectStore(RECORDS_STORE);
      const rootRecord = await requestResult<StoredRelationshipRecord | undefined>(
        store.get([normalizedOwnerId, parent.collection, parent.id]) as IDBRequest<
          StoredRelationshipRecord | undefined
        >,
      );

      let valid = Boolean(rootRecord);
      const sourceRecordValues: StoredRelationshipRecord[] = [];
      if (valid) {
        for (const source of sourceRecords) {
          const sourceRecord = await requestResult<StoredRelationshipRecord | undefined>(
            store.get([normalizedOwnerId, source.collection, source.id]) as IDBRequest<
              StoredRelationshipRecord | undefined
            >,
          );
          if (!sourceRecord || !sameReference(sourceRecord.parent, parent)) {
            valid = false;
            break;
          }
          sourceRecordValues.push(sourceRecord);
        }
      }

      if (valid && (!sourceRecords.length || sourceRecordValues.length !== sourceRecords.length)) {
        valid = false;
      }
      if (
        valid &&
        replacementRecords.some(
          (record) => record.collection !== childCollection || !sameReference(record.parent, parent),
        )
      ) {
        valid = false;
      }

      if (valid) {
        const existingChildren = await requestResult<StoredRelationshipRecord[]>(
          store.index(OWNER_PARENT_INDEX).getAll([normalizedOwnerId, parent.collection, parent.id]) as IDBRequest<
            StoredRelationshipRecord[]
          >,
        );
        const preservedChildren = existingChildren.filter(
          (child) => child.collection === childCollection && options?.preserveChild?.(child),
        );
        for (const child of existingChildren) {
          if (child.collection === childCollection && !preservedChildren.includes(child)) {
            store.delete([normalizedOwnerId, child.collection, child.id]);
          }
        }
        const recordsToWrite = replacementRecords.filter(
          (record) =>
            !preservedChildren.some((preservedChild) => options?.conflictsWithPreservedChild?.(record, preservedChild)),
        );
        for (const record of recordsToWrite) {
          store.put({ ...record, ownerId: normalizedOwnerId });
        }
      }

      await transactionComplete(transaction);
      return valid;
    },
    async deleteCascade(root) {
      const db = await database;
      const transaction = db.transaction(RECORDS_STORE, "readwrite");
      const store = transaction.objectStore(RECORDS_STORE);
      const rootRecord = await requestResult<StoredRelationshipRecord | undefined>(
        store.get([normalizedOwnerId, root.collection, root.id]) as IDBRequest<StoredRelationshipRecord | undefined>,
      );

      if (!rootRecord) {
        throw new RelationshipRecordNotFoundError(root);
      }

      const parentIndex = store.index(OWNER_PARENT_INDEX);
      const pendingRecords = [root];
      const deletedRecords = new Set<string>();

      while (pendingRecords.length > 0) {
        const current = pendingRecords.shift();
        if (!current) {
          continue;
        }

        const currentKey = relationshipRecordKey(current);
        if (deletedRecords.has(currentKey)) {
          continue;
        }
        deletedRecords.add(currentKey);

        const linkedRecords = await requestResult<StoredRelationshipRecord[]>(
          parentIndex.getAll([normalizedOwnerId, current.collection, current.id]) as IDBRequest<
            StoredRelationshipRecord[]
          >,
        );
        pendingRecords.push(...linkedRecords.map(({ collection, id }) => ({ collection, id })));
        store.delete([normalizedOwnerId, current.collection, current.id]);
      }

      await transactionComplete(transaction);
    },
  };
}

function openDatabase(idbFactory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = idbFactory.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const store = request.result.objectStoreNames.contains(RECORDS_STORE)
        ? request.transaction?.objectStore(RECORDS_STORE)
        : request.result.createObjectStore(RECORDS_STORE, {
            keyPath: ["ownerId", "collection", "id"],
          });

      if (!store) {
        throw new Error("Unable to upgrade the relationship-data database.");
      }

      if (!store.indexNames.contains(OWNER_INDEX)) {
        store.createIndex(OWNER_INDEX, "ownerId", { unique: false });
      }
      if (store.indexNames.contains(OWNER_PARENT_INDEX)) {
        store.deleteIndex(OWNER_PARENT_INDEX);
      }
      store.createIndex(OWNER_PARENT_INDEX, ["ownerId", "parent.collection", "parent.id"], { unique: false });
    };
    request.onerror = () => {
      reject(indexedDbError("open the relationship-data database", request.error));
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () => {
      reject(indexedDbError("read relationship data", request.error));
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.onabort = () => {
      reject(indexedDbError("complete the relationship-data transaction", transaction.error));
    };
    transaction.onerror = () => {
      reject(indexedDbError("complete the relationship-data transaction", transaction.error));
    };
    transaction.oncomplete = () => {
      resolve();
    };
  });
}

function indexedDbError(operation: string, error: DOMException | null): Error {
  return new Error(error ? `Unable to ${operation}: ${error.message}` : `Unable to ${operation}.`);
}

function relationshipRecordKey(reference: RelationshipRecordReference): string {
  return `${reference.collection}\u0000${reference.id}`;
}

function sameReference(left: RelationshipRecordReference | undefined, right: RelationshipRecordReference): boolean {
  return left?.collection === right.collection && left.id === right.id;
}
