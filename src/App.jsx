import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { NotificationProvider } from './contexts/NotificationContext';

// CSS를 가장 마지막에 import
import 'react-toastify/dist/ReactToastify.css';

function App() {
  // 테스트용 토스트 알림 함수
  const showTestToast = () => {
    console.log('테스트 토스트 시도');
    toast("테스트 알림입니다!");
  };

  return (
    <div>
      <ToastContainer />
      <Router>
        <NotificationProvider>
          <div>
            <button 
              onClick={showTestToast}
              style={{
                position: 'fixed',
                top: '20px',
                left: '20px',
                zIndex: 1000,
                padding: '10px 20px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              테스트 알림
            </button>
            <Routes>
              {/* 기존 라우트들 */}
            </Routes>
          </div>
        </NotificationProvider>
      </Router>
    </div>
  );
}

export default App;
