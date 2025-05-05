import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { API_ENDPOINTS } from '../config/api';
import ApprovalProposal from '../components/ApprovalProposal';
import ProjectPostCreate from './ProjectPostCreate';
import { FaArrowLeft, FaArrowRight, FaPlus, FaCheck, FaClock, FaFlag, FaEdit, FaTrashAlt, FaTimes, FaGripVertical } from 'react-icons/fa';
import ProjectStageProgress from '../components/ProjectStage';
import approvalUtils from '../utils/approvalStatus';
import { ApprovalProposalStatus } from '../constants/enums';
import axiosInstance from '../utils/axiosInstance';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

const { getApprovalStatusText, getApprovalStatusBackgroundColor, getApprovalStatusTextColor } = approvalUtils;

const PROGRESS_STAGE_MAP = {
  'REQUIREMENTS': '요구사항 정의',
  'WIREFRAME': '화면설계',
  'DESIGN': '디자인',
  'PUBLISHING': '퍼블리싱',
  'DEVELOPMENT': '개발',
  'INSPECTION': '검수',
  'COMPLETED': '완료'
};

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background-color: ${props => {
    switch (props.$status) {
      case ApprovalProposalStatus.DRAFT:
        return 'rgba(75, 85, 99, 0.08)';
      case ApprovalProposalStatus.UNDER_REVIEW:
        return 'rgba(30, 64, 175, 0.08)';
      case ApprovalProposalStatus.FINAL_APPROVED:
        return 'rgba(4, 120, 87, 0.08)';
      case ApprovalProposalStatus.FINAL_REJECTED:
        return 'rgba(185, 28, 28, 0.08)';
      default:
        return 'rgba(75, 85, 99, 0.08)';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case ApprovalProposalStatus.DRAFT:
        return '#4B5563';
      case ApprovalProposalStatus.UNDER_REVIEW:
        return '#1E40AF';
      case ApprovalProposalStatus.FINAL_APPROVED:
        return '#047857';
      case ApprovalProposalStatus.FINAL_REJECTED:
        return '#B91C1C';
      default:
        return '#4B5563';
    }
  }};
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  svg {
    font-size: 14px;
    opacity: 0.9;
  }
`;

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('진행중인 프로젝트 - 관리자');
  const [project, setProject] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const stageRefs = useRef([]);
  const [showAll, setShowAll] = useState(false);
  const [progressList, setProgressList] = useState([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [approvalRequestsForStage, setApprovalRequestsForStage] = useState([]);
  const [showStageModal, setShowStageModal] = useState(false);
  const [stageAction, setStageAction] = useState(''); // 'add', 'edit', 'delete'
  const [editingStage, setEditingStage] = useState(null);
  const [stageName, setStageName] = useState('');
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [statusSummary, setStatusSummary] = useState(null);
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [projectProgress, setProjectProgress] = useState({
    totalStageCount: 0,
    completedStageCount: 0,
    currentStageProgressRate: 0,
    overallProgressRate: 0
  });

  const [progressStatus, setProgressStatus] = useState({
    progressList: []
  });

  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(null);
  const [isClient, setIsClient] = useState(null);
  const [isDeveloperManager, setIsDeveloperManager] = useState(null);

  const [isIncreasing, setIsIncreasing] = useState(false);

  const [stages, setStages] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (progressList) {
      setStages(progressList.map(stage => ({
        id: stage.id,
        name: stage.name,
        position: stage.position,
        isCompleted: stage.isCompleted
      })));
    }
  }, [progressList]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setStages((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          position: index + 1
        }));

        // progressList도 함께 업데이트
        setProgressList(prev => 
          prev.map(item => {
            const updatedItem = updatedItems.find(updated => updated.id === item.id);
            return updatedItem ? { ...item, position: updatedItem.position } : item;
          }).sort((a, b) => a.position - b.position)
        );

        return updatedItems;
      });
    }
  };

  const handleDeleteProject = async () => {
    if (window.confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_ENDPOINTS.PROJECTS}/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': token,
            'accept': '*/*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });
        
        if (response.ok) {
          alert('프로젝트가 삭제되었습니다.');
          navigate('/dashboard');
        } else {
          alert('프로젝트 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('프로젝트 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  useEffect(() => {
    fetchProjectDetail();
    fetchProjectPosts();
    fetchProjectProgress();
    fetchApprovalRequests();
    fetchProjectOverallProgress();
    fetchProgressStatus();

    // 30초마다 데이터 업데이트
    const updateInterval = setInterval(() => {
      fetchProjectOverallProgress();
      fetchProgressStatus();
    }, 30000);

    return () => {
      clearInterval(updateInterval);
    };
  }, [id]);

  // 현재 단계가 변경될 때마다 진행률 다시 계산
  useEffect(() => {
    if (progressList.length > 0) {
      fetchProjectOverallProgress();
      fetchProgressStatus();
    }
  }, [currentStageIndex]);

  // 승인요청 상태가 변경될 때마다 진행률 다시 계산
  useEffect(() => {
    if (approvalRequests.length > 0) {
      fetchProjectOverallProgress();
      fetchProgressStatus();
    }
  }, [approvalRequests]);

  // 진행률 데이터 업데이트 함수
  const updateProgressData = async () => {
    try {
      await Promise.all([
        fetchProjectOverallProgress(),
        fetchProgressStatus()
      ]);
    } catch (error) {
      console.error('진행률 데이터 업데이트 중 오류 발생:', error);
    }
  };

  // 승인요청 상태 변경 시 진행률 업데이트
  const handleApprovalStatusChange = () => {
    updateProgressData();
  };

  const translateRole = (role) => {
    switch (role) {
      case 'DEVELOPER':
        return '개발사';
      case 'CLIENT':
        return '의뢰인';
      case 'ADMIN':
        return '관리자';
      default:
        return '일반';
    }
  };
  
  const getRoleColor = (role) => {
    switch (role) {
      case 'DEVELOPER':
        return {
          background: '#dbeafe',
          border: '#93c5fd',
          text: '#2563eb'
        };
      case 'CLIENT':
        return {
          background: '#fef9c3',
          border: '#fde047',
          text: '#ca8a04'
        };
      case 'ADMIN':
        return {
          background: '#fee2e2',
          border: '#fca5a5',
          text: '#dc2626'
        };
      default:
        return {
          background: '#f1f5f9',
          border: '#e2e8f0',
          text: '#64748b'
        };
    }
  };

  const fetchProjectProgress = async () => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINTS.PROJECT_DETAIL(id)}/progress`);
      console.log('Progress 조회 응답:', response.data);
      
      // 새로 추가된 단계의 isCompleted 값을 false로 설정
      const updatedProgressList = response.data.progressList.map(progress => ({
        ...progress,
        isCompleted: progress.isCompleted && progress.id !== response.data.progressList[response.data.progressList.length - 1]?.id
      }));
      
      setProgressList(updatedProgressList);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchProjectDetail = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.PROJECT_DETAIL(id));
      setProject(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching project:', error);
      setLoading(false);
    }
  };

  const fetchProjectPosts = async () => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINTS.PROJECT_DETAIL(id)}/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleMenuClick = (menuItem) => {
    setActiveMenuItem(menuItem);
  };

  useEffect(() => {
    const checkUserRole = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          const isAdminUser = decodedToken.role === 'ADMIN';
          const isClientUser = decodedToken.role === 'CUSTOMER';
          const isDeveloperManagerUser = decodedToken.role === 'DEVELOPER_MANAGER';
          setIsAdmin(isAdminUser);
          setIsClient(isClientUser);
          setIsDeveloperManager(isDeveloperManagerUser);
        } catch (error) {
          console.error('Error decoding token:', error);
          setIsAdmin(false);
          setIsClient(false);
          setIsDeveloperManager(false);
        }
      }
      setAdminCheckLoading(false);
    };
    
    checkUserRole();
  }, []);

  const handleNextStage = () => {
    if (currentStageIndex < progressList.length - 1) {
      setCurrentStageIndex(prev => prev + 1);
    }
  };
  
  const handlePrevStage = () => {
    if (currentStageIndex > 0) {
      setCurrentStageIndex(prev => prev - 1);
    }
  };

  // 승인요청 항목 클릭 시 처리하는 함수
  const handleApprovalClick = async (approval) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.APPROVAL.DETAIL(approval.id), {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('승인요청 상세 조회에 실패했습니다.');
      }

      const data = await response.json();
      setSelectedProposal(data);
      
      // 승인 상태 요약 정보 조회
      fetchStatusSummary(approval.id);
      
      setIsProposalModalOpen(true);
    } catch (error) {
      console.error('Error fetching approval detail:', error);
      alert('승인요청 상세 정보를 불러오는데 실패했습니다.');
    }
  };

  // 승인 상태 요약 정보 조회 함수 추가
  const fetchStatusSummary = async (approvalId) => {
    try {
      const { data } = await axiosInstance.get(API_ENDPOINTS.APPROVAL.STATUS_SUMMARY(approvalId));
      setStatusSummary(data);
    } catch (error) {
      console.error('Error fetching status summary:', error);
    }
  };

  const handleApprovalRowClick = (approval) => {
    setSelectedApproval(approval);
  };

  const closeModal = () => {
    setSelectedApproval(null);
  };

  useEffect(() => {
    if (progressList && progressList.length > 0) {
      const currentStage = progressList[currentStageIndex];
      // 현재 선택된 단계에 해당하는 승인요청만 필터링
      if (approvalRequestsForStage && approvalRequestsForStage.length > 0) {
        const filteredRequests = approvalRequestsForStage.filter(
          proposal => proposal.stageId === currentStage.stageId
        );
        setApprovalRequestsForStage(filteredRequests);
      }
    }
  }, [currentStageIndex, progressList, approvalRequestsForStage]);
  
  // 프로젝트 진행단계 추가
  const handleAddStage = async () => {
    if (!stageName.trim()) {
      alert('단계명을 입력해주세요.');
      return;
    }
    
    try {
      const response = await axiosInstance.post(`${API_ENDPOINTS.PROJECT_DETAIL(id)}/progress`, {
        name: stageName,
        position: progressList.length + 1,
        isCompleted: false
      });
      
      if (response.status === 200 || response.status === 201) {
        console.log('Progress 추가 응답:', response.data); // 응답 데이터 로깅
        alert('진행 단계가 추가되었습니다.');
        fetchProjectProgress();
        setShowStageModal(false);
        setStageName('');
      } else {
        alert('진행 단계 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error adding stage:', error);
      alert('진행 단계 추가 중 오류가 발생했습니다.');
    }
  };

  // 프로젝트 진행단계 수정
  const handleEditStage = async () => {
    if (!stageName.trim() || !editingStage) {
      alert('단계명을 입력해주세요.');
      return;
    }
    
    try {
      const response = await axiosInstance.patch(`${API_ENDPOINTS.PROJECT_DETAIL(id)}/progress/${editingStage.id}`, {
        name: stageName,
        position: editingStage.position
      });
      
      if (response.status === 200) {
        const data = response.data;
        // 응답 데이터 확인
        console.log('Progress 수정 응답:', data);
        
        // 수정된 진행단계 정보로 progressList 업데이트
        setProgressList(prev => 
          prev.map(item => 
            item.id === data.id 
              ? { ...item, name: data.name, position: data.position } 
              : item
          )
        );
        
        alert('진행 단계가 수정되었습니다.');
        fetchProjectProgress();
        setShowStageModal(false);
        setStageName('');
        setEditingStage(null);
      } else {
        alert(response.data.message || '진행 단계 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error editing stage:', error);
      alert('진행 단계 수정 중 오류가 발생했습니다.');
    }
  };
  
  // 프로젝트 진행단계 삭제
  const handleDeleteStage = async () => {
    if (!editingStage) return;
    
    if (window.confirm('정말로 이 진행 단계를 삭제하시겠습니까?')) {
      try {
        const response = await axiosInstance.delete(`${API_ENDPOINTS.PROJECT_DETAIL(id)}/progress/${editingStage.id}`);
        
        if (response.status === 200) {
          alert('진행 단계가 삭제되었습니다.');
          fetchProjectProgress();
          setShowStageModal(false);
          setStageName('');
          setEditingStage(null);
          // 현재 보고 있는 단계가 삭제된 경우, 첫 번째 단계로 이동
          if (currentStageIndex >= progressList.length - 1) {
            setCurrentStageIndex(0);
          }
        } else {
          alert('진행 단계 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('Error deleting stage:', error);
        alert('진행 단계 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 진행단계 모달 열기
  const openStageModal = (action, stage = null) => {
    if (action === 'editPosition') {
      setShowPositionModal(true);
      return;
    }
    setStageAction(action);
    setEditingStage(stage);
    setStageName(stage ? stage.name : '');
    setShowStageModal(true);
  };
  
  // 승인요청 목록 조회
  const fetchApprovalRequests = async () => {
    try {
      // 프로젝트 상세 정보가 없으면 조회하지 않음
      if (!project) {
        console.log('프로젝트 정보가 없어 승인요청 목록을 조회하지 않습니다.');
        return;
      }

      // 사용자 권한 확인
      if (!isAdmin && !isClient && !isDeveloperManager) {
        console.log('승인요청 목록 조회 권한이 없습니다.');
        return;
      }

      const { data } = await axiosInstance.get(`${API_ENDPOINTS.PROJECT_DETAIL(id)}/approvals`);
      setApprovalRequests(data);
      
      // 승인요청 상태가 변경되면 진행률 다시 조회
      await Promise.all([
        fetchProjectOverallProgress(),
        fetchProgressStatus()
      ]);
    } catch (error) {
      console.error('승인요청 목록 조회 중 오류 발생:', error);
      if (error.response?.status === 403) {
        console.log('승인요청 목록 조회 권한이 없습니다.');
      }
      // 에러 발생 시 빈 배열로 설정
      setApprovalRequests([]);
    }
  };
  
  // 프로젝트 진행률 조회
  const fetchProjectOverallProgress = async () => {
    try {
      const { data } = await axiosInstance.get(`${API_ENDPOINTS.PROJECT_DETAIL(id)}/progress/overall-progress`);
      
      // 현재 단계의 승인요청들을 필터링
      const currentStageApprovals = approvalRequests.filter(
        req => req.stageId === progressList[currentStageIndex]?.id
      );
      
      // 현재 단계의 승인요청 중 최종 승인된 것의 비율 계산
      let currentStageProgress = 0;
      if (currentStageApprovals.length > 0) {
        const approvedCount = currentStageApprovals.filter(
          req => req.approvalProposalStatus === ApprovalProposalStatus.FINAL_APPROVED
        ).length;
        currentStageProgress = (approvedCount / currentStageApprovals.length) * 100;
      }
      
      // 진행률 데이터 업데이트
      setProjectProgress({
        totalStageCount: data.totalStageCount || 0,
        completedStageCount: data.completedStageCount || 0,
        currentStageProgressRate: currentStageProgress,
        overallProgressRate: data.overallProgressRate || 0
      });
      
    } catch (error) {
      console.error('프로젝트 진행률 조회 중 오류 발생:', error);
      // 에러 발생 시 기본값 설정
      setProjectProgress({
        totalStageCount: 0,
        completedStageCount: 0,
        currentStageProgressRate: 0,
        overallProgressRate: 0
      });
    }
  };

  // 프로젝트 단계별 승인요청 진척도 조회
  const fetchProgressStatus = async () => {
    try {
      const { data } = await axiosInstance.get(`${API_ENDPOINTS.PROJECT_DETAIL(id)}/progress/status`);

      // 각 단계의 완료 여부는 단계 승급 버튼을 눌러야만 설정되도록 수정
      const updatedProgressList = data.progressList.map(progress => ({
        ...progress,
        isCompleted: progress.isCompleted || false // 기존 isCompleted 값 유지
      }));

      setProgressStatus({
        ...data,
        progressList: updatedProgressList
      });

      // 완료된 단계 수 계산
      const completedStages = updatedProgressList.reduce((count, status) => {
        return status.isCompleted ? count + 1 : count;
      }, 0);

      // 전체 진행률 업데이트 (단계 단위로)
      const totalStages = updatedProgressList.length;
      const overallProgress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

      setProjectProgress(prev => ({
        ...prev,
        completedStageCount: completedStages,
        totalStageCount: totalStages,
        overallProgressRate: overallProgress
      }));

    } catch (error) {
      console.error('단계별 진척도 조회 중 오류 발생:', error);
    }
  };
  
  // 단계 승급 처리 함수 추가
  const handleIncreaseProgress = async () => {
    if (isIncreasing) return; // 이미 진행 중이면 중복 호출 방지
    
    // 확인 메시지 추가
    if (!window.confirm('현재 단계를 승급하시겠습니까?')) {
      return;
    }
    
    try {
      setIsIncreasing(true); // 진행 중 상태로 설정
      await axiosInstance.patch(`${API_ENDPOINTS.PROJECT_DETAIL(id)}/progress/increase_current_progress`);

      // 승급 후 데이터 새로고침 순서 변경
      await Promise.all([
        fetchProjectDetail(), // 프로젝트 정보 다시 가져오기
        fetchProjectProgress(),
        fetchProjectOverallProgress(),
        fetchProgressStatus()
      ]);
      
      // 현재 단계 인덱스 업데이트
      setCurrentStageIndex(prev => prev + 1);
      
      alert('단계가 승급되었습니다.');
    } catch (error) {
      console.error('Error increasing progress:', error);
      alert('단계 승급 중 오류가 발생했습니다.');
    } finally {
      setIsIncreasing(false); // 진행 중 상태 해제
    }
  };

  // 단계 순서 변경 저장
  const handleSavePositions = async () => {
    try {
      // 위치 값 검증
      const invalidStage = stages.find(stage => !stage.position || stage.position < 0);
      if (invalidStage) {
        alert('단계 위치 값이 유효하지 않습니다. 모든 단계는 0 이상의 위치 값을 가져야 합니다.');
        return;
      }

      console.log('현재 stages 상태:', stages);

      // 모든 단계의 위치를 순차적으로 업데이트
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        console.log(`단계 ID: ${stage.id}, 이름: ${stage.name}, 위치: ${i}`);
        await axiosInstance.put(
          `${API_ENDPOINTS.PROJECT_DETAIL(id)}/progress/${stage.id}/positioning`,
          { targetIndex: i }
        );
      }
      
      alert('단계 순서가 성공적으로 변경되었습니다.');
      setShowPositionModal(false);
      fetchProjectProgress(); // 단계 목록 새로고침
    } catch (error) {
      console.error('단계 순서 변경 중 오류 발생:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('단계 순서 변경에 실패했습니다.');
      }
    }
  };

  return (
    <PageContainer>
      <Navbar 
        activeMenuItem={activeMenuItem}
        handleMenuClick={handleMenuClick}
      />
      <ContentWrapper>
        <MainContent>
          <Header>
            <PageTitle>프로젝트 상세보기</PageTitle>
          </Header>

        {loading ? (
          <LoadingMessage>데이터를 불러오는 중...</LoadingMessage>
        ) : project ? (
          <ContentContainer>
            <ProjectInfoSection>
              <ProjectHeader>
                <ProjectTitle>{project.name}</ProjectTitle>
                <StatusContainer>
                  <StatusBadge isDeleted={project.isDeleted}>
                    {project.isDeleted ? '삭제됨' : '진행중'}
                  </StatusBadge>
                  {isAdmin && (
                    <DropdownContainer>
                      <DropdownButton onClick={() => setShowDropdown(!showDropdown)}>
                        ⋮
                      </DropdownButton>
                      {showDropdown && (
                        <DropdownMenu>
                          <DropdownItem onClick={() => navigate(`/projectModify/${id}`)}>
                            수정하기
                          </DropdownItem>
                          <DropdownItem onClick={() => handleDeleteProject()} className="delete">
                            삭제하기
                          </DropdownItem>
                        </DropdownMenu>
                      )}
                    </DropdownContainer>
                  )}
                </StatusContainer>
              </ProjectHeader>
              <ProjectDescription>{project.description || '프로젝트 설명이 없습니다.'}</ProjectDescription>
              <DateContainer>
                <DateItem>
                  <DateLabel>시작일</DateLabel>
                  <DateValue>{project.startDate}</DateValue>
                </DateItem>
                <DateItem>
                  <DateLabel>종료일</DateLabel>
                  <DateValue>{project.endDate}</DateValue>
                </DateItem>
              </DateContainer>
            </ProjectInfoSection>

            <StageSection>
              <StageSplitLayout>
                <ProjectStageProgress 
                  progressList={progressList}
                  currentStageIndex={currentStageIndex}
                  setCurrentStageIndex={setCurrentStageIndex}
                  title="프로젝트 진행 단계"
                  isAdmin={isAdmin}
                  isDeveloperManager={isDeveloperManager}
                  openStageModal={openStageModal}
                  projectProgress={projectProgress}
                  progressStatus={progressStatus}
                  onIncreaseProgress={handleIncreaseProgress}
                  currentProgress={project?.currentProgress}
                  projectId={project?.id}
                >
                  {progressList.length > 0 ? (
                    progressList
                  .sort((a, b) => a.position - b.position)
                    .map((stage, index) => (
                      <StageContainer 
                        key={stage.id} 
                        style={{ display: index === currentStageIndex ? 'block' : 'none' }}
                      >
                        <StageItem 
                          ref={el => stageRefs.current[index] = el} 
                        >
                          <StageHeader>
                            <StageTitle title={stage.name} />
                          </StageHeader>
                          <ApprovalProposal 
                            progressId={stage.id} 
                            progressStatus={progressStatus}
                          />
                    </StageItem>
                      </StageContainer>
                    ))
                  ) : (
                    <EmptyStageMessage>
                      등록된 진행 단계가 없습니다.
                      {isAdmin && <AddStageButton onClick={() => openStageModal('add')}>프로젝트 진행단계 추가</AddStageButton>}
                    </EmptyStageMessage>
                  )}
                </ProjectStageProgress>
              </StageSplitLayout>
            </StageSection>
                        <BoardSection>
                          <BoardHeader>
                            <SectionTitle>게시판</SectionTitle>
                            <CreateButton onClick={() => navigate(`/project/${id}/post/create`)}>
                              글쓰기
                            </CreateButton>
                          </BoardHeader>
                          <BoardTable>
                            <thead>
                              <tr>
                                <BoardHeaderCell>제목</BoardHeaderCell>
                                <BoardHeaderCell>답글</BoardHeaderCell>
                                <BoardHeaderCell>상태</BoardHeaderCell>
                                <BoardHeaderCell>작성자</BoardHeaderCell>
                                <BoardHeaderCell>역할</BoardHeaderCell>
                                <BoardHeaderCell>작성일</BoardHeaderCell>
                                <BoardHeaderCell>수정일</BoardHeaderCell>
                              </tr>
                            </thead>
                            <tbody>
                              {posts.length === 0 ? (
                                <tr>
                                  <EmptyBoardCell colSpan="7">
                                    <EmptyStateContainer>
                                      <EmptyStateTitle>등록된 게시글이 없습니다</EmptyStateTitle>
                                      <EmptyStateDescription>
                                        새로운 게시글을 작성하여 프로젝트 소식을 공유해보세요
                                      </EmptyStateDescription>
                                    </EmptyStateContainer>
                                  </EmptyBoardCell>
                                </tr>
                              ) : (
                                posts
                                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                .reduce((acc, post) => {
                                  if (!post.parentId) {
                                    acc.push(post);
                                    const replies = posts.filter(reply => reply.parentId === post.postId);
                                    acc.push(...replies);
                                    // 대댓글 추가
                                    replies.forEach(reply => {
                                      const nestedReplies = posts.filter(nestedReply => nestedReply.parentId === reply.postId);
                                      acc.push(...nestedReplies);
                                    });
                                  }
                                  return acc;
                                }, [])
                                .map((post) => (
                                  <BoardRow key={post.postId}>
                                    <BoardCell 
                                      className={`title-cell ${post.parentId ? 'child-post' : ''}`}
                                      onClick={() => navigate(`/project/${id}/post/${post.postId}`)}
                                    >
                                      {post.parentId && <ReplyIndicator>↳</ReplyIndicator>}
                                      {post.title}
                                    </BoardCell>
                                    <BoardCell>
                                      {!post.parentId && (
                                        <ReplyButton onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/project/${id}/post/create`, {
                                            state: { parentPost: post }
                                          });
                                        }}>
                                          답글
                                        </ReplyButton>
                                      )}
                                      {post.parentId && (
                                        <ReplyButton onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/project/${id}/post/create`, {
                                            state: { 
                                              parentPost: {
                                                ...post,
                                                parentId: post.parentId // 대댓글의 부모를 root로 설정
                                              }
                                            }
                                          });
                                        }}>
                                          답글
                                        </ReplyButton>
                                      )}
                                    </BoardCell>
                                    <BoardCell onClick={() => navigate(`/project/${id}/post/${post.postId}`)}>
                                      {post.projectPostStatus === 'NOTIFICATION' ? '공지' : 
                                       post.projectPostStatus === 'QUESTION' ? '질문' : '일반'}
                                    </BoardCell>
                                    <BoardCell onClick={() => navigate(`/project/${id}/post/${post.postId}`)}>
                                      {post.creatorName}
                                    </BoardCell>
                                    <BoardCell onClick={() => navigate(`/project/${id}/post/${post.postId}`)}>
                                      {translateRole(post.creatorRole)}
                                    </BoardCell>
                                    <BoardCell onClick={() => navigate(`/project/${id}/post/${post.postId}`)}>
                                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '-'}
                                    </BoardCell>
                                    <BoardCell onClick={() => navigate(`/project/${id}/post/${post.postId}`)}>
                                      {post.modifiedAt ? new Date(post.modifiedAt).toLocaleDateString() : '-'}
                                    </BoardCell>
                                  </BoardRow>
                                  ))
                              )}
                            </tbody>
                          </BoardTable>
                        </BoardSection>
          </ContentContainer>
        ) : (
          <ErrorMessage>프로젝트를 찾을 수 없습니다.</ErrorMessage>
        )}
      </MainContent>
    </ContentWrapper>
    
    {isProposalModalOpen && selectedProposal && (
      <ModalOverlay onClick={() => {
        setIsProposalModalOpen(false);
        setStatusSummary(null); // 모달을 닫을 때 상태 요약 정보 초기화
      }}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>승인요청 상세보기</ModalTitle>
            <CloseButton onClick={() => setIsProposalModalOpen(false)}>×</CloseButton>
          </ModalHeader>
          <ModalBody>
            <ProposalTitle>{selectedProposal.title}</ProposalTitle>
            <ProposalInfo>
              <InfoItem>
                <InfoLabel>작성자</InfoLabel>
                <InfoValue>{selectedProposal.creator?.name} ({selectedProposal.creator?.companyName})</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>작성일</InfoLabel>
                <InfoValue>{formatDate(selectedProposal.createdAt)}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>상태</InfoLabel>
                <InfoValue>
                  <StatusBadge $status={selectedProposal.approvalProposalStatus}>
                    {selectedProposal.approvalProposalStatus === ApprovalProposalStatus.DRAFT && <FaEdit />}
                    {selectedProposal.approvalProposalStatus === ApprovalProposalStatus.UNDER_REVIEW && <FaClock />}
                    {selectedProposal.approvalProposalStatus === ApprovalProposalStatus.FINAL_APPROVED && <FaCheck />}
                    {selectedProposal.approvalProposalStatus === ApprovalProposalStatus.FINAL_REJECTED && <FaTimes />}
                    {getApprovalStatusText(selectedProposal.approvalProposalStatus)}
                  </StatusBadge>
                </InfoValue>
              </InfoItem>
            </ProposalInfo>
            <ContentSection>
              {selectedProposal.content}
            </ContentSection>
            
            {statusSummary && (
              <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>승인 상태 요약</h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 16px', backgroundColor: '#dcfce7', borderRadius: '8px', minWidth: '80px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: '#16a34a' }}>{statusSummary.approvedApproverCount}</div>
                    <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>승인</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fee2e2', borderRadius: '8px', minWidth: '80px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: '#dc2626' }}>{statusSummary.modificationRequestedApproverCount}</div>
                    <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>반려</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 16px', backgroundColor: '#dbeafe', borderRadius: '8px', minWidth: '80px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: '#2563eb' }}>{statusSummary.waitingApproverCount}</div>
                    <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '4px' }}>대기</div>
                  </div>
                  {statusSummary.totalApproverCount > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', minWidth: '80px' }}>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>{statusSummary.totalApproverCount}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>전체</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <ProposalSubtitle withMargin>
              <span>승인권자별 응답목록</span>
            </ProposalSubtitle>
            <ApprovalDecision approvalId={selectedProposal.id} />
          </ModalBody>
          <ModalFooter>
            <ModalButton onClick={() => {
              setIsProposalModalOpen(false);
              setStatusSummary(null); // 모달을 닫을 때 상태 요약 정보 초기화
            }}>닫기</ModalButton>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    )}
    {selectedApproval && (
      <ApprovalDetailModal onClick={closeModal}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <h3>{selectedApproval.title}</h3>
            <CloseButton onClick={closeModal}>&times;</CloseButton>
          </ModalHeader>
          
          <ModalSection>
            <h4>상태</h4>
            <StatusBadge $status={selectedApproval.status}>
              {getApprovalStatusText(selectedApproval.status)}
            </StatusBadge>
          </ModalSection>
          
          <ModalSection>
            <h4>요청 정보</h4>
            <p><strong>요청자:</strong> {selectedApproval.requestMemberName}</p>
            <p><strong>요청일:</strong> {new Date(selectedApproval.createdAt).toLocaleString()}</p>
            <p><strong>설명:</strong> {selectedApproval.description || '설명 없음'}</p>
          </ModalSection>
          
          <ModalSection>
            <h4>승인자 목록</h4>
            {selectedApproval.approvalList && selectedApproval.approvalList.length > 0 ? (
              <div>
                {selectedApproval.approvalList.map((approver, index) => (
                  <div key={index} style={{ 
                    margin: '8px 0', 
                    padding: '8px', 
                    borderBottom: index < selectedApproval.approvalList.length - 1 ? '1px solid #e2e8f0' : 'none' 
                  }}>
                    <p><strong>{approver.approverName}</strong></p>
                    <p>상태: {getApprovalStatusText(approver.status)}</p>
                    {approver.comment && <p>코멘트: {approver.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p>승인자가 지정되지 않았습니다.</p>
            )}
          </ModalSection>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button 
              onClick={closeModal}
              style={{
                background: '#f1f5f9',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              닫기
            </button>
          </div>
        </ModalContent>
      </ApprovalDetailModal>
    )}
    {/* 진행단계 추가/수정/삭제 모달 */}
    {showStageModal && (
      <ModalOverlay onClick={() => setShowStageModal(false)}>
        <StageModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>
              {stageAction === 'add' ? '진행 단계 추가' : 
               stageAction === 'edit' ? '진행 단계 수정' : '진행 단계 삭제'}
            </ModalTitle>
            <CloseButton onClick={() => setShowStageModal(false)}>×</CloseButton>
          </ModalHeader>
          <ModalBody>
            {stageAction !== 'delete' && (
              <ModalForm>
                <FormField>
                  <FormLabel>단계명</FormLabel>
                  <FormInput 
                    type="text" 
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    placeholder="단계명을 입력하세요"
                  />
                </FormField>
              </ModalForm>
            )}
            {stageAction === 'delete' && (
              <DeleteConfirmMessage>
                정말로 '{editingStage?.name}' 단계를 삭제하시겠습니까?
              </DeleteConfirmMessage>
            )}
          </ModalBody>
          <ModalFooter>
            {stageAction === 'add' && (
              <ActionButton onClick={handleAddStage}>추가</ActionButton>
            )}
            {stageAction === 'edit' && (
              <ActionButton onClick={handleEditStage}>수정</ActionButton>
            )}
            {stageAction === 'delete' && (
              <ActionButton className="delete" onClick={handleDeleteStage}>삭제</ActionButton>
            )}
            <CancelButton onClick={() => setShowStageModal(false)}>취소</CancelButton>
          </ModalFooter>
        </StageModalContent>
      </ModalOverlay>
    )}
    {showPositionModal && (
      <ModalOverlay onClick={() => setShowPositionModal(false)}>
        <StageModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>단계 순서 변경</ModalTitle>
            <CloseButton onClick={() => setShowPositionModal(false)}>×</CloseButton>
          </ModalHeader>
          <ModalBody>
            <DragInstructions>
              단계를 드래그하여 순서를 변경할 수 있습니다.
            </DragInstructions>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={progressList.map(stage => stage.id)}
                strategy={verticalListSortingStrategy}
              >
                <StageList>
                  {progressList.map((stage) => (
                    <SortableItem
                      key={stage.id}
                      id={stage.id}
                      name={stage.name}
                      position={stage.position}
                    />
                  ))}
                </StageList>
              </SortableContext>
            </DndContext>
          </ModalBody>
          <ModalFooter>
            <ActionButton onClick={() => handleSavePositions()}>
              순서 저장
            </ActionButton>
            <CancelButton onClick={() => setShowPositionModal(false)}>취소</CancelButton>
          </ModalFooter>
        </StageModalContent>
      </ModalOverlay>
    )}
    </PageContainer>
  );
};


const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0 270px;
  background-color: #f5f7fa;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  
  @media (max-width: 1400px) {
    padding: 0 10%;
  }
  
  @media (max-width: 768px) {
    padding: 0 5%;
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  margin-top: 60px;
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const ProjectInfoSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
`;

const ProjectHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 20px 0;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InfoLabel = styled.span`
  font-size: 14px;
  color: #64748b;
`;

const InfoValue = styled.span`
  font-size: 16px;
  color: #1e293b;
  font-weight: 500;
`;

const ReplyButton = styled.button`
  padding: 4px 8px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e2e8f0;
  }
`;

const StageSection = styled.div`
  background: transparent;
  width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
  padding: 0;
`;

const StageGrid = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 600px;
  overflow: hidden;
`;

const StageItem = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  height: 550px;
  max-height: 550px;
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  position: relative;
  margin: 0 auto;
  box-sizing: border-box;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const StageHeader = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  padding: 0;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 12px;
`;

const StageEditActions = styled.div`
  display: flex;
  gap: 8px;
  position: absolute;
  top: 12px;
  right: 16px;
  z-index: 5;
`;

const ShowMoreButton = styled.button`
  width: 100%;
  padding: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 12px;

  &:hover {
    background: #f1f5f9;
  }
`;

const AddButtonContainer = styled.div`
  position: sticky;
  bottom: 0;
  background: white;
  padding-top: 5px;
  margin-top: auto;
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #64748b;
`;

const ErrorMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #ef4444;
`;

const BoardSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
`;

const BoardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const CreateButton = styled.button`
  padding: 8px 16px;
  background: #2E7D32;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1B5E20;
  }
`;

const BoardTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
`;

const BoardCell = styled.td`
  padding: 8px 12px;
  font-size: 14px;
  color: #1e293b;
  border-bottom: 1px solid #e2e8f0;
  min-height: 30px;
  white-space: normal;
  word-break: break-word;
  background: transparent;
  vertical-align: middle;
  line-height: 1.5;

  &.title-cell {
    display: table-cell;
    align-items: center;
    max-width: 400px;
  }

  &.child-post {
    padding-left: 40px;
  }
`;

const BoardHeaderCell = styled.th`
  padding: 12px;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
`;

const BoardRow = styled.tr`
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f8fafc;
  }
`;

const ReplyIndicator = styled.span`
  color: #64748b;
  margin-right: 8px;
  font-size: 14px;
`;

const InfoItemFull = styled(InfoItem)`
  grid-column: 1 / -1;
`;

export default ProjectDetail;

const ProjectTitle = styled.h1`
  font-size: 32px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
`;

const ProjectDescription = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0 0 24px 0;
  line-height: 1.5;
`;

const DateContainer = styled.div`
  display: flex;
  gap: 32px;
  margin-bottom: 16px;
`;

const DateItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DateLabel = styled.span`
  font-size: 13px;
  color: #64748b;
`;

const DateValue = styled.span`
  font-size: 15px;
  color: #1e293b;
  font-weight: 500;
`;

const ActionCell = styled(BoardCell)`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-right: 24px;
  min-width: 100px;
  border-bottom: 1px solid #e2e8f0;
  align-items: center;
`;
const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
`;

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
  margin-left: 8px;
`;

const DropdownButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;

  &:hover {
    background: #f1f5f9;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 120px;
  z-index: 1000;
`;

const DropdownItem = styled.div`
  padding: 8px 16px;
  font-size: 14px;
  color: #1e293b;
  cursor: pointer;

  &:hover {
    background: #f8fafc;
  }

  &.delete {
    color: #dc2626;
    
    &:hover {
      background: #fee2e2;
    }
  }
`;

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
`;

const EmptyBoardCell = styled.td`
  text-align: center;
  padding: 48px 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const EmptyStateTitle = styled.h3`
  font-size: 16px;
  font-weight: 500;
  color: #1e293b;
  margin: 0;
`;

const EmptyStateDescription = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
`;

const StageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin: 0 auto;
  padding: 1px;
  padding-top: 20px;
  box-sizing: border-box;
`;

const StageTitle = styled.h3`
  margin: 0;
  padding: 5px;
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  
  &::before {
    content: '${props => props.title || ''}';
  }
  
  &::after {
    content: ': 승인요청 목록보기';
    font-size: 14px;
    font-weight: 400;
    color: #64748b;
    margin-left: 5px;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const StageSplitLayout = styled.div`
  display: flex;
  gap: 24px;
  margin-top: 10px;
  margin-bottom: 10px;
  flex-direction: column;
`;

// 모달 관련 스타일 컴포넌트 추가
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 24px;
  border-radius: 12px;
  width: 600px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  h3 {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    color: #1e293b;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #64748b;
  
  &:hover {
    color: #334155;
  }
`;

const ModalBody = styled.div`
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
`;

const ModalFooter = styled.div`
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const ModalButton = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;

  &:hover {
    background: #e2e8f0;
  }
`;

const ContentSection = styled.div`
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 24px;
  white-space: pre-wrap;
`;

const ProposalSubtitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  ${props => props.withMargin && `
    margin-top: 32px;
  `}
`;

// 날짜 포맷팅 함수
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const ApprovalDetailModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalSection = styled.div`
  margin-bottom: 20px;
  
  h4 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #475569;
  }
  
  p {
    margin: 8px 0;
    line-height: 1.5;
  }
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #1e293b;
`;

const ProposalTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1e293b;
`;

const ProposalInfo = styled.div`
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
`;

const ApprovalDecision = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
`;

const StageProgressHeader = styled.div`
  margin-bottom: 20px;
`;

const StageProgressTimeline = styled.div`
  position: relative;
  margin: 30px 0;
  padding: 0 10px;
`;

const StageProgressList = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
`;

const StageProgressItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 120px;
  cursor: pointer;
  ${props => props.active && `
    font-weight: bold;
  `}
`;

const StageProgressMarker = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.completed ? '#22c55e' : props.current ? '#3b82f6' : '#e2e8f0'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  svg {
    color: white;
    font-size: 20px;
  }
`;

const StageProgressDetails = styled.div`
  text-align: center;
`;

const StageProgressName = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #334155;
  margin-bottom: 4px;
`;

const StageProgressStatus = styled.div`
  font-size: 12px;
  color: #64748b;
`;

const StageProgressInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 32px;
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 20px;
`;

const ProgressInfoItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ProgressInfoLabel = styled.div`
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
`;

const ProgressInfoValue = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: #1e293b;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  width: ${props => props.width};
  height: 100%;
  background-color: #22c55e;
  border-radius: 2px;
`;

// 새로 추가된 스타일 컴포넌트
const StageHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StageActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1d4ed8;
  }
`;

const StageActionIcon = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #f3f4f6;
    color: #4f46e5;
  }
`;

const StageModalContent = styled(ModalContent)`
  max-width: 500px;
`;

const ModalForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FormLabel = styled.label`
  font-weight: 500;
  color: #374151;
`;

const FormInput = styled.input`
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.2);
  }
`;

const ActionButton = styled.button`
  padding: 10px 16px;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #4338ca;
  }
  
  &.delete {
    background-color: #ef4444;
    
    &:hover {
      background-color: #dc2626;
    }
  }
`;

const CancelButton = styled.button`
  padding: 10px 16px;
  background-color: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e5e7eb;
  }
`;

const DeleteConfirmMessage = styled.div`
  padding: 16px;
  background-color: #fee2e2;
  color: #b91c1c;
  border-radius: 4px;
  margin: 16px 0;
  text-align: center;
  font-weight: 500;
`;

const EmptyStageMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const AddStageButton = styled.button`
  padding: 8px 16px;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1d4ed8;
  }
`;

const ManageDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  width: 180px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: 5px;
  z-index: 100;
`;

const DragInstructions = styled.p`
  font-size: 14px;
  color: #64748b;
  margin-bottom: 16px;
`;

const StageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SortableItem = ({ id, name, position }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <SortableStageItem ref={setNodeRef} style={style}>
      <DragHandle {...attributes} {...listeners}>
        <FaGripVertical />
      </DragHandle>
      <StageItemContent>
        <StageItemName>{name}</StageItemName>
        <StageItemPosition>{position}번째</StageItemPosition>
      </StageItemContent>
    </SortableStageItem>
  );
};

const SortableStageItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
`;

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  cursor: grab;
  padding: 8px;
  
  &:active {
    cursor: grabbing;
  }
`;

const StageItemContent = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StageItemName = styled.div`
  font-weight: 500;
  color: #1e293b;
`;

const StageItemPosition = styled.div`
  color: #64748b;
  font-size: 14px;
`;
