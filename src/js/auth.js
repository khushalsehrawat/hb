import { storage } from "./storage.js";

export const auth = {
  isAuthed() {
    return Boolean(storage.get("accessToken"));
  },
  getUser() {
    return storage.get("user");
  },
  setSession(authResponse) {
    storage.set("accessToken", authResponse.accessToken);
    storage.set("refreshToken", authResponse.refreshToken);
    storage.set("user", {
      userId: authResponse.userId,
      fullName: authResponse.fullName,
      email: authResponse.email,
      role: authResponse.role,
    });
  },
  logout() {
    storage.clearAll();
  },
  requireAuth() {
    if (!auth.isAuthed()) {
      window.location.href = "../auth/login.html";
      return false;
    }
    return true;
  },
  requireGuest() {
    if (auth.isAuthed()) {
      window.location.href = "../app/dashboard.html";
      return false;
    }
    return true;
  },
};

