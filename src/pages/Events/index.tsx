import React, { useState, useEffect, memo, useCallback } from 'react';
import './index.sass';
import PTabs from '@/components/PTabs';
import EventsOverview from '@/components/Events/EventsOverview';

const Events = memo(() => {
  const handleChangeTab = useCallback((val: string) => {}, []);
  return (
    <div className="pageDataSourceOverview pagepageTransactionDetailCred">
      <main className="appContent">
        <PTabs onChange={handleChangeTab} value="Cred" />
      </main>
      <EventsOverview />
    </div>
  );
});

export default Events;
