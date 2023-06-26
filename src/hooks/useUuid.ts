import React from 'react';
import { v4 as uuidv4 } from 'uuid';

const pid = () => {
  const id = uuidv4();
  console.log('pid', id);
  return id;
};
export default pid;
