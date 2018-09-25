export default class WebPlatform {
  constructor() {}
  boot(auth) {
    auth.onBoot(window.location.hash);
  }

  clearHash() {
    history.replaceState({}, document.title, ".");
  }
}
