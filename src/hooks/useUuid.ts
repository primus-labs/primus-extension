import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const useUuid = () => {
  const [uid, setUid] = useState<string>();
  console.log('useUuid', uid);
  const setUuid: () => void = useCallback(() => {
    const id = uuidv4();
    setUid(id);
  }, []);
  return [uid, setUuid];
};
export default useUuid;
