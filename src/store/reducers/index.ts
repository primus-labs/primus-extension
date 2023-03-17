
// initial state
const initState = {
  padoServicePort: chrome.runtime.connect({name:"padoService"})
}

// reducer
const reducer = function(state = initState, action:any) {
  switch(action.type) {
    default:
      return state
  }
}
export default reducer

// action creator