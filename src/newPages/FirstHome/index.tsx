import React, { memo } from 'react';
import open1 from '@/assets/newImg/home/open1.svg';
import open2 from '@/assets/newImg/home/open2.svg';
import open3 from '@/assets/newImg/home/open3.svg';
import open4 from '@/assets/newImg/home/open4.svg';
import './index.scss';
interface PBackProps {
  onBack: () => void;
}
const Home: React.FC<PBackProps> = memo(({ onBack }) => {
  return (
    <div className="pageFirstHome">
      <img src={open1} alt="" />
    </div>
  );
});

export default Home;
