import React, { useState, useEffect, memo, useCallback } from 'react';
import './index.sass';
import PTabs from '@/components/PTabs';
import EventsOverview from '@/components/Events/EventsOverview';

const Events = memo(() => {
  return (
    <div className="pageDataSourceOverview pagepageTransactionDetailCred pagepageEvents">
      <main className="appContent">
      </main>
      <EventsOverview />
    </div>
  );
});

export default Events;
