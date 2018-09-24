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

test("Waiting for nonInitialState works", async () => {
  const tfsm = new TokenFSM();
  const p = tfsm.waitForNonInitialState();
  tfsm.onToken(SOME_TOKEN);
  expect(await p).toBe(true);
});
