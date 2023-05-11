
import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  createHashRouter,
  RouterProvider,
} from "react-router-dom";
import '@/assets/css/global.css';
import routes from '@/router'
import { Provider } from 'react-redux'
import store from '@/store/index'

const router = createHashRouter(routes);
const container = document.getElementById('app-container');
const root = createRoot(container); // createRoot(container!) if you use TypeScript


console.log('Page initialization')

// TODO React.strict
root.render(<>
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
</>);
