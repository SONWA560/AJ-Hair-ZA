// Stub Firebase Admin for build purposes
// In production, use proper Firebase Admin initialization

let _db: any = null;

export const getAdminDb = () => {
  if (!_db) {
    console.warn("Firebase Admin not initialized - using stub");
    _db = {
      collection: () => ({
        doc: () => ({
          get: async () => ({ exists: false, data: () => ({}), id: "" }),
          set: async () => {},
          update: async () => {},
          delete: async () => {},
        }),
        add: async () => ({ id: "stub" }),
        get: async () => ({ docs: [] }),
        where: () => ({
          orderBy: () => ({
            get: async () => ({ docs: [] }),
          }),
          get: async () => ({ docs: [] }),
        }),
        orderBy: () => ({
          get: async () => ({ docs: [] }),
        }),
      }),
    };
  }
  return _db;
};

export const getAdminStorage = () => null;
export const getAdminAuth = () => null;
export const createTimestamp = (date?: Date) => date || new Date();
export const createId = () => Math.random().toString(36).substring(2);
