import React, { useState, useEffect } from 'react';
import './CustomNotification.css';

const CustomNotification = ({ notification, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // 4.7초 후에 닫기 시작 (0.3초의 애니메이션 시간을 고려)
    const timer = setTimeout(() => {
      setIsClosing(true);
    }, 4700);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    // 애니메이션이 완료된 후 실제로 컴포넌트를 제거
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div className={`custom-notification ${isClosing ? 'closing' : ''}`}>
      <div className="notification-content">
        <h4>{notification.title}</h4>
        <p>{notification.content}</p>
      </div>
      <button className="close-button" onClick={handleClose}>
        ✕
      </button>
    </div>
  );
};

export default CustomNotification; 