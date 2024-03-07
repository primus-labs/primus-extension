import React, { memo, useCallback, useEffect, useState } from 'react';
import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import './index.scss';
import { getAchievementClaimed } from '@/services/api/achievements';
import loading from '@/assets/newImg/achievements/loading.svg';
import { Pagination, Spin, Table } from 'antd';

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
    const [isLoading, setIsLoading] = useState(true);


    const getAchieveRecords = useCallback(async (page) => {
      setIsLoading(true);
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
      setIsLoading(false);
    }, []);

    const columns = [
      {
        title: 'Point',
        dataIndex: 'point',
      },
      {
        title: 'Source',
        dataIndex: 'source',
      },
      {
        title: 'Time',
        dataIndex: 'time',
      },
    ];

    useEffect(() => {
      getAchieveRecords(current);
    }, []);


    const handlePageChange = (page: number) => {
      setCurrent(page);
      getAchieveRecords(page);
    };
    return (
      <PMask>
        <div className="pDialog2 reword-history">
          <main>
            <header>
              <h1>Rewards History</h1>
            </header>
            <PClose onClick={onClose} />

            <div className={'tableDiv'}>
              <table>
                <tr>
                  <td style={{ width: '64px', textAlign: 'left' }}>Point</td>
                  <td style={{ textAlign: 'left' }}>Source</td>
                  <td style={{ textAlign: 'right' }}>Time</td>
                </tr>
                {achievements.map((item: AchievementRecords, index) => {
                  return <tr>
                    <td style={{ width: '64px', textAlign: 'left' }}>+{item.score}</td>
                    <td style={{ textAlign: 'left' }}>{item.task}</td>
                    <td style={{ textAlign: 'right' }}>{item.date}</td>
                  </tr>;
                })}
              </table>
            </div>
            {/*<Table*/}
            {/*  columns={columns}*/}
            {/*  dataSource={achievements.map((item: AchievementRecords, index) => {*/}
            {/*    return {*/}
            {/*      key:index,*/}
            {/*      point: item.score,*/}
            {/*      source: item.task,*/}
            {/*      time: item.date,*/}
            {/*    }*/}
            {/*  })}*/}
            {/*/>*/}
            <div className={'pageComponent'}>
              <Pagination style={{ float: 'right' }}
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
