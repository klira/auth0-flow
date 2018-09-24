import TokenFSM from "./TokenFSM.js";

const SOME_TOKEN = { some: "token" };
const SOME_ERROR = new Error("foo");

test("Neither error, unauthenticated or authenticated on start on start", () => {
  const tfsm = new TokenFSM();
  expect(tfsm.isError()).toBe(false);
  expect(tfsm.isUnauthenticated()).toBe(false);
  expect(tfsm.isAuthenticated()).toBe(false);
});

test("token is null on start", () => {
  const tfsm = new TokenFSM();
  expect(tfsm.getToken()).toBe(null);
});

test("token is not kept after subsequent errors", () => {
  const tfsm = new TokenFSM();
  tfsm.onToken(SOME_TOKEN);
  tfsm.onError(SOME_ERROR);
  expect(tfsm.getToken()).toBe(null);
});
