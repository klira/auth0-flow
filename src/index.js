import WebPlatform from "./WebPlatform.js";
import AuthManager from "./AuthManager.js";
import Auth0Wrap from "./Auth0Wrap.js";
import TokenFSM from "./TokenFSM.js";

class Auth {
  constructor(options) {
    this.auth0 = new Auth0Wrap({});
    this.platform = new WebPlatform(options || {});
    this.tokenFSM = new TokenFSM();
    this.authMgr = null;
  }

  getAuthManager() {
    if (!this.authMgr) {
      const authMgr = new AuthManager(this.tokenFSM, this.auth0, this.platform);
      this.authMgr = authMgr;
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
    const willRedirect = await this.getAuthManager().authorizeIfNotLoggedIn();
    if (willRedirect) {
      return;
    }
    const token = await this.authMgr.getToken();
    fn(token);
  }
}


export default Auth
