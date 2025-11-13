export const initBrowserSettings = () => {
  Object.defineProperty(navigator, "language", { get: () => "de-DE" });
  Object.defineProperty(navigator, "languages", { get: () => ["de-DE"] });
};
