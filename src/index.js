import WebPlatform from "./src/WebPlatform.js";
import AuthManager from "./src/AuthManager.js";

class Auth {
  constructor() {
    this.platform = new WebPlatform();
    this.authMgr = null;
  }

  getAuthManager() {
    if (!this.authMgr) {
      this.authMgr = new AuthManager({}, this.platform);
    }
    return this.authMgr;
  }

  init() {
    // AuthMgr starts the auth flow when created
    this.getAuthManager();
  }

  async whenAuthenticated(fn) {
    const willRedirect = await this.authMgr.authorizeIfNotLoggedIn();
    if (willRedirect) {
      return;
    }
    const token = await this.authMgr.getToken();
    fn(token);
  }
}

export default new Auth();
