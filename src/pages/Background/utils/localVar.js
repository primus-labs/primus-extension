export const changeFieldsObjFn = (fields, op, key, value) => {
  if (op === 'delete') {
    delete fields[key];
  } else if (op === 'add') {
    fields[key] = value;
  } else if (op === 'update') {
    fields[key] = value;
  } else if (op === 'reset') {
    fields = {};
  }
};
