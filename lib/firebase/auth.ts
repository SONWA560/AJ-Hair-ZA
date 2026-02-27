import { getAdminAuth } from "./admin";

// Authentication utilities
export async function createAdminUser(email: string, password: string) {
  try {
    const adminAuth = getAdminAuth();
    const user = await adminAuth.createUser({
      email,
      password,
      emailVerified: true,
    });

    // Set admin custom claim
    await adminAuth.setCustomUserClaims(user.uid, {
      admin: true,
      role: "super_admin",
    });

    return user;
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}

export async function verifyAdminToken(idToken: string) {
  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.admin === true;
  } catch (error) {
    console.error("Error verifying admin token:", error);
    return false;
  }
}

export async function getUserByUid(uid: string) {
  try {
    const adminAuth = getAdminAuth();
    return await adminAuth.getUser(uid);
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const adminAuth = getAdminAuth();
    return await adminAuth.getUserByEmail(email);
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}
