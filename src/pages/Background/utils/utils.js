export function isJSONString(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}
export function encodeFormData(data) {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
}

export function isObject(obj) {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}