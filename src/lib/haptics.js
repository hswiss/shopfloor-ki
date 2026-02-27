export function tap() {
  if (navigator.vibrate) navigator.vibrate(10);
}

export function success() {
  if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
}
