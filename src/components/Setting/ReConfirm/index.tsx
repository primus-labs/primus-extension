import React, { useState, useMemo, useEffect } from 'react';
import './index.sass';
import iconInfoColorful from '@/assets/img/iconInfoColorful.svg';
interface SettingProps {
  onCancel: () => void;
  onConfirm: () => void;
}

const Reconfirm: React.FC<SettingProps> = ({ onCancel, onConfirm }) => {
  return (
    <div className="reconfirm">
      <main className="reconfirmMain">
        <img src={iconInfoColorful} alt="" />
        <p className="title">Are you sure to delete?</p>
        <p className="desc">
          To re-connect, you will need to go through the process again.
        </p>
      </main>
      <footer className="reconfirmFooter">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={onConfirm}>Delete</button>
      </footer>
    </div>
  );
};

export default Reconfirm;
