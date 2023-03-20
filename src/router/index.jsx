import React from 'react';
import Home from '@/pages/Home/Home.jsx';
import DataSourceOverview from '@/pages/DataSourceOverview/index.tsx';
const router = [
  {
    path: "/",
    element: <Home></Home>,
  },
  {
    path: "/datas",
    element: <DataSourceOverview></DataSourceOverview>,
  },
];
export default router;