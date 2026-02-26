// Stub Firebase Auth for build purposes

export async function createAdminUser(email: string, password: string) {
  console.warn("Firebase Auth not initialized - createAdminUser stub");
  return null;
}

export async function verifyAdminToken(idToken: string) {
  console.warn("Firebase Auth not initialized - verifyAdminToken stub");
  return false;
}

export async function getUserByUid(uid: string) {
  console.warn("Firebase Auth not initialized - getUserByUid stub");
  return null;
}

export async function getUserByEmail(email: string) {
  console.warn("Firebase Auth not initialized - getUserByEmail stub");
  return null;
}
