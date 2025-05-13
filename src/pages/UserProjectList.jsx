import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../hooks/useAuth';
import axiosInstance from '../utils/axiosInstance';
import MainContent from '../components/common/MainContent';

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: -0.02em;
  transition: all 0.15s ease;
  background: ${props => {
    switch (props.status) {
      case 'PROGRESS': return '#F0FDF4';
      case 'INSPECTION': return '#FEF2F2';
      case 'COMPLETED': return '#F1F5F9';
      case 'PENDING': return '#F1F5F9';
      case 'DELETED': return '#FEF2F2';
      default: return '#F1F5F9';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'PROGRESS': return '#15803D';
      case 'INSPECTION': return '#B91C1C';
      case 'COMPLETED': return '#64748B';
      case 'PENDING': return '#64748B';
      case 'DELETED': return '#B91C1C';
      default: return '#64748B';
    }
  }};
`;

const RoleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: -0.02em;
  transition: all 0.15s ease;
  background: ${props => {
    if (props.role === 'CLIENT_MANAGER' || props.role === 'DEVELOPER_MANAGER') {
      return '#FEF3C7';
    }
    return '#DBEAFE';
  }};
  color: ${props => {
    if (props.role === 'CLIENT_MANAGER' || props.role === 'DEVELOPER_MANAGER') {
      return '#92400E';
    }
    return '#1E40AF';
  }};
`;

const TableCell = styled.td`
  padding: 16px 24px;
  font-size: 14px;
  color: #1e293b;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
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
  transition: all 0.2s;

  &:hover {
    background: #f8fafc;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  gap: 24px;
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

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #64748b;
`;

const ProjectsTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-top: 24px;
`;

const SearchSection = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
`;

const SearchInput = styled.input`
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  width: 200px;
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

const SearchButton = styled.button`
  padding: 10px 20px;
  background: #2E7D32;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(46, 125, 50, 0.2);
  
  &:hover {
    background: #1B5E20;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(46, 125, 50, 0.2);
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
`;

const PaginationButton = styled.button`
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #1e293b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f8fafc;
  }

  &:disabled {
    background: #f1f5f9;
    color: #94a3b8;
    cursor: not-allowed;
  }
`;

const PaginationNumber = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.active ? '#2E7D32' : 'white'};
  border: 1px solid ${props => props.active ? '#2E7D32' : '#e2e8f0'};
  border-radius: 6px;
  color: ${props => props.active ? 'white' : '#1e293b'};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${props => props.active ? '#2E7D32' : '#f8fafc'};
  }
`;

const ActionButtonContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  background: #2E7D32;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1B5E20;
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #ef4444;
  font-size: 16px;
`;

const UserProjectList = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    console.log('UserProjectList useEffect triggered', { authLoading, isAuthenticated, user });
    
    if (authLoading) {
      console.log('Auth is still loading');
      return;
    }
    
    if (!isAuthenticated || !user) {
      console.log('User is not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
    
    console.log('Fetching projects for user:', user);
    fetchProjects();
  }, [user, isAuthenticated, authLoading, navigate]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('Starting to fetch projects...');
      
      let endpoint;
      if (user.companyRole === 'ADMIN') {
        endpoint = API_ENDPOINTS.ADMIN_PROJECTS;
      } else {
        endpoint = API_ENDPOINTS.USER_PROJECTS(user.id);
      }
      
      console.log('Fetching projects from endpoint:', endpoint);
      const response = await axiosInstance.get(endpoint);
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setProjects(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setProjects(response.data.data);
      } else {
        console.error('Unexpected response data structure:', response.data);
        setError('프로젝트 데이터 형식이 올바르지 않습니다.');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      if (err.response?.status === 403) {
        setError('접근 권한이 없습니다.');
      } else {
        setError('프로젝트 목록을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1);
  };

  const getProjectStatus = (project) => {
    if (project.deleted) {
      return '삭제됨';
    }
    switch (project.projectStatus) {
      case 'PROGRESS':
        return '진행중';
      case 'INSPECTION':
        return '검수중';
      case 'COMPLETED':
        return '완료';
      case 'PENDING':
        return '대기중';
      default:
        return '대기중';
    }
  };

  const getProjectRole = (role) => {
    switch (role) {
      case 'CLIENT_USER':
        return '고객사 사용자';
      case 'CLIENT_MANAGER':
        return '고객사 관리자';
      case 'DEVELOPER_USER':
        return '개발사 사용자';
      case 'DEVELOPER_MANAGER':
        return '개발사 관리자';
      default:
        return role;
    }
  };

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const handleApprovalRequest = (e, projectId) => {
    e.stopPropagation();
    navigate(`/project/${projectId}/approval/create`);
  };

  const handleApprovalResponse = (e, projectId) => {
    e.stopPropagation();
    navigate(`/project/${projectId}/approvals`);
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCurrentPageProjects = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProjects.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  if (loading) {
    return (
      <MainContent>
        <LoadingMessage>로딩 중...</LoadingMessage>
      </MainContent>
    );
  }

  if (error) {
    return (
      <MainContent>
        <ErrorMessage>{error}</ErrorMessage>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <Header>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
          <PageTitle>내 프로젝트</PageTitle>
          <SearchSection>
            <SearchInput
              type="text"
              placeholder="프로젝트명 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <SearchButton onClick={handleSearch}>
              검색
            </SearchButton>
          </SearchSection>
        </div>
      </Header>

      <ProjectsTable>
        <thead>
          <tr>
            <TableHeaderCell>프로젝트명</TableHeaderCell>
            <TableHeaderCell>시작일</TableHeaderCell>
            <TableHeaderCell>종료일</TableHeaderCell>
            <TableHeaderCell>상태</TableHeaderCell>
            <TableHeaderCell>역할</TableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {getCurrentPageProjects().map((project) => (
            <TableRow 
              key={project.projectId} 
              onClick={() => handleProjectClick(project.projectId)}
            >
              <TableCell>{project.name}</TableCell>
              <TableCell>{formatDate(project.startDate)}</TableCell>
              <TableCell>{formatDate(project.endDate)}</TableCell>
              <TableCell>
                <StatusBadge status={project.deleted ? 'DELETED' : project.projectStatus}>
                  {getProjectStatus(project)}
                </StatusBadge>
              </TableCell>
              <TableCell>
                <RoleBadge role={project.myRole}>
                  {getProjectRole(project.myRole)}
                </RoleBadge>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </ProjectsTable>
      {filteredProjects.length > 0 && (
        <PaginationContainer>
          <PaginationButton 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            이전
          </PaginationButton>
          {[...Array(totalPages)].map((_, index) => (
            <PaginationNumber
              key={index + 1}
              active={currentPage === index + 1}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </PaginationNumber>
          ))}
          <PaginationButton
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            다음
          </PaginationButton>
        </PaginationContainer>
      )}
    </MainContent>
  );
};

export default UserProjectList;