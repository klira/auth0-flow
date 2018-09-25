const authTokensRE = /id_token|access_token|code/;

export default class AuthManager {
  constructor(tokenFSM, auth0, platform) {
    this.tokenFSM = tokenFSM;
    this.auth0 = auth0;
    this.platform = platform;
  }

  //tokenPromiseToFSM() {}

  onBoot(hash, storedTokens) {
    return this.auth0
      .parseHash({ hash })
      .then(x => {
        if (x == null) {
          return this.auth0.renewAuth({});
          this.platform.clearHash();
        } else {
          return x;
        }
      })
      .then(
        res => {
          if (!res) {
            this.tokenFSM.onNoAuthFound();
            return null;
          } else {
            this.tokenFSM.onToken(res);
            return null;
          }
        },
        err => this.tokenFSM.onError(err)
      );
  }

  getToken() {
    return this.tokenFSM.getTokenWhenNonInitial().then(val => {
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
    } else {
      this.auth0.authorize();
      return true;
    }
  }
  logout() {
    this.auth0.logout();
  }
}
