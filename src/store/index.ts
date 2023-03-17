// 使用中间件
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import { composeWithDevTools } from 'redux-devtools-extension'
import rootReducer from './reducers'
const enhancers = applyMiddleware(thunk);
export default createStore(rootReducer, composeWithDevTools(enhancers))