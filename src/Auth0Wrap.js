const DEFAULT_OPTIONS = {
  domain: Process.env["AUTH0_DOMAIN"] || null,
  clientID: Process.env["AUTH0_CLIENT_ID"] || null,
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
    this.buildAuthorizeUrl = this.auth0.buildAuthorizeUrl.bind(this.auth0);
  }
  parseHash(options) {
    return prom(cb => this.auth0.parseHash(options, cb));
  }
  renewAuth(options) {
    return prom(cb => this.auth0.renewAuth(options, cb));
  }
  buildAuthorizeUrl(options) {
    return this.auth0.buildAuthorizeUrl(options);
  }
}
