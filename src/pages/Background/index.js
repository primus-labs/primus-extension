import Module from './hello'
Module['onRuntimeInitialized'] = () => {
  Module.ccall(
      "myFunction", // name of C function
      null, // return type
      null, // argument types
      null // arguments
  )
};
console.log('This is the background page.');
console.log('Put the background scripts here.');
