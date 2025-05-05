import React, { useState } from 'react';
import { FaBell } from 'react-icons/fa';
import './Notification.css';

const Notification = () => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = 3; // 더미 데이터

  // 더미 알림 데이터
  const dummyNotification = {
    title: "새로운 알림",
    content: "새로운 메시지가 도착했습니다!"
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="notification-container">
      <div className="notification-icon" onClick={toggleDropdown}>
        <FaBell />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </div>

      {/* 현재 알림 표시 */}
      <div className="current-notification">
        <div className="notification-content">
          <h4>{dummyNotification.title}</h4>
          <p>{dummyNotification.content}</p>
        </div>
      </div>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>알림</h3>
            <div className="notification-actions">
              <button>모두 읽음</button>
              <button>읽은 알림 숨기기</button>
            </div>
          </div>
          <div className="notification-list">
            <div className="notification-item unread">
              <h4>새로운 알림 1</h4>
              <p>새로운 메시지가 도착했습니다!</p>
              <span className="notification-time">방금 전</span>
            </div>
            <div className="notification-item unread">
              <h4>새로운 알림 2</h4>
              <p>새로운 업데이트가 있습니다.</p>
              <span className="notification-time">5분 전</span>
            </div>
            <div className="notification-item unread">
              <h4>새로운 알림 3</h4>
              <p>시스템 점검이 예정되어 있습니다.</p>
              <span className="notification-time">10분 전</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification; 