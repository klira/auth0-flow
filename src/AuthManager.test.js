import AuthManager from "./AuthManager.js";
import Auth0Wrap from "./Auth0Wrap.js";
import WebPlatform from "./WebPlatform.js";
import TokenFSM from "./TokenFSM.js";
jest.mock("./Auth0Wrap.js");
jest.mock("./WebPlatform.js");
jest.mock("./TokenFSM.js");

beforeEach(() => {
  Auth0Wrap.mockClear();
  WebPlatform.mockClear();
  TokenFSM.mockClear();
});

test("Logout calls auth0 and then platform for a URL", async () => {
  const platform = new WebPlatform();
  const auth = new Auth0Wrap();
  const am = new AuthManager(new TokenFSM(), auth, platform);
  await am.logout();
  expect(auth.logout).toHaveBeenCalled();
});

test("Calls noAuth when booting without state or hash", async () => {
  const tokenFSM = new TokenFSM();
  const auth0 = new Auth0Wrap();
  auth0.parseHash.mockReturnValue(Promise.resolve(null));
  auth0.renewAuth.mockReturnValue(Promise.resolve(null));
  const am = new AuthManager(tokenFSM, auth0, new WebPlatform());
  await am.onBoot(null, null);
  expect(tokenFSM.onNoAuthFound).toHaveBeenCalledWith();
});

test("Calls noAuth when booting without state and w/ unrelated hash", async () => {
  const tokenFSM = new TokenFSM();
  const auth0 = new Auth0Wrap();
  auth0.parseHash.mockReturnValue(Promise.resolve(null));
  auth0.renewAuth.mockReturnValue(Promise.resolve(null));
  const am = new AuthManager(tokenFSM, auth0, new WebPlatform());
  await am.onBoot("unrelated_hash", null);
  expect(tokenFSM.onNoAuthFound).toHaveBeenCalledWith();
});

test("Attempts to parse hash and store the result w/ related hash", async () => {
  const tokenFSM = new TokenFSM();
  const auth0 = new Auth0Wrap();
  const EXAMPLE_HASH = "id_token=123";
  const SOME_TOK = { some: "tok" };
  auth0.parseHash.mockReturnValue(Promise.resolve(SOME_TOK));
  const am = new AuthManager(tokenFSM, auth0, new WebPlatform());
  await am.onBoot(EXAMPLE_HASH, null);
  expect(auth0.parseHash).toHaveBeenCalledWith({ hash: EXAMPLE_HASH });
  expect(tokenFSM.onToken).toHaveBeenCalledWith(SOME_TOK);
});

test("When parsing the hash fails yield error", async () => {
  const tokenFSM = new TokenFSM();
  const auth0 = new Auth0Wrap();
  const EXAMPLE_HASH = "id_token=123";
  const SOME_ERR = new Error("rhee");
  auth0.parseHash.mockReturnValue(Promise.reject(SOME_ERR));
  const am = new AuthManager(tokenFSM, auth0, new WebPlatform());
  await am.onBoot(EXAMPLE_HASH, null);
  expect(auth0.parseHash).toHaveBeenCalledWith({ hash: EXAMPLE_HASH });
  expect(tokenFSM.onError).toHaveBeenCalledWith(SOME_ERR);
});

test("Hash has preceedence over toks", async () => {
  const tokenFSM = new TokenFSM();
  const auth0 = new Auth0Wrap();
  const EXAMPLE_HASH = "id_token=123";
  const EXAMPLE_TOKENS = { example: "tokens" };
  const PARSED_HASH = { parsed: "hash" };
  auth0.parseHash.mockReturnValue(Promise.resolve(PARSED_HASH));
  const am = new AuthManager(tokenFSM, auth0, new WebPlatform());
  await am.onBoot(EXAMPLE_HASH, EXAMPLE_TOKENS);
  expect(auth0.parseHash).toHaveBeenCalledWith({ hash: EXAMPLE_HASH });
  expect(tokenFSM.onToken).toHaveBeenCalledWith(PARSED_HASH);
});

test("Refreshes the token when loading from storage", async () => {
  const tokenFSM = new TokenFSM();
  const auth0 = new Auth0Wrap();
  const EXAMPLE_TOKENS = {};
  const SOME_TOKS = { some: "tokeninhos" };
  const FRESH_TOKS = { fresh: "toks" };
  auth0.parseHash.mockReturnValue(Promise.resolve(null));
  auth0.renewAuth.mockReturnValue(Promise.resolve(FRESH_TOKS));
  const am = new AuthManager(tokenFSM, auth0, new WebPlatform());
  await am.onBoot(null, SOME_TOKS);
  expect(auth0.renewAuth).toHaveBeenCalled();
  expect(tokenFSM.onToken).toHaveBeenCalledWith(FRESH_TOKS);
});

test("getToken throws on error", () => {
  const tokenFSM = new TokenFSM();
  tokenFSM.getTokenWhenNonInitial.mockReturnValue(Promise.resolve(null));
  tokenFSM.isError.mockReturnValue(true);
  const am = new AuthManager(tokenFSM, new Auth0Wrap(), new WebPlatform());
  expect(am.getToken()).rejects.toThrow();
});

test("getToken throws on unauthenticated", () => {
  const tokenFSM = new TokenFSM();
  tokenFSM.getTokenWhenNonInitial.mockReturnValue(Promise.resolve(null));
  tokenFSM.isUnauthenticated.mockReturnValue(true);
  const am = new AuthManager(tokenFSM, new Auth0Wrap(), new WebPlatform());
  return expect(am.getToken()).rejects.toThrow();
});

test("getToken throws on unknown state", () => {
  const tokenFSM = new TokenFSM();
  tokenFSM.getTokenWhenNonInitial.mockReturnValue(Promise.resolve(null));
  const am = new AuthManager(tokenFSM, new Auth0Wrap(), new WebPlatform());
  return expect(am.getToken()).rejects.toThrow();
});

test("getToken returns token if nonError", async () => {
  const tokenFSM = new TokenFSM();
  const TOKEN = { another: "token" };
  tokenFSM.getTokenWhenNonInitial.mockReturnValue(Promise.resolve(TOKEN));
  const am = new AuthManager(tokenFSM, new Auth0Wrap(), new WebPlatform());
  expect(await am.getToken()).toBe(TOKEN);
});

test("authorizeIfNotLoggedIn does nothing when authenticated", async () => {
  const tokenFSM = new TokenFSM();
  tokenFSM.isAuthenticated.mockReturnValue(true);
  const platform = new WebPlatform();
  const am = new AuthManager(tokenFSM, new Auth0Wrap(), platform);
  expect(await am.authorizeIfNotLoggedIn()).toBe(false);
});

test("authorizeWhenNotLogged in authorizes when unauthenticated", async () => {
  const tokenFSM = new TokenFSM();
  tokenFSM.isAuthenticated.mockReturnValue(false);
  const auth = new Auth0Wrap();
  const platform = new WebPlatform();
  const am = new AuthManager(tokenFSM, auth, platform);
  expect(await am.authorizeIfNotLoggedIn()).toBe(true);
  expect(auth.authorize).toHaveBeenCalled();
});
