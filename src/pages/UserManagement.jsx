import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../hooks/useAuth';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { API_ENDPOINTS } from '../config/api';
import MainContent from '../components/common/MainContent';
import Select from '../components/common/Select';
import Pagination from '../components/common/Pagination';
import ConfirmModal from '../components/common/ConfirmModal';
import { ActionBadge } from '../components/common/Badge';

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: -0.02em;
  transition: all 0.15s ease;
  background: ${props => {
    switch (props.role) {
      case 'ADMIN': return '#E2E8F0';
      case 'DEVELOPER': return '#E0F2FE';
      case 'CUSTOMER': return '#F0FDF4';
      default: return '#F1F5F9';
    }
  }};
  color: ${props => {
    switch (props.role) {
      case 'ADMIN': return '#475569';
      case 'DEVELOPER': return '#0369A1';
      case 'CUSTOMER': return '#15803D';
      default: return '#64748B';
    }
  }};

  &::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    margin-right: 6px;
    background: currentColor;
  }
`;

const TableCell = styled.td`
  padding: 16px 24px;
  font-size: 14px;
  color: #1e293b;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
  white-space: ${props => props.$nowrap ? 'nowrap' : 'normal'};
`;

const TableHeaderCell = styled.th`
  padding: 16px 24px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  background: white;
  border-bottom: 1px solid #e2e8f0;
`;

const TableRow = styled.tr`
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f8fafc;
  }
`;

const SearchCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
`;

const SearchSection = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: nowrap;
  margin-bottom: 24px;
  gap: 0;
`;

const SearchRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: nowrap;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  width: 120px;
  min-width: 0;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  &::placeholder {
    color: #94a3b8;
  }
  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  &:focus {
    outline: none;
    border-color: #2E7D32;
    box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.15);
  }
`;

const SearchCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #f8fafc;
  }
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: #2E7D32;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  letter-spacing: -0.01em;

  &::before {
    content: '';
    display: block;
    width: 3px;
    height: 20px;
    background: #2E7D32;
    border-radius: 1.5px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #64748b;
`;

const UsersTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-top: 24px;
`;

const ActionButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  white-space: nowrap;
`;

const UserManagement = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [companies, setCompanies] = useState([]);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    phone: '',
    companyId: '',
    companyRole: '',
    isDeleted: false
  });
  const itemsPerPage = 10;
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.companyRole !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }
    fetchCompanies();
    fetchUsers();
  }, [currentPage, user, authLoading]);

  const fetchCompanies = async () => {
    try {
      const { data } = await axiosInstance.get(API_ENDPOINTS.COMPANIES, {
        withCredentials: true
      });
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  };

  const fetchUsers = async (customFilters = filters, page = currentPage) => {
    try {
      setLoading(true);
      const hasActiveFilter = Object.values(customFilters).some(
        v => v !== '' && v !== false
      );
      let queryParams = '';
      if (hasActiveFilter) {
        const activeFilters = Object.entries(customFilters).reduce((acc, [key, value]) => {
          if (value !== '' && value !== false) {
            acc[key] = value;
          }
          return acc;
        }, {});
        queryParams = new URLSearchParams({
          ...activeFilters,
          page: page - 1,
          size: 10
        }).toString();
      } else {
        queryParams = new URLSearchParams({
          page: page - 1,
          size: 10
        }).toString();
      }
      const { data } = await axiosInstance.get(`${API_ENDPOINTS.USERS_SEARCH}?${queryParams}`, {
        withCredentials: true
      });
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers(filters, 1);
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDeleteClick = (userId, userName) => {
    setUserToDelete({ id: userId, name: userName });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      await axiosInstance.delete(API_ENDPOINTS.USER_SOFT_DELETE(userToDelete.id), {
        withCredentials: true
      });
      alert(`${userToDelete.name} 사용자가 삭제되었습니다.`);
      fetchUsers();
    } catch (error) {
      console.error('Error soft deleting user:', error);
      if (error.response?.status === 403) {
        alert('사용자를 삭제할 권한이 없습니다.');
      } else {
        alert('사용자 삭제 중 오류가 발생했습니다.');
      }
    }
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return { text: '관리자', role: 'ADMIN' };
      case 'DEVELOPER':
        return { text: '개발사', role: 'DEVELOPER' };
      case 'CUSTOMER':
        return { text: '고객사', role: 'CUSTOMER' };
      default:
        return { text: '일반', role: 'DEFAULT' };
    }
  };

  const handleRowClick = (userId) => {
    console.log('Navigating to user edit page with ID:', userId);
    navigate(`/user-edit/${userId}`);
  };

  useEffect(() => {
    fetchUsers(filters, currentPage);
  }, [currentPage]);

  return (
    <PageContainer>
      <MainContent>
        <Card>
          <Header>
            <PageTitle>사용자 관리</PageTitle>
            <ButtonContainer>
              <ActionBadge 
                type="primary" 
                size="xlarge" 
                onClick={() => navigate('/user-create')}
              >
                + 새 사용자 등록
              </ActionBadge>
            </ButtonContainer>
          </Header>
          <SearchSection>
            <SearchRow style={{ marginRight: '0' }}>
              <SearchInput
                type="text"
                name="name"
                placeholder="이름 검색"
                value={filters.name}
                onChange={handleFilterChange}
              />
              <SearchInput
                type="text"
                name="email"
                placeholder="이메일 검색"
                value={filters.email}
                onChange={handleFilterChange}
              />
              <SearchInput
                type="text"
                name="phone"
                placeholder="전화번호 검색"
                value={filters.phone}
                onChange={handleFilterChange}
              />
              <select
                name="companyRole"
                value={filters.companyRole}
                onChange={handleFilterChange}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minWidth: '120px',
                }}
              >
                <option value="">회사 역할 선택</option>
                <option value="ADMIN">ADMIN</option>
                <option value="DEVELOPER">DEVELOPER</option>
                <option value="CUSTOMER">CUSTOMER</option>
              </select>
              <SearchCheckbox>
                <input
                  type="checkbox"
                  name="isDeleted"
                  checked={filters.isDeleted}
                  onChange={handleFilterChange}
                />
                <span>삭제된 사용자만 검색</span>
              </SearchCheckbox>
              <ActionBadge 
                type="success" 
                size="large" 
                onClick={handleSearch}
              >
                검색
              </ActionBadge>
            </SearchRow>
          </SearchSection>
        </Card>

        {loading ? (
          <LoadingMessage>데이터를 불러오는 중...</LoadingMessage>
        ) : (
          <>
            <UsersTable>
              <thead>
                <tr>
                  <TableHeaderCell>이름</TableHeaderCell>
                  <TableHeaderCell>이메일</TableHeaderCell>
                  <TableHeaderCell>전화번호</TableHeaderCell>
                  <TableHeaderCell>소속 회사</TableHeaderCell>
                  <TableHeaderCell>역할</TableHeaderCell>
                  <TableHeaderCell>액션</TableHeaderCell>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const roleBadge = getRoleBadge(user.companyRole);
                  return (
                    <TableRow 
                      key={user.id} 
                      onClick={() => handleRowClick(user.id)}
                    >
                      <TableCell $nowrap>{user.name}</TableCell>
                      <TableCell $nowrap>{user.email}</TableCell>
                      <TableCell $nowrap>{user.phone}</TableCell>
                      <TableCell $nowrap>{user.companyName}</TableCell>
                      <TableCell $nowrap>
                        <StatusBadge role={roleBadge.role}>
                          {roleBadge.text}
                        </StatusBadge>
                      </TableCell>
                      <TableCell $nowrap>
                        {!user.isDeleted && user.companyRole !== 'ADMIN' && (
                          <ActionButtonContainer onClick={(e) => e.stopPropagation()}>
                            <ActionBadge 
                              type="primary" 
                              size="medium" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(user.id);
                              }}
                            >
                              수정
                            </ActionBadge>
                            <ActionBadge 
                              type="danger" 
                              size="medium" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(user.id, user.name);
                              }}
                              disabled={user.isDeleted}
                            >
                              삭제
                            </ActionBadge>
                          </ActionButtonContainer>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </UsersTable>
            {users.length > 0 && (
              <Pagination
                currentPage={currentPage - 1}
                totalElements={totalPages * itemsPerPage}
                pageSize={itemsPerPage}
                onPageChange={(page) => setCurrentPage(page + 1)}
              />
            )}
          </>
        )}

        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="사용자 삭제"
          message={`정말로 ${userToDelete?.name} 사용자를 삭제하시겠습니까?
삭제된 사용자는 복구할 수 없습니다.`}
          confirmText="삭제"
          cancelText="취소"
          type="delete"
        />
      </MainContent>
    </PageContainer>
  );
};

export default UserManagement;
