import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import type { UserState } from '@/types/store';
dayjs.extend(utc);
type UseEventDetail = (eventName: string) => any[];
const useEventDetail: UseEventDetail = function useEventDetail(eventName) {
  const events = useSelector((state: UserState) => state.events);
  const eventDetail = useMemo(() => {
    return events[eventName];
  }, [eventName, events]);

  const BASEventPeriod = useMemo(() => {
    if (eventDetail?.startTime) {
      const { startTime, endTime } = eventDetail;
      return {
        startTime,
        endTime,
      };
    } else {
      return {};
    }
  }, [eventDetail]);
  const formatPeriod = useMemo(() => {
    const { startTime, endTime } = BASEventPeriod;
    const s = dayjs.utc(+startTime).format('YYYY.MM.DD-h-a');
    const e = dayjs.utc(+endTime).format('YYYY.MM.DD-h-a');

    const sArr = s.split('-');
    const eArr = e.split('-');
    return `${sArr[0]} ~ ${eArr[0]}`;
  }, [BASEventPeriod]);

  const eventActiveFlag = useMemo(() => {
    const { startTime, endTime } = BASEventPeriod;
    const isUnStart = dayjs().isBefore(dayjs(+startTime));
    const isActive =
      dayjs().isAfter(dayjs(+startTime)) && dayjs().isBefore(dayjs(+endTime));
    const isEnd = dayjs().isAfter(dayjs(+endTime));
    const isLongTerm = eventDetail?.ext?.isLongTermEvent;
    if (isUnStart) {
      return 0;
    }
    if (isActive) {
      return 1;
    }
    if (isEnd && !isLongTerm) {
      return 2;
    }
    if (isLongTerm) {
      return 3;
    }

    return 0;
  }, [BASEventPeriod, eventDetail?.ext?.isLongTermEvent]);

  return [eventDetail, BASEventPeriod, formatPeriod, eventActiveFlag];
};
export default useEventDetail;
