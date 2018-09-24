import TokenFSM from "./TokenFSM.js";

const SOME_TOKEN = { some: "token" };
const SOME_OTHER_TOKEN = { some: ["other", "token"] };
const SOME_ERROR = new Error("foo");

test("Neither error, unauthenticated or authenticated on start on start", () => {
  const tfsm = new TokenFSM();
  expect(tfsm.isError()).toBe(false);
  expect(tfsm.isUnauthenticated()).toBe(false);
  expect(tfsm.isAuthenticated()).toBe(false);
});

//
// Token
//

test("token is null on start", () => {
  const tfsm = new TokenFSM();
  expect(tfsm.getToken()).toBe(null);
});

test("Setting token works", () => {
  const tfsm = new TokenFSM();
  tfsm.onToken(SOME_TOKEN);
  expect(tfsm.getToken()).toBe(SOME_TOKEN);
  expect(tfsm.isAuthenticated()).toBe(true);
});

test("Going from error to token works", () => {
  const tfsm = new TokenFSM();
  tfsm.onError(SOME_ERROR);
  tfsm.onToken(SOME_TOKEN);
  expect(tfsm.getToken()).toBe(SOME_TOKEN);
  expect(tfsm.isAuthenticated()).toBe(true);
});

test("Going from token to token updates the token", () => {
  const tfsm = new TokenFSM();
  tfsm.onToken(SOME_TOKEN);
  tfsm.onToken(SOME_OTHER_TOKEN);
  expect(tfsm.getToken()).toBe(SOME_OTHER_TOKEN);
});

//
// Error
//

test("Setting error works", () => {
  const tfsm = new TokenFSM();
  tfsm.onError(SOME_ERROR);
  expect(tfsm.isError()).toBe(true);
});

test("token is not kept after subsequent errors", () => {
  const tfsm = new TokenFSM();
  tfsm.onToken(SOME_TOKEN);
  tfsm.onError(SOME_ERROR);
  expect(tfsm.getToken()).toBe(null);
  expect(tfsm.isError()).toBe(true);
});

//
// No auth
//
test("No auth is not accepted in error", () => {
  const tfsm = new TokenFSM();
  tfsm.onError(SOME_ERROR);
  tfsm.onNoAuthFound();
  expect(tfsm.isError()).toBe(true);
  expect(tfsm.isUnauthenticated()).toBe(false);
});

test("No auth is not accepted in token", () => {
  const tfsm = new TokenFSM();
  tfsm.onToken(SOME_TOKEN);
  tfsm.onNoAuthFound();
  expect(tfsm.isAuthenticated()).toBe(true);
  expect(tfsm.isUnauthenticated()).toBe(false);
});

test("No auth is accepted in initial", () => {
  const tfsm = new TokenFSM();
  tfsm.onNoAuthFound();
  expect(tfsm.isUnauthenticated()).toBe(true);
});

// waiting

test("Waiting for nonInitialState on token", async () => {
  const tfsm = new TokenFSM();
  const p = tfsm.waitForNonInitialState();
  tfsm.onToken(SOME_TOKEN);
  expect(await p).toBe(true);
});

test("Waiting for nonInitialState on error", async () => {
  const tfsm = new TokenFSM();
  const p = tfsm.waitForNonInitialState();
  tfsm.onError(SOME_ERROR);
  expect(await p).toBe(true);
});

test("Waiting for nonInitialState on no-auth", async () => {
  const tfsm = new TokenFSM();
  const p = tfsm.waitForNonInitialState();
  tfsm.onNoAuthFound();
  expect(await p).toBe(true);
});

test("Waiting for nonInitialState after token", async () => {
  const tfsm = new TokenFSM();
  tfsm.onToken(SOME_TOKEN);
  const p = tfsm.waitForNonInitialState();
  expect(await p).toBe(true);
});

//
// Get Token after nonInitial
//
test("GetTokenWhenNonInitial delegates as appropriate", async () => {
  const tfsm = new TokenFSM();
  const TOKEN = { a: "token" };
  tfsm.waitForNonInitialState = jest.fn();
  tfsm.waitForNonInitialState.mockReturnValue(Promise.resolve());
  tfsm.getToken = jest.fn();
  tfsm.getToken.mockReturnValue(TOKEN);

  const returnedToken = await tfsm.getTokenWhenNonInitial();
  expect(returnedToken).toBe(TOKEN);
  expect(tfsm.waitForNonInitialState).toBeCalledWith();
  expect(tfsm.getToken).toBeCalledWith();
  tfsm.getToken;
});

//
// Emit
//

test("Initial fails emits failOnBoot, fail, nonInitial", async () => {
  const tfsm = new TokenFSM();
  const p = tfsm.onceF("failOnBoot");
  const p2 = tfsm.onceF("fail");
  const p3 = tfsm.onceF("nonInitial");
  tfsm.onError(SOME_ERROR);
  expect(await p).toBe(SOME_ERROR);
  expect(await p2).toBe(SOME_ERROR);
  expect(await p3).toBe(undefined);
});

test("Subsequent fails emits failAfterLoad, fail, nonInitial", async () => {
  const tfsm = new TokenFSM();
  tfsm.onToken(SOME_TOKEN);
  const p = tfsm.onceF("failAfterLoad");
  const p2 = tfsm.onceF("fail");
  const p3 = tfsm.onceF("nonInitial");
  tfsm.onError(SOME_ERROR);
  expect(await p).toBe(SOME_ERROR);
  expect(await p2).toBe(SOME_ERROR);
  expect(await p3).toBe(undefined);
});

test("Token emits authenticated,nonInitial", async () => {
  const tfsm = new TokenFSM();
  const p = tfsm.onceF("authenticated");
  const p2 = tfsm.onceF("nonInitial");
  tfsm.onToken(SOME_TOKEN);
  expect(await p).toBe(SOME_TOKEN);
  expect(await p2).toBe(undefined);
});

test("noAuth emits no noAuth,nonInitial", async () => {
  const tfsm = new TokenFSM();
  const p = tfsm.onceF("noAuth");
  const p2 = tfsm.onceF("nonInitial");
  tfsm.onNoAuthFound();
  expect(await p).toBe(undefined);
  expect(await p2).toBe(undefined);
});
