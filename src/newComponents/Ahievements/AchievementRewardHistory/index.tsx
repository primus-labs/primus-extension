import React, { memo, useCallback, useEffect, useState } from 'react';
import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import './index.scss';
import { getAchievementClaimed } from '@/services/api/achievements';
import { Pagination } from 'antd';
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
    const [totalCount, setTotalCount] = useState(1);
    const [totalPage, setTotalPage] = useState(1);

    const getAchieveRecords = useCallback(async (page) => {
      const res = await getAchievementClaimed(size, page);
      const { rc, result } = res;
      if (rc === 0) {
        setTotalPage(result.pageCount);
        setTotalCount(result.totalCount);
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
      return achievements.map((item: AchievementRecords, index) => {
        return <tr>
          <td style={{ width: '64px' }}>+{item.score}</td>
          <td>{item.task}</td>
          <td style={{ textAlign: 'right' }}>{item.date}</td>
        </tr>;
      });
    };


    useEffect(() => {
      getAchieveRecords(current);
    }, []);

    const handlePageChange = (page: number) => {
      setCurrent(page);
      getAchieveRecords(page);
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
            <div className={"pageComponent"}>
              <Pagination style={{float:'right'}}
                          total={totalCount}
                          onChange={handlePageChange}
                          showSizeChanger={false}
                          pageSize={size}
              /></div>
            {/*<PageSelect totalPage={totalPage} onClick={handlePageChange} current={current}/>*/}
          </main>

        </div>
      </PMask>
    );
  },
);

export default Nav;
