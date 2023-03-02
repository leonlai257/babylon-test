export function equal(a: any, b: any) {
  if (!(typeof a === typeof b)) {
    return false;
  }

  if (isPrimitive(a)) {
    return a === b;
  }

  const keys1 = Object.keys(a);
  const keys2 = Object.keys(b);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (let key of keys1) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

export function isPrimitive(a: any) {
  return typeof a != "object" && typeof a != "function";
}
