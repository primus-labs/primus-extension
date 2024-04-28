import React, { memo, useCallback, useEffect, useState } from 'react';
import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import './index.scss';
import { getAchievementClaimed } from '@/services/api/achievements';
import { LoadingOutlined } from '@ant-design/icons';
import loading from '@/assets/newImg/achievements/loading.svg';
import { Pagination, Spin, Table } from 'antd';
import { EVENTNAMEMAP } from '@/config/events';

interface PButtonProps {
  // sourceName: string;
  onClose: () => void;
}

type AchievementRecords = {
  score: string;
  task: string;
  date: string;
  ext: any;
  recordTaskIdentifier: string;
};

const Nav: React.FC<PButtonProps> = memo(({ onClose }) => {
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
      const achievements = result.items.map((e) => {
        return {
          score: e.score,
          task: e.recordDesc,
          date: e.recordDate,
          ext: e.ext,
          recordTaskIdentifier: e.recordTaskIdentifier,
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
            {isLoading && (
              <div>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '64px', textAlign: 'left' }}>
                        Point
                      </th>
                      <th style={{ textAlign: 'left' }}>Source</th>
                      <th style={{ textAlign: 'right' }}>Time</th>
                    </tr>
                  </thead>
                </table>
                <div
                  style={{
                    width: '480px',
                    height: '435px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <LoadingOutlined
                    style={{
                      fontSize: 24,
                    }}
                    src={loading}
                  ></LoadingOutlined>
                </div>
              </div>
            )}
            {!isLoading && (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '64px', textAlign: 'left' }}>Point</th>
                    <th style={{ textAlign: 'left' }}>Source</th>
                    <th style={{ textAlign: 'right' }}>Time (UTC)</th>
                  </tr>
                </thead>
                <tbody>
                  {achievements.map((item: AchievementRecords, index) => {
                    return (
                      <tr>
                        <td style={{ width: '64px', textAlign: 'left' }}>
                          +{item.score}
                        </td>
                        <td
                          style={{
                            textAlign: 'left',
                            maxWidth: '240px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.recordTaskIdentifier ===
                          'CAMPAIGN_PARTICIPATION'
                            ? `${item.task} : ${EVENTNAMEMAP[item.ext]}`
                            : item.task}
                        </td>

                        <td
                          style={{
                            textAlign: 'right',
                            fontFamily: 'IBM Plex Mono',
                            fontWeight: '400',
                            fontSize: '14px',
                          }}
                        >
                          <span>{item.date}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className={'pageComponent'}>
            <Pagination
              style={{ float: 'right' }}
              total={totalCount}
              onChange={handlePageChange}
              showSizeChanger={false}
              pageSize={size}
            />
          </div>
          {/*<PageSelect totalPage={totalPage} onClick={handlePageChange} current={current}/>*/}
        </main>
      </div>
    </PMask>
  );
});

export default Nav;
