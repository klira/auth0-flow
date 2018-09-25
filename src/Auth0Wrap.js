const DEFAULT_OPTIONS = {
  domain: process.env["AUTH0_DOMAIN"] || null,
  clientID: process.env["AUTH0_CLIENT_ID"] || null,
  domain: "zensum.eu.auth0.com",
  redirectUri: `${window.location.origin}/`,
  audience: "https://zensum.eu.auth0.com/userinfo",
  responseType: "token id_token",
  scope: "openid"
};

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
