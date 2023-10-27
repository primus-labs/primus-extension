import React, { useState, useEffect, memo, useCallback } from 'react';

import EventsOverview from '@/components/Events/EventsOverview';

const Events = memo(() => {
  return (
    <div className="pageDataSourceOverview pagepageTransactionDetailCred pagepageEvents">
      <EventsOverview />
    </div>
  );
});

export default Events;
