const authTokensRE = /id_token|access_token|code/;

export default class AuthManager {
  constructor(tokenFSM, auth0, platform) {
    this.tokenFSM = tokenFSM;
    this.auth0 = auth0;
    this.platform = platform;
  }

  //tokenPromiseToFSM() {}

  onBoot(hash, storedTokens) {
    if (hash && hash.match(authTokensRE)) {
      return this.onLocationHashChange(hash);
    } else if (storedTokens !== null) {
      return this.onPossiblyStaleToken(storedTokens);
    } else {
      this.tokenFSM.onNoAuthFound();
      return Promise.resolve(null);
    }
  }

  onLocationHashChange(hash) {
    const containsAuth = hash.match(authTokensRE);
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
      .renewAuth({})
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
