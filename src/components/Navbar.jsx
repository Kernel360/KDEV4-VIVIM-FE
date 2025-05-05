import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../hooks/useAuth';

const Navbar = ({ activeMenuItem, handleMenuClick }) => {
  const navigate = useNavigate();
  const { isAdmin, user, logout } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const notificationPanelRef = useRef(null);
  const { notifications, getFilteredNotifications, showReadNotifications, setShowReadNotifications, markAsRead, disconnectSSE, markAllAsRead } = useNotifications();

  // 로그인 한 사용자의 상세 정보 가져오기
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const { data } = await axiosInstance.get(
          `${API_ENDPOINTS.USERS}/${user.id}`
        );
        setUserInfo(data.data);
      } catch (e) {
        console.error('사용자 정보 조회 실패:', e);
      }
    })();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setShowNotifications(false);

    // 알림 타입에 따른 페이지 이동
    const type = notification.type;
    const typeId = notification.typeId;

    // DELETED 타입은 무시
    if (type.endsWith('_DELETED')) {
      return;
    }

    // 타입에 따른 페이지 이동
    if (type.startsWith('PROJECT_')) {
      navigate(`/project/${typeId}`);
    } else if (type.startsWith('PROPOSAL_')) {
      navigate(`/approval/${typeId}`);
    } else if (type.startsWith('DECISION_')) {
      navigate(`/approval/${typeId}`);
    }
  };

  const menuItems = [
    { name: '대시보드',        path: isAdmin ? '/dashboard-admin' : '/dashboard',  showFor: 'all' },
    { name: '프로젝트 관리',  path: isAdmin ? '/admin-projects'  : '/project-list', showFor: 'all' },
    { name: '회사 관리',      path: '/company-management',  showFor: 'admin' },
    { name: '사용자 관리',    path: '/user-management',     showFor: 'admin' },
    { name: '관리자 문의',    path: '/admin-inquiry-list',  showFor: 'all' },
    { name: '히스토리',      path: '/audit-log',           showFor: 'admin' },
  ];

  // isAdmin이거나 showFor==='all'인 메뉴만 노출
  const filteredMenu = menuItems.filter(
    item => item.showFor === 'all' || (isAdmin && item.showFor === 'admin')
  );

  const handleLogout = async () => {
    try {
      console.log('로그아웃 시작', {
        timestamp: new Date().toISOString()
      });

      const refreshToken = localStorage.getItem('refreshToken');
      await axiosInstance.post(API_ENDPOINTS.AUTH_LOGOUT, { refreshToken });

      // SSE 연결 종료
      console.log('SSE 연결 종료 시도', {
        timestamp: new Date().toISOString()
      });
      disconnectSSE();

      // localStorage에서 토큰 제거
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      console.log('로그아웃 완료, 로그인 페이지로 이동', {
        timestamp: new Date().toISOString()
      });

      // 로그인 페이지로 이동
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      
      // SSE 연결 종료
      console.log('로그아웃 실패 시 SSE 연결 종료 시도', {
        timestamp: new Date().toISOString(),
        error: error.message
      });
      disconnectSSE();

      // 에러가 발생해도 토큰은 제거하고 로그인 페이지로 이동
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      navigate('/');
    }
  };

  const onClickItem = item => {
    handleMenuClick?.(item.name);
    navigate(item.path);
    setIsMobileMenuOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = showReadNotifications
    ? notifications.filter(n => n.read)
    : notifications.filter(n => !n.read);

  return (
    <NavbarContainer>
      <NavContent>
        <LeftSection>
          <LogoContainer onClick={() => navigate(isAdmin ? '/dashboard-admin' : '/dashboard')}>
            <LogoImage src="/logo_only.png" alt="Vivim Logo" />
          </LogoContainer>

          <HamburgerMenu onClick={() => setIsMobileMenuOpen(v => !v)}>
            <span/><span/><span/>
          </HamburgerMenu>

          <NavList $isMobile={isMobileMenuOpen}>
            {filteredMenu.map(item => (
              <NavItem
                key={item.name}
                $active={activeMenuItem === item.name}
                onClick={() => onClickItem(item)}
              >
                {item.name}
              </NavItem>
            ))}
          </NavList>
        </LeftSection>

        <UserSection>
          <NotificationWrapper ref={notificationPanelRef}>
            <NotificationIcon className="notification-icon" onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) {
                setShowReadNotifications(false);
              }
            }}>
              <BellImage src="/bell.png" alt="notifications" />
              {unreadCount > 0 && (
                <NotificationBadge>
                  {unreadCount}
                </NotificationBadge>
              )}
            </NotificationIcon>
            {showNotifications && (
              <NotificationPanel>
                <NotificationHeader>
                  <NotificationTitle>알림</NotificationTitle>
                  <NotificationFilters>
                    <FilterButton
                      active={!showReadNotifications}
                      onClick={() => setShowReadNotifications(false)}
                    >
                      안읽은 알림 ({notifications.filter(n => !n.read).length})
                    </FilterButton>
                    <FilterButton
                      active={showReadNotifications}
                      onClick={() => setShowReadNotifications(true)}
                    >
                      읽은 알림 ({notifications.filter(n => n.read).length})
                    </FilterButton>
                  </NotificationFilters>
                </NotificationHeader>
                <NotificationList>
                  {!showReadNotifications && (
                    <ActionButton onClick={markAllAsRead}>
                      모두 읽음
                    </ActionButton>
                  )}
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        unread={!notification.read}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <NotificationContent>
                          <NotificationTypeIcon>
                            {notification.type.startsWith('PROJECT_') && (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                  <line x1="3" y1="9" x2="21" y2="9"></line>
                                  <line x1="9" y1="21" x2="9" y2="9"></line>
                                </svg>
                                프로젝트
                              </>
                            )}
                            {notification.type.startsWith('PROPOSAL_') && (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                  <line x1="16" y1="13" x2="8" y2="13"></line>
                                  <line x1="16" y1="17" x2="8" y2="17"></line>
                                  <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                승인요청
                              </>
                            )}
                            {notification.type.startsWith('DECISION_') && (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                승인응답
                              </>
                            )}
                          </NotificationTypeIcon>
                          <NotificationText>
                            {notification.content}
                          </NotificationText>
                          <NotificationTime>
                            {new Date(notification.createdAt).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </NotificationTime>
                        </NotificationContent>
                      </NotificationItem>
                    ))
                  ) : (
                    <NotificationEmpty>
                      {showReadNotifications ? '읽은 알림이 없습니다' : '안읽은 알림이 없습니다'}
                    </NotificationEmpty>
                  )}
                </NotificationList>
              </NotificationPanel>
            )}
          </NotificationWrapper>
          {userInfo && (
            <UserInfo>
              <UserName onClick={() => navigate(`/user-edit/${userInfo.id}`)}>
                {userInfo.name}
              </UserName>
              <CompanyInfo>
                {userInfo.companyName} ·{' '}
                {{
                  CUSTOMER: '고객사',
                  DEVELOPER: '개발사',
                  ADMIN: '관리자'
                }[userInfo.companyRole]}
              </CompanyInfo>
            </UserInfo>
          )}
          <LogoutButton onClick={logout}>
            로그아웃
          </LogoutButton>
        </UserSection>
      </NavContent>
    </NavbarContainer>
  );
};

export default Navbar;


const HamburgerMenu = styled.div`
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 24px;
  height: 20px;
  cursor: pointer;
  z-index: 1001;

  span {
    width: 100%;
    height: 2px;
    background: #2E7D32;
    transition: all 0.3s;
  }

  @media (max-width: 768px) {
    display: flex;
  }
`;

const NavbarContainer = styled.nav`
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
`;

const NavContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  height: 64px;
  max-width: 1200px;
  margin: 0 auto;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const LogoContainer = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
`;

const LogoImage = styled.img`
  height: 40px;
  width: auto;
`;

const NavList = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 1.5rem;

  @media (max-width: 768px) {
    display: ${props => props.isMobile ? 'flex' : 'none'};
    flex-direction: column;
    position: absolute;
    top: 64px;
    left: 0;
    right: 0;
    background-color: white;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const NavItem = styled.li`
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  color: ${props => props.active ? '#2E7D32' : '#666'};
  font-weight: ${props => props.active ? '600' : '400'};
  transition: all 0.2s;

  &:hover {
    background-color: #f5f5f5;
    color: #2E7D32;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

// Update NavItem
const NavItem = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${props => props.$active ? '#000' : '#666'};
  cursor: pointer;
  padding: 8px 0;
  position: relative;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #000;
    opacity: ${props => props.$active ? '1' : '0'};
    transition: opacity 0.2s ease;
  }

  &:hover {
    color: #000;
  }
`;
const NotificationWrapper = styled.div`
  position: relative;
`;

const NotificationIcon = styled.div`
  cursor: pointer;
  position: relative;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #ff4444;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
`;

const BellImage = styled.img`
  width: 24px;
  height: 24px;
`;

const NotificationPanel = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

const NotificationHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const NotificationTitle = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: #333;
`;

const NotificationFilters = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const FilterButton = styled.button`
  padding: 0.25rem 0.75rem;
  border: 1px solid ${props => props.active ? '#2E7D32' : '#ddd'};
  border-radius: 4px;
  background-color: ${props => props.active ? '#2E7D32' : 'white'};
  color: ${props => props.active ? 'white' : '#666'};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.active ? '#2E7D32' : '#f5f5f5'};
  }
`;

const NotificationList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const NotificationItem = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  background-color: ${props => props.unread ? '#f8f9fa' : 'white'};
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const NotificationContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const NotificationText = styled.div`
  font-size: 0.875rem;
  color: #666;
  line-height: 1.4;
  margin-top: 4px;
`;

const NotificationTime = styled.div`
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.25rem;
`;

const NotificationEmpty = styled.div`
  padding: 2rem;
  text-align: center;
  color: #666;
  font-size: 0.875rem;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const UserName = styled.div`
  font-weight: 600;
  cursor: pointer;
  color: #333;

  &:hover {
    color: #2E7D32;
  }
`;

const CompanyInfo = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const LogoutButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border: none;
  border-radius: 4px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #e0e0e0;
    color: #333;
  }
`;

// Add these new styled components
const BellImage = styled.img`
  width: 20px;
  height: 20px;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  filter: invert(77%) sepia(61%) saturate(1232%) hue-rotate(358deg) brightness(180%) contrast(105%);

  &:hover {
    opacity: 1;
  }
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 0.5rem;
  border: none;
  background-color: #f5f5f5;
  color: #666;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #eee;

  &:hover {
    background-color: #e0e0e0;
    color: #333;
  }
`;

const NotificationTypeIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  color: #333;
  font-size: 0.875rem;
  font-weight: 600;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

export default Navbar;