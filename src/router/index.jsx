import React from 'react';
import Home from '@/pages/Home/Home.jsx';
// import DataSourceOverview from '@/pages/DataSourceOverview/index.tsx';
import DataSourceOverview from '@/newPages/DataSourceOverview/index.tsx';
import DataSourceDetail from '@/pages/DataSourceDetail/index.tsx';
import Lock from '@/pages/Lock/index.jsx';
import Layout from '@/components/Layout/Layout/index.tsx';
import ErrorBoundary from '@/components/ErrorBoundary';
import Cred from '@/pages/Cred/index.tsx';
import Events from '@/pages/Events';
import TransactionDetail from '@/pages/Transaction/TransactionDetail';

const router = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'datas',
        element: <DataSourceOverview />,
      },
      {
        path: 'dataDetail',
        element: <DataSourceDetail />,
      },
      {
        path: 'lock',
        element: <Lock />,
      },
      {
        path: 'cred',
        element: <Cred />,
      },
      {
        path: 'events',
        element: <Events />,
      },
    ],
  },
  {
    path: '/transactionDetail',
    element: <TransactionDetail />,
  },
];

export default router;