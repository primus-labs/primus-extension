import React, { useState, useEffect, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EventsOverview from '@/components/Events/EventsOverview';

const Events = memo(() => {
  const navigate = useNavigate();
  const myInitFn = useCallback(async () => {
    const { userInfo } = await chrome.storage.local.get(['userInfo']);
    if (!userInfo) {
      navigate('/');
    }
  }, [navigate]);
  useEffect(() => {
    myInitFn();
  }, [myInitFn]);
  return (
    <div className="pageDataSourceOverview pagepageTransactionDetailCred pagepageEvents">
      <EventsOverview />
    </div>
  );
});

export default Events;
