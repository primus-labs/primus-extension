import React from 'react';
import Home from '@/pages/Home/Home.jsx';
import DataSourceOverview from '@/pages/DataSourceOverview/index.tsx';
import DataSourceDetail from '@/pages/DataSourceDetail/index.tsx';
import Lock from '@/pages/Lock/index.jsx';
import Layout from '@/pages/Layout/index.tsx';
const router = [
  {
    path: "/",
    element: <Layout/>,
    children: [
      {
        index: true,
        element: <Home/>,
      },
      {
        path: "datas",
        element: <DataSourceOverview></DataSourceOverview>,
      },
      {
        path: "dataDetail",
        element: <DataSourceDetail></DataSourceDetail>,
      },
      {
        path: "lock",
        element: <Lock/>,
      },
    ]
  },
  
];

export default router;