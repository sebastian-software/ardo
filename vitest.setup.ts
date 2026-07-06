if (typeof Element !== "undefined" && Element.prototype.scrollIntoView == null) {
  Element.prototype.scrollIntoView = function scrollIntoView() {}
}
