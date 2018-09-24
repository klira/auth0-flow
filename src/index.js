import WebPlatform from "./WebPlatform.js";
import AuthManager from "./AuthManager.js";
import Auth0Wrap from "./Auth0Wrap.js";
import TokenFSM from "./src/TokenFSM.js";

class Auth {
  constructor() {
    this.auth0 = new Auth0Wrap({});
    this.platform = new WebPlatform();
    this.tokenFSM = new TokenFSM();
    this.authMgr = null;
  }

  getAuthManager() {
    if (!this.authMgr) {
      const authMgr = new AuthManager(this.tokenFSM, this.auth0, this.platform);
      // Boot the platform ensuring  that authMgr is fed.
      this.platform.boot(authMgr);
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
