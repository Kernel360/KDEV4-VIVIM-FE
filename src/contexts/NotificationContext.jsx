import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { API_ENDPOINTS } from '../config/api';
import CustomNotification from '../components/CustomNotification';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications는 NotificationProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showReadNotifications, setShowReadNotifications] = useState(true);
  const [activeNotification, setActiveNotification] = useState(null);
  
  const isInitializedRef = useRef(false);
  const isConnectingRef = useRef(false);
  const controllerRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // 읽지 않은 알림 개수 계산
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // 커스텀 알림 표시 함수
  const showNotification = (notification) => {
    console.log('🔔 알림 수신:', notification);

    if (!notification.title && !notification.content) {
      console.log('⚠️ 알림 내용이 비어있습니다');
      return;
    }

    // 알림 아이콘의 위치를 찾아서 알림 위치 계산
    const notificationIcon = document.querySelector('.notification-icon');
    if (notificationIcon) {
      const rect = notificationIcon.getBoundingClientRect();
      const notificationElement = document.querySelector('.custom-notification');
      if (notificationElement) {
        notificationElement.style.top = `${rect.bottom + 10}px`;
        notificationElement.style.right = `${window.innerWidth - rect.right}px`;
      }
    }

    setActiveNotification(notification);
    
    // 5초 후 자동으로 알림 닫기
    setTimeout(() => {
      setActiveNotification(null);
    }, 5000);
  };

  // 알림 닫기 함수
  const closeNotification = () => {
    setActiveNotification(null);
  };

  // SSE 연결 함수
  const connectSSE = useCallback(async (token) => {
    if (isConnectingRef.current || isConnected) {
      console.log('SSE 이미 연결 중이거나 연결됨');
      return;
    }

    try {
      isConnectingRef.current = true;
      console.log('SSE 연결 시도...');

      if (controllerRef.current) {
        console.log('이전 SSE 연결 종료');
        controllerRef.current.abort();
      }

      const controller = new AbortController();
      controllerRef.current = controller;

      await fetchEventSource(API_ENDPOINTS.NOTIFICATIONS.SUBSCRIBE, {
        headers: {
          'Authorization': token
        },
        signal: controller.signal,
        method: 'GET',
        keepalive: true,
        openWhenHidden: true,
        onopen(response) {
          console.log('SSE onopen 호출:', {
            status: response.status,
            contentType: response.headers.get('content-type')
          });

          if (response.ok && response.headers.get('content-type') === 'text/event-stream') {
            console.log('SSE 연결 성공!');
            setIsConnected(true);
            isConnectingRef.current = false;
            isInitializedRef.current = true;
            return;
          }
          console.error('SSE 연결 실패');
          throw new Error('SSE 연결 실패');
        },
        onmessage(event) {
          console.log('SSE 메시지 수신:', event.data);

          if (event.data === "connected") {
            console.log('SSE 연결 확인 메시지 수신');
            return;
          }

          try {
            const notification = JSON.parse(event.data);
            console.log('알림 데이터 파싱 성공:', notification);
            setNotifications(prev => [notification, ...prev]);
            showNotification(notification);
          } catch (error) {
            console.error('알림 데이터 처리 실패:', error);
          }
        },
        onerror(error) {
          console.error('SSE 에러:', error);
          setIsConnected(false);
          isConnectingRef.current = false;
          controller.abort();
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            const token = localStorage.getItem('token');
            if (token && !isInitializedRef.current) {
              console.log('SSE 재연결 시도...');
              connectSSE(token);
            }
          }, 5000);
        },
        onclose() {
          console.log('SSE 연결 종료');
          setIsConnected(false);
          isConnectingRef.current = false;
        }
      });
    } catch (error) {
      console.error('SSE 연결 에러:', error);
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, [isConnected]);

  // 알림 목록 가져오기
  const fetchNotifications = async (token) => {
    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS.LIST, {
        headers: {
          'Authorization': token
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('알림 목록 조회 실패:', error);
    }
  };

  // 초기화
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // 초기 알림 목록 가져오기
    const fetchInitialNotifications = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.NOTIFICATIONS.LIST, {
          headers: {
            'Authorization': token
          }
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error('초기 알림 목록 조회 실패:', error);
      }
    };

    fetchInitialNotifications();

    // SSE 연결 설정
    const eventSource = new EventSource(API_ENDPOINTS.NOTIFICATIONS.SUBSCRIBE, {
      headers: {
        'Authorization': token
      }
    });

    const initialize = async () => {
      if (token && !isInitializedRef.current && !isConnectingRef.current) {
        // SSE 연결
        await connectSSE(token);
      }
    };

    initialize();

    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setIsConnected(false);
      isInitializedRef.current = false;
      isConnectingRef.current = false;
    };
  }, []);

  // 알림 읽음 상태 변경
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.NOTIFICATIONS.LIST}/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isRead: true })
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('알림 읽음 상태 변경 실패:', error);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS.READ_ALL, {
        method: 'PATCH',
        headers: {
          'Authorization': token
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
      }
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  // 알림 상태에 따른 필터링
  const getFilteredNotifications = () => {
    return notifications.filter(notification => showReadNotifications || !notification.read);
  };

  // SSE 연결 해제 함수
  const disconnectSSE = useCallback(() => {
    console.log('SSE 연결 해제 시도');
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
    isInitializedRef.current = false;
    isConnectingRef.current = false;
  }, []);

  const value = {
    notifications,
    isConnected,
    unreadCount,
    markAsRead,
    markAllAsRead,
    getFilteredNotifications,
    showReadNotifications,
    setShowReadNotifications,
    disconnectSSE
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {activeNotification && (
        <CustomNotification
          notification={activeNotification}
          onClose={closeNotification}
        />
      )}
    </NotificationContext.Provider>
  );
}; 