import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import './index.sass';
const ErrorBoundary = () => {
  const error = useRouteError();
  console.log('ErrorBoundary ', error);
  return (
    <div className="ErrorBoundary">
      <p>Ooops! Something went wrong</p>
      <button
        onClick={() => {
          window.location.reload();
        }}
        className="refreshBtn"
      >
        Refresh
      </button>
    </div>
  );
};
export default ErrorBoundary;
