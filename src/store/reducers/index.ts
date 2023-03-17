import {COUNT_ADD, COUNT_MINUS} from '../actionType'
// initial state
const initState = {
  padoServicePort: chrome.runtime.connect({name:"padoService"})
}

// reducer
const reducer = function(state = initState, action:any) {
  switch(action.type) {
    case COUNT_ADD:
      return {
        ...state,
      }
    case COUNT_MINUS:
      return {
        ...state,
      }
    default:
      return state
  }
}
export default reducer

// action creator
export function countAdd() {
  return { type: COUNT_ADD }
}
export function countMinus() {
  return { type: COUNT_MINUS }
}