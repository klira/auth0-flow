import EventEmitter from "event-emitter-es6";

const TOKEN_FSM_INITIAL = "initial";
const TOKEN_FSM_NOAUTH = "noauth";
const TOKEN_FSM_TOKEN = "token";
const TOKEN_FSM_ERROR = "error";

export default class TokenFSM extends EventEmitter {
  constructor() {
    super({ emitDelay: 1 });
    this._setState(TOKEN_FSM_INITIAL);
  }
  _sendEvent(oldState, newState, oldData, newData) {
    if (oldState === TOKEN_FSM_INITIAL && newState === TOKEN_FSM_ERROR) {
      this.emit("fail", newData, oldData);
      this.emit("failOnBoot", newData, oldData);
      this.emit("nonInitial");
    } else if (oldState === TOKEN_FSM_TOKEN && newState === TOKEN_FSM_ERROR) {
      this.emit("fail", newData, oldData);
      this.emit("failAfterLoad", newData, oldData);
      this.emit("nonInitial");
    } else if (newState === TOKEN_FSM_TOKEN) {
      this.emit("authenticated", newData);
      this.emit("nonInitial");
    } else if (newState === TOKEN_FSM_NOAUTH) {
      this.emit("noAuth");
      this.emit("nonInitial");
    }
  }
  _setState(name, data = null) {
    const oldState = this.stateName;
    const oldData = this.stateData;

    this.stateName = name;
    this.stateData = data;
    this._sendEvent(oldState, name, oldData, data);
  }
  onNoAuthFound() {
    if (this.stateName !== TOKEN_FSM_INITIAL) {
      return;
    }
    this._setState(TOKEN_FSM_NOAUTH);
  }
  onToken(tokens) {
    this._setState(TOKEN_FSM_TOKEN, tokens);
  }
  onError(error) {
    this._setState(TOKEN_FSM_ERROR, error);
  }
  getToken() {
    if (this.isNotAuthenticated()) {
      return null;
    }
    return this.stateData;
  }
  getTokenWhenNonInitial() {
    return this.waitForNonInitialState().then(() => this.getToken());
  }
  onceF(name) {
    return new Promise(resolve => {
      this.once(name, x => resolve(x));
    });
  }
  waitForNonInitialState() {
    if (this.stateName !== TOKEN_FSM_INITIAL) {
      return Promise.resolve(true);
    }
    return this.onceF("nonInitial").then(_ => true);
  }
  isError() {
    return this.stateName === TOKEN_FSM_ERROR;
  }
  isUnauthenticated() {
    return this.stateName === TOKEN_FSM_NOAUTH;
  }
  isAuthenticated() {
    return this.stateName === TOKEN_FSM_TOKEN;
  }
  isNotAuthenticated() {
    return !this.isAuthenticated();
  }
}
