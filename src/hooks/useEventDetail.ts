import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { UserState } from '@/types/store';

type UseEventDetail = (eventName: string) => [any];
const useEventDetail: UseEventDetail = function useEventDetail(eventName) {
  const events = useSelector((state: UserState) => state.events);
  const eventDetail = useMemo(() => {
    return events[eventName];
  }, [eventName, events]);
  return [eventDetail];
};
export default useEventDetail;
