import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PButton from '@/newComponents/PButton';
import './index.scss';

const DataSourceItem = memo(() => {
  const questionMap = {
    1: {
      id: 1,
      question: 'Does the connected wallet address matter?',
      answer:
        'The wallet address connected in the top right corner serves two key functions: it records your task complete process and determines your eligibility for events checking. Changing the connected wallet address will also impact the tasks process displayed in the task list. Make sure you connect the same wallet address here and on the Linea event page.',
      expand: true,
    },
    2: {
      id: 2,
      question: 'What should I do if the attestation process fails? ',
      answer:
        'As the attestation is under MPC-TLS process, it often depends on your internet condition. A quick.solution is to connect with a new Wifi network/connection, or change to a different VPN node, if possible. If you get an error message with an error code, feel free to contact us in the Discord #help channel.',
      expand: true,
    },
    3: {
      id: 3,
      question:
        'What does the “not meet the uniqueness requirement” error message mean?',
      answer:
        "Due to Linea’s requirements, each Binance KYC'ed account should be linked to only one wallet address. If you encounter this error message, it could mean either:Your Binance account is already linked to a different wallet address.Your currently connected wallet address is already linked to another Binance account through attestation.",
      expand: true,
    },
    4: {
      id: 4,
      question: 'Can I join this event with a different wallet address? ',
      answer:
        'Yes, you can join this event with different wallet address. When you change the connected wallet above the task list, the task status will reset and you can go through it with the newly connected wallet address. Remember, you also need to connect the new address on the BAS attestation alliance campaign page to earn your BAS XPS with this new address.',
      expand: true,
    },
    5: {
      id: 5,
      question: 'How are PADO points for this event counted?',
      answer:
        'For PADO points, it is counted based on your PADO extension account, which means PADO points will not be double counted when you switch wallet address.',
      expand: true,
    },
  };
  const [questionList, setQuestionList] = useState<any[]>(
    Object.values(questionMap)
  );
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id') as string;

  const handleExpand = useCallback((i) => {
    const { expand } = questionMap[i.id];
    questionMap[i.id].expand = !expand;
    setQuestionList(Object.values(questionMap));
  }, []);
  return (
    <div className="qsList">
      <h3 className="Frequently asked questions?"></h3>
      <ul className="qss">
        {questionList.map((i, k) => {
          return (
            <li className="qs" key={k}>
              <p className="question">
                <span>{i.question}</span>
                <PButton
                  type="icon"
                  icon={
                    <i
                      className={`iconfont ${
                        i.expand ? 'icon-iconMinus' : 'icon-Add'
                      } `}
                    ></i>
                  }
                  onClick={() => handleExpand(i)}
                />
              </p>
              {i.expand && <p className="answer">{i.answer}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
});

export default DataSourceItem;
