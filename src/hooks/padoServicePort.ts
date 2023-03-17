import React, {useState, useEffect} from 'react';

const usePort = () => {
  const [padoServicePort, setPadoServicePort] = useState<any>()
  
  useEffect(() => {
    const activePort = chrome.runtime.connect({name:"padoService"})
    setPadoServicePort(activePort)
    console.log('usePadoServicePort', padoServicePort)
    return () => {
      activePort.disconnect()
    }
  }, [])
  return [padoServicePort]
};

export default usePort;
