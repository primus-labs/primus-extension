
import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  createHashRouter,
  RouterProvider,
} from "react-router-dom";
import '@/assets/css/global.css';
import routes from '@/router'

const router = createHashRouter(routes);
const container = document.getElementById('app-container');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<React.StrictMode>
  <RouterProvider router={router} />
</React.StrictMode>);
