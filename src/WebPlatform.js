import { local } from "store";

const STORAGE_KEY = "io.klira.auth0-flow/tokens";

export default class WebPlatform {
  constructor() {}
  boot(auth) {
    const hash = window.location.hash;
    const storedValue = local.get(STORAGE_KEY);
    this.auth.onBoot(hash, storedValue);
  }
  persistState(val) {
    local.set(STORAGE_KEY, val);
  }
  clearState() {
    local.remove(STORAGE_KEY);
  }
  redirect(destination) {
    window.location.href = destination;
  }
}
