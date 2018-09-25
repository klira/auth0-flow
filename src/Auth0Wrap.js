import auth0 from "auth0-js";
const DEFAULT_OPTIONS = {
  redirectUri: `${window.location.origin}/`,
  scope: "openid",
  responseType: "token id_token",
}

const clientFromOpts = opts =>
  new auth0.WebAuth(Object.assign({}, DEFAULT_OPTIONS, opts || {}));

const promiseCB = (success, fail) => (err, res) => {
  if (err) {
    fail(err);
    return;
  }
  success(res);
};

const prom = work =>
  new Promise((success, fail) => {
    work(promiseCB(success, fail));
  });

export default class Auth0Wrap {
  constructor(options) {
    this.auth0 = clientFromOpts(options);
  }
  parseHash(options) {
    return prom(cb => this.auth0.parseHash(options, cb));
  }
  checkSession(options) {
    return prom(cb => this.auth0.checkSession(options, cb));
  }
  authorize(options) {
    return this.auth0.authorize(options);
  }
  logout(options) {
    return this.auth0.logout(options);
  }
}
