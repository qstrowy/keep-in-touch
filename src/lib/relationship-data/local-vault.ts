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
    async listByParent(parent) {
      const db = await database;
      const transaction = db.transaction(RECORDS_STORE, "readonly");
      const request = transaction
        .objectStore(RECORDS_STORE)
        .index(OWNER_PARENT_INDEX)
        .getAll([normalizedOwnerId, parent.collection, parent.id]) as IDBRequest<StoredRelationshipRecord[]>;
      return requestResult<StoredRelationshipRecord[]>(request);
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
