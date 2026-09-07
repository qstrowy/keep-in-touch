import {
  MissingRelationshipOwnerError,
  RelationshipVaultOperationError,
  RelationshipVaultUnavailableError,
  type RelationshipVault,
  type RelationshipVaultOptions,
  type StoredRelationshipRecord,
} from "./types";

const DATABASE_NAME = "keep-in-touch-relationship-data";
const DATABASE_VERSION = 1;
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
    async listByParent(parentId) {
      const db = await database;
      const transaction = db.transaction(RECORDS_STORE, "readonly");
      const request = transaction
        .objectStore(RECORDS_STORE)
        .index(OWNER_PARENT_INDEX)
        .getAll([normalizedOwnerId, parentId]) as IDBRequest<StoredRelationshipRecord[]>;
      return requestResult<StoredRelationshipRecord[]>(request);
    },
    deleteCascade() {
      return Promise.reject(new RelationshipVaultOperationError("cascade deletion"));
    },
  };
}

function openDatabase(idbFactory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = idbFactory.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(RECORDS_STORE, {
        keyPath: ["ownerId", "collection", "id"],
      });
      store.createIndex(OWNER_INDEX, "ownerId", { unique: false });
      store.createIndex(OWNER_PARENT_INDEX, ["ownerId", "parentId"], { unique: false });
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
