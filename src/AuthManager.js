import auth0 from "auth0-js";
import TokenFSM from "./src/TokenFSM.js";
import Auth0Wrap from "./src/Auth0Wrap.js";

const authTokensRE = /id_token|access_token|code/;

export default class AuthManager {
  constructor(options, platform) {
    this.tokenFSM = new TokenFSM();
    this.auth0 = Auth0Wrap(options);
    this.platform = platform;
    platform.boot(this);
  }

  onBoot(hash, storedTokens) {
    if (authTokensRE.match(hash)) {
      return this.onLocationHashChange(hash);
    } else if (storedTokens !== null) {
      return this.onPossiblyStaleToken(storedTokens);
    } else {
      this.tokenFSM.onNoAuthFound();
      return Promise.resolve(null);
    }
  }

  onLocationHashChange(hash) {
    const containsAuth = authTokensRE.match(hash);
    if (!containsAuth) {
      return Promise.resolve(null);
    }
    return this.auth0
      .parseHash(hash)
      .then(
        res => this.tokenFSM.onToken(res),
        err => this.tokenFSM.onError(err)
      );
    // TODO: Clear hash for to avoid shoulder surfing attacks
  }

  onPossiblyStaleToken(tokens) {
    return this.auth0
      .refreshToken(tokens)
      .then(
        res => this.tokenFSM.onToken(res),
        err => this.tokenFSM.onError(err)
      );
  }

  getToken() {
    this.tokenFSM
      .then()
      .waitForNonInitialState(_ => this.tokenFSM.getToken())
      .then(val => {
        if (!val) {
          if (this.tokenFSM.isError()) {
            return Promise.reject(new Error("Authentication failed"));
          } else if (this.tokenFSM.isUnauthenticated()) {
            return Promise.reject(new Error("The user is not authenticated"));
          } else {
            return Promise.reject(
              new Error("Unknown FSM state, this should not happen")
            );
          }
        } else {
          return val;
        }
      });
  }
  async authorizeIfNotLoggedIn() {
    await this.tokenFSM.waitForNonInitialState();
    if (this.tokenFSM.isAuthenticated()) {
      return false;
    } else if (this.tokenFSM.isError() || this.tokenFSM.isUnauthenticated()) {
      this.platform.redirect(this.auth0.buildAuthorizeUrl());
      return true;
    } else {
      throw new Error("Unknown FSM state, this should not happen");
    }
  }
  logout() {
    this.platform.redirect(this.auth0.buildLogoutUrl());
  }
}
