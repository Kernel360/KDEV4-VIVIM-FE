import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import axiosInstance from '../utils/axiosInstance';
import MainContent from '../components/common/MainContent';
import Pagination from '../components/common/Pagination';
import ConfirmModal from '../components/common/ConfirmModal';
import { StatusBadge, ProgressBadge, ActionBadge } from '../components/common/Badge';

const AdminProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState({
    name: '',
    description: '',
    isDeleted: false
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, [currentPage]);

  const fetchProjects = async (customFilters = filters, page = currentPage) => {
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
          page,
          size: 10
        }).toString();
      } else {
        queryParams = new URLSearchParams({
          isDeleted: false,
          page,
          size: 10
        }).toString();
      }
      const { data } = await axiosInstance.get(`${API_ENDPOINTS.PROJECTS_SEARCH}?${queryParams}`);
      setProjects(data.content || []);
      setTotalPages(data.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(0);
    fetchProjects(filters, 0);
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newFilters = {
      ...filters,
      [name]: type === 'checkbox' ? checked : value
    };
    
    // 체크박스가 해제되면 isDeleted를 false로 설정
    if (name === 'isDeleted' && !checked) {
      newFilters.isDeleted = false;
    }
    
    setFilters(newFilters);
  };

  const getProjectStatus = (status, deleted, currentProgress) => {
    if (deleted) {
      return '삭제됨';
    }
    if (currentProgress === 'COMPLETED') {
      return '완료됨';
    }
    return '진행중';
  };

  const getProgressColor = (progress) => {
    // 단계 이름 정규화 함수
    const normalizeProgress = (name) => {
      if (name === '요구사항정의' || name === '요구사항 정의') return '요구사항 정의';
      return name;
    };

    const normalizedProgress = normalizeProgress(progress);
    
    switch (normalizedProgress) {
      case '요구사항 정의':
        return {
          background: '#FEF3C7',  // 연한 노란색
          text: '#92400E'  // 진한 갈색
        };
      case '화면 설계':
        return {
          background: '#DBEAFE',  // 연한 파란색
          text: '#1E40AF'  // 진한 파란색
        };
      case '디자인':
        return {
          background: '#FCE7F3',  // 연한 분홍색
          text: '#BE185D'  // 진한 분홍색
        };
      case '개발':
        return {
          background: '#E0E7FF',  // 연한 보라색
          text: '#3730A3'  // 진한 보라색
        };
      case '배포':
        return {
          background: '#F3E8FF',  // 연한 보라색
          text: '#6B21A8'  // 진한 보라색
        };
      case '완료':
        return {
          background: '#DCFCE7',  // 연한 초록색
          text: '#15803D'  // 진한 초록색
        };
      default:
        return {
          background: '#F1F5F9',  // 연한 회색
          text: '#64748B'  // 진한 회색
        };
    }
  };

  const ProgressBadge = styled.span`
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    background-color: ${props => getProgressColor(props.progress).background};
    color: ${props => getProgressColor(props.progress).text};

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

  const getProgressStatus = (progress) => {
    // 단계 이름 정규화 함수
    const normalizeProgress = (name) => {
      if (name === '요구사항정의' || name === '요구사항 정의') return '요구사항 정의';
      return name;
    };

    const normalizedProgress = normalizeProgress(progress);
    
    switch (normalizedProgress) {
      case '요구사항 정의':
        return '요구사항 정의';
      case 'COMPLETED':
        return '완료';
      case 'INSPECTION':
        return '검수';
      case 'WIREFRAME':
        return '와이어프레임';
      case 'DESIGN':
        return '디자인';
      case 'PUBLISHING':
        return '퍼블리싱';
      case 'DEVELOPMENT':
        return '개발';
      case 'TESTING':
        return '테스트';
      case 'DEPLOYMENT':
        return '배포';
      default:
        return normalizedProgress;
    }
  };

  const handleDeleteClick = (projectId) => {
    setProjectToDelete(projectId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await axiosInstance.delete(`${API_ENDPOINTS.PROJECTS}/${projectToDelete}`, {
        withCredentials: true,
        data: {
          projectId: projectToDelete,
          deleteReason: '사용자에 의한 삭제'
        }
      });
      
      if (response.data.statusCode === 200) {
        alert('프로젝트가 삭제되었습니다.');
        fetchProjects();
      } else {
        alert('프로젝트 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      if (error.response?.status === 403) {
        alert('프로젝트를 삭제할 권한이 없습니다.');
      } else {
        alert('프로젝트 삭제 중 오류가 발생했습니다.');
      }
    }
    setDeleteModalOpen(false);
    setProjectToDelete(null);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchProjects(filters, page);
  };

  return (
    <PageContainer>
      <MainContent>
        <Card>
          <Header>
            <PageTitle>프로젝트 관리</PageTitle>
            <ButtonContainer>
              <ActionBadge 
                type="primary" 
                size="xlarge" 
                onClick={() => navigate('/project-create')}
              >
                + 새 프로젝트 등록
              </ActionBadge>
            </ButtonContainer>
          </Header>

          <SearchSection>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginRight: '0' }}>
              <SearchInput
                type="text"
                placeholder="프로젝트명 검색"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
              />
              <SearchInput
                type="text"
                placeholder="설명 검색"
                name="description"
                value={filters.description}
                onChange={handleFilterChange}
              />
              <SearchCheckbox>
                <input
                  type="checkbox"
                  checked={filters.isDeleted}
                  name="isDeleted"
                  onChange={handleFilterChange}
                />
                삭제된 프로젝트만 검색
              </SearchCheckbox>
              <ActionBadge 
                type="success" 
                size="large" 
                onClick={handleSearch}
              >
                검색
              </ActionBadge>
            </div>
          </SearchSection>
        </Card>

        {loading ? (
          <LoadingMessage>데이터를 불러오는 중...</LoadingMessage>
        ) : (
          <>
            <ProjectTable>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>프로젝트명</TableHeaderCell>
                  <TableHeaderCell>프로젝트 비용</TableHeaderCell>
                  <TableHeaderCell>시작일</TableHeaderCell>
                  <TableHeaderCell>종료일</TableHeaderCell>
                  <TableHeaderCell>상태</TableHeaderCell>
                  <TableHeaderCell>진행상황</TableHeaderCell>
                  <TableHeaderCell>관리</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects && projects.length > 0 ? (
                  projects.map((project) => (
                    <TableRow 
                      key={project.projectId}
                      onClick={() => navigate(`/project/${project.projectId}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        {project.name}
                      </TableCell>
                      <TableCell>{project.projectFee.toLocaleString()}원</TableCell>
                      <TableCell>{project.startDate}</TableCell>
                      <TableCell>{project.endDate}</TableCell>
                      <TableCell>
                        <StatusBadge 
                          status={project.projectStatus} 
                          deleted={project.deleted}
                          currentProgress={project.currentProgress}
                        >
                          {getProjectStatus(project.projectStatus, project.deleted, project.currentProgress)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <ProgressBadge progress={project.currentProgress}>
                          {getProgressStatus(project.currentProgress)}
                        </ProgressBadge>
                      </TableCell>
                      <TableCell>
                        <ActionButtonContainer onClick={(e) => e.stopPropagation()}>
                          {!project.deleted && (
                            <>
                              <ActionBadge 
                                type="primary" 
                                size="medium" 
                                onClick={() => navigate(`/projectModify/${project.projectId}`)}
                              >
                                수정
                              </ActionBadge>
                              <ActionBadge 
                                type="danger" 
                                size="medium" 
                                onClick={() => handleDeleteClick(project.projectId)}
                              >
                                삭제
                              </ActionBadge>
                            </>
                          )}
                        </ActionButtonContainer>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="7" style={{ textAlign: 'center' }}>
                      등록된 프로젝트가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </ProjectTable>

            {totalPages > 0 && (
              <Pagination
                currentPage={currentPage}
                totalElements={totalPages * 10}
                pageSize={10}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}

        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setProjectToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="프로젝트 삭제"
          message={`정말로 이 프로젝트를 삭제하시겠습니까?
삭제된 프로젝트는 복구할 수 없습니다.`}
          confirmText="삭제"
          cancelText="취소"
          type="delete"
        />
      </MainContent>
    </PageContainer>
  );
};

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
`;

const Card = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
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
  gap: 12px;
  align-items: center;
`;

const SearchSection = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: nowrap;
  margin-bottom: 24px;
  overflow-x: auto;
  gap: 0;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  width: 200px;
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

const ProjectTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  margin: 0 auto;
`;

const TableHeader = styled.thead`
  background: white;
`;

const TableBody = styled.tbody``;

const TableHeaderCell = styled.th`
  padding: 16px 24px;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  color: #0F172A;
  border-bottom: 1px solid #e2e8f0;
  font-family: 'SUIT', sans-serif;
  font-weight: 600;
`;

const TableRow = styled.tr`
  transition: background 0.2s;

  &:hover {
    background: #f8fafc;
  }
`;

const TableCell = styled.td`
  padding: 16px 24px;
  font-size: 14px;
  color: #0F172A;
  border-bottom: 1px solid #e2e8f0;
  font-family: 'SUIT', sans-serif;
`;

const ActionButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  white-space: nowrap;
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #64748b;
`;

export default AdminProjects;