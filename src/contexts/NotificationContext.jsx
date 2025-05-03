import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { API_ENDPOINTS } from '../constants/api';

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
  
  const isInitializedRef = useRef(false);
  const isConnectingRef = useRef(false);
  const controllerRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // 읽지 않은 알림 개수 계산
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // 초기 알림 목록 가져오기
  const fetchInitialNotifications = useCallback(async (token) => {
    if (isInitializedRef.current) return;
    
    try {
      console.log('초기 알림 목록 조회 중...');
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS.LIST, {
        headers: {
          'Authorization': token
        }
      });
      
      if (!response.ok) throw new Error('알림 목록 조회 실패');
      
      const data = await response.json();
      console.log('초기 알림 목록:', data);
      setNotifications(data || []);
      isInitializedRef.current = true;
    } catch (error) {
      console.error('알림 목록 조회 실패:', error);
    }
  }, []);

  // 초기화 및 정리
  useEffect(() => {
    const initialize = async () => {
      const token = localStorage.getItem('token');
      if (token && !isInitializedRef.current && !isConnectingRef.current) {
        console.log('NotificationProvider 마운트: SSE 연결 시도');
        await fetchInitialNotifications(token);
        await connectSSE(token);
      }
    };

    initialize();

    return () => {
      if (controllerRef.current) {
        console.log('NotificationProvider 언마운트: SSE 연결 종료');
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

  // SSE 연결 함수
  const connectSSE = useCallback(async (token) => {
    if (isConnectingRef.current || isConnected) {
      console.log('SSE 이미 연결 중이거나 연결됨');
      return;
    }

    try {
      isConnectingRef.current = true;

      if (controllerRef.current) {
        console.log('이전 SSE 연결 종료');
        controllerRef.current.abort();
      }

      const controller = new AbortController();
      controllerRef.current = controller;

      console.log('SSE 연결 시도...');
      await fetchEventSource(API_ENDPOINTS.NOTIFICATIONS.SUBSCRIBE, {
        headers: {
          'Authorization': token
        },
        signal: controller.signal,
        method: 'GET',
        keepalive: true,
        openWhenHidden: true,
        onopen(response) {
          if (response.ok && response.headers.get('content-type') === 'text/event-stream') {
            console.log('✅ SSE 연결 성공!', {
              timestamp: new Date().toISOString(),
              status: response.status
            });
            setIsConnected(true);
            isConnectingRef.current = false;
            isInitializedRef.current = true;
            return;
          }
          throw new Error('SSE 연결 실패');
        },
        onmessage(event) {
          if (event.data === "connected") {
            console.log('SSE 연결 메시지 수신 - 연결 유지 중...');
            return;
          }

          try {
            const newNotification = JSON.parse(event.data);
            console.log('새 알림 수신:', newNotification);
            setNotifications(prev => [newNotification, ...prev]);
          } catch (error) {
            console.error('알림 파싱 실패:', error);
          }
        },
        onerror(error) {
          console.error('SSE 에러 발생:', error);
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
          console.log('SSE 연결 종료됨');
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

  // SSE 연결 종료 함수
  const disconnectSSE = () => {
    if (controllerRef.current) {
      console.log('SSE 연결 종료 중...');
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
    console.log('SSE 연결이 종료되었습니다.');
  };

  // 알림 읽음 상태 변경
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.NOTIFICATIONS.LIST}/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': token
        }
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
      const response = await fetch(`${API_ENDPOINTS.NOTIFICATIONS.LIST}/read-all`, {
        method: 'PUT',
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
  const getFilteredNotifications = (showRead = true) => {
    return notifications.filter(notification => showRead || !notification.read);
  };

  const value = {
    notifications,
    isConnected,
    unreadCount,
    markAsRead,
    markAllAsRead,
    getFilteredNotifications,
    disconnectSSE
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 