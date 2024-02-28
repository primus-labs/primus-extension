import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import OrderItem from '@/newComponents/OrderItem';
import iconDone from '@/assets/newImg/layout/iconDone.svg';
import type { UserState } from '@/types/store';
import './index.scss';
import { getAchievementClaimed } from '@/services/api/achievements';
import PageSelect from '@/newComponents/Ahievements/PageSelect';

interface PButtonProps {
  // sourceName: string;
  onClose: () => void;
}

type AchievementRecords = {
  score: string;
  task: string;
  date: string;
};

const Nav: React.FC<PButtonProps> = memo(
  ({ onClose }) => {
    const size = 10;
    const [achievements, setAchievements] = useState([]);
    const [current, setCurrent] = useState(1);
    const [totalPage, setTotalPage] = useState(1);

    const getAchieveRecords = useCallback(async () => {
      const res = await getAchievementClaimed(size, current);
      const { rc, result } = res;
      if (rc === 0) {
        setTotalPage(result.pageCount);
        const achievements = result.items.map(e => {
          return {
            score: e.score,
            task: e.recordDesc,
            date: e.recordDate,
          };
        });
        setAchievements(achievements);

      }
    }, []);

    const AchievementRecords = () => {
      return achievements.map((item:AchievementRecords, index)  => {
        return <tr>
          <td style={{width: '64px'}}>+{item.score}</td>
          <td>{item.task}</td>
          <td style={{ textAlign: 'right' }}>{item.date}</td>
        </tr>;
      });
    };


    useEffect(() => {
      getAchieveRecords();
    }, []);

    const handlePageChange = (page: number) => {
      console.log(page)
    };
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    return (
      <PMask>
        <div className="pDialog2 reword-history">
          <PClose onClick={onClose} />
          <main>
            <header>
              <h1>Rewards History</h1>
            </header>
            <table>
              <th>Point</th>
              <th>Source</th>
              <th style={{ textAlign: 'right' }}>Time</th>
              <AchievementRecords />
            </table>
            <PageSelect totalPage={totalPage} onClick={handlePageChange} current={current}/>
          </main>

        </div>
      </PMask>
    );
  },
);

export default Nav;
