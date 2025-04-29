import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Navbar from '../components/Navbar';
import { API_ENDPOINTS } from '../config/api';
import ApprovalDecision from '../components/ApprovalDecision';
import { ApprovalDecisionStatus, ApprovalProposalStatus } from '../constants/enums';
import ProjectStageProgress from '../components/ProjectStage';
import { FaEdit, FaTrashAlt, FaSave, FaTimes, FaCheck, FaClock } from 'react-icons/fa';
import approvalUtils from '../utils/approvalStatus';
import ApprovalProposal from '../components/ApprovalProposal';

const { getApprovalStatusText, getApprovalStatusBackgroundColor, getApprovalStatusTextColor } = approvalUtils;

// Styled Components
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

const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const BackButton = styled.button`
  padding: 8px 16px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #475569;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  
  &:hover {
    background: #e2e8f0;
  }
`;

const HeaderButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const SendApprovalButton = styled.button`
  background: #1E40AF;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: #1E3A8A;
    box-shadow: 0 2px 8px rgba(30, 64, 175, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const ProposalInfoSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
`;

const ProposalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const ProposalTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
`;

const ProposalInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
`;

const InfoItem = styled.div`
  display: flex;
  gap: 16px;
`;

const InfoLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  min-width: 80px;
`;

const InfoValue = styled.span`
  font-size: 14px;
  color: #1e293b;
`;

const ContentSection = styled.div`
  font-size: 16px;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 24px;
  padding: 24px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  white-space: pre-wrap;
`;

const DecisionSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
`;

const ProposalContent = styled.div`
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
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

const ResponseStatus = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => getApprovalStatusBackgroundColor(props.status)};
  color: ${props => getApprovalStatusTextColor(props.status)};
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

const StatusSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StatusItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: ${props => props.bgColor || '#f8fafc'};
  border-radius: 8px;
`;

const StatusCount = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.color || '#1e293b'};
`;

const StatusLabel = styled.div`
  font-size: 14px;
  color: ${props => props.color || '#64748b'};
`;

const ApprovalButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  gap: 12px;
`;

const ApprovalActionButton = styled.button`
  background: ${props => props.secondary ? '#f8fafc' : '#1E40AF'};
  color: ${props => props.secondary ? '#475569' : 'white'};
  border: ${props => props.secondary ? '1px solid #e2e8f0' : 'none'};
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: ${props => props.secondary ? '#e2e8f0' : '#1E3A8A'};
    box-shadow: ${props => props.secondary ? 'none' : '0 2px 8px rgba(30, 64, 175, 0.2)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const StatusSummaryTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  
  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const ActionsButton = styled.button`
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

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const ActionsMenuContainer = styled.div`
  position: relative;
  z-index: 10;
`;

const ActionsDropdown = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  width: 150px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  border: none;
  background: none;
  color: ${props => props.$danger ? '#dc2626' : '#475569'};
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: ${props => props.$danger ? '#fee2e2' : '#f1f5f9'};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
  overflow: auto;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 10px;
  font-size: 15px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 16px;
  font-family: inherit;
  box-sizing: border-box;
`;

const EditLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 6px;
`;

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
    switch (props.status) {
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
    switch (props.status) {
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

const ApprovalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('진행중인 프로젝트');
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressList, setProgressList] = useState([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [projectId, setProjectId] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [statusSummary, setStatusSummary] = useState(null);
  const [sendingApproval, setSendingApproval] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const approvalDecisionRef = useRef(null);
  const actionsMenuRef = useRef(null);

  useEffect(() => {
    const checkUserRole = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          const isCustomerUser = decodedToken.role === 'CUSTOMER';
          setIsCustomer(isCustomerUser);
        } catch (error) {
          console.error('Error decoding token:', error);
          setIsCustomer(false);
        }
      }
    };
    
    checkUserRole();
    fetchProposalDetail();
  }, [id]);

  // 프로젝트 진행 상태 조회
  useEffect(() => {
    if (projectId) {
      console.log("프로젝트 ID 감지됨:", projectId);
      fetchProjectProgress();
    }
  }, [projectId]);

  const fetchProposalDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("승인요청 상세 조회 시작:", id);
      
      const response = await fetch(API_ENDPOINTS.APPROVAL.DETAIL(id), {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('승인요청 상세 조회에 실패했습니다.');
      }

      const data = await response.json();
      console.log("승인요청 데이터:", data);
      
      // 백엔드 응답 필드 확인 (proposalStatus 또는 approvalProposalStatus)
      let proposalStatus = data.proposalStatus || data.approvalProposalStatus;
      
      // 승인권자가 없는 경우 "요청전" 상태로 표시
      if (data.totalApproverCount === 0 || 
          (Array.isArray(data.approvers) && data.approvers.length === 0) ||
          proposalStatus === ApprovalProposalStatus.DRAFT) {
        proposalStatus = ApprovalProposalStatus.DRAFT;
        console.log("승인권자가 없거나 요청 전 상태로 '요청전'으로 표시합니다.");
      }
      
      // 상태가 결정된 후 로그 출력
      if (proposalStatus) {
        console.log("승인요청 상태:", proposalStatus, "→", getApprovalStatusText(proposalStatus));
        
        // 상태 값을 임시로 데이터에 저장 (원본 데이터 유지)
        data.displayStatus = proposalStatus;
      } else {
        console.warn("승인요청 상태 필드를 찾을 수 없습니다:", Object.keys(data));
      }
      
      // 승인권자 카운트 정보 확인
      if (data.totalApproverCount !== undefined) {
        console.log(`승인권자 총 ${data.totalApproverCount}명 중 ${data.approvedApproverCount || 0}명 승인 완료`);
        
        const waitingOrBeforeRequest = (data.waitingApproverCount || 0) + (data.beforeRequestCount || 0);
        console.log(`대기중: ${waitingOrBeforeRequest}명, 반려: ${data.modificationRequestedApproverCount || 0}명`);
        
        // 모든 승인권자가 승인을 완료했는지 확인
        const isAllApproved = data.totalApproverCount > 0 && 
          data.approvedApproverCount === data.totalApproverCount;
        
        console.log(`모두 승인됨: ${isAllApproved ? '예' : '아니오'}`);
      }
      
      // 마지막 전송 시간 추적 및 변경사항 감지
      if (data.lastSentAt) {
        setLastSentAt(new Date(data.lastSentAt));
        
        // 마지막 전송 이후 변경 여부 확인 (updatedAt과 lastSentAt 비교)
        if (data.updatedAt && data.lastSentAt) {
          const updatedTime = new Date(data.updatedAt).getTime();
          const lastSentTime = new Date(data.lastSentAt).getTime();
          const changes = updatedTime > lastSentTime;
          setHasChanges(changes);
          console.log(`마지막 전송 후 변경사항: ${changes ? '있음' : '없음'}`);
        }
      } else {
        // 전송 이력이 없는 경우
        setLastSentAt(null);
        setHasChanges(true); // 처음 전송하는 경우 변경사항 있음으로 간주
      }
      
      setProposal(data);
      
      // 프로젝트 ID 설정
      if (data.projectId) {
        console.log("프로젝트 ID 설정:", data.projectId);
        setProjectId(data.projectId);
      } else {
        console.error("승인요청에 프로젝트 ID가 없습니다");
      }
      
      // 승인 상태 요약 정보 조회
      fetchStatusSummary();
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching proposal detail:', error);
      setError('승인요청 상세 정보를 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  // 프로젝트 진행 단계 조회
  const fetchProjectProgress = async () => {
    try {
      setProgressLoading(true);
      const token = localStorage.getItem('token');
      console.log("프로젝트 진행 단계 조회 시작:", projectId);
      
      const response = await fetch(`${API_ENDPOINTS.PROJECT_DETAIL(projectId)}/progress`, {
        headers: {
          'Authorization': token
        }
      });
      
      if (!response.ok) {
        throw new Error('프로젝트 진행 상태 조회에 실패했습니다.');
      }
      
      const data = await response.json();
      console.log("프로젝트 진행 단계 데이터:", data);
      
      if (data.progressList && data.progressList.length > 0) {
        setProgressList(data.progressList);
        console.log("프로젝트 진행 단계 설정 완료:", data.progressList.length, "개 항목");
        
        // 승인 요청이 속한 단계 찾기
        const stageIndex = data.progressList.findIndex(
          stage => stage.id === proposal.progressId
        );
        
        if (stageIndex >= 0) {
          console.log("현재 단계 찾음:", stageIndex, data.progressList[stageIndex].name);
          setCurrentStageIndex(stageIndex);
        } else {
          console.log("승인요청의 단계를 찾지 못함. progressId:", proposal.progressId);
        }
      } else {
        console.log("프로젝트 진행 단계 데이터가 없거나 비어있습니다");
      }
      setProgressLoading(false);
    } catch (error) {
      console.error('Error fetching project progress:', error);
      setProgressLoading(false);
    }
  };

  // 승인 상태 요약 정보 조회
  const fetchStatusSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("승인요청 상태 요약 조회 시작:", id);
      
      const response = await fetch(API_ENDPOINTS.APPROVAL.STATUS_SUMMARY(id), {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('승인요청 상태 요약 조회에 실패했습니다.');
      }

      const data = await response.json();
      console.log("승인요청 상태 요약 데이터:", data);
      
      // 주요 상태 정보 로그 출력
      console.log(`총 승인권자: ${data.totalApproverCount}명`);
      console.log(`승인 완료: ${data.approvedApproverCount}명`);
      console.log(`반려: ${data.modificationRequestedApproverCount}명`);
      console.log(`대기중: ${data.waitingApproverCount}명`);
      console.log(`요청전: ${data.beforeRequestCount}명`);
      console.log(`최종 상태: ${getApprovalStatusText(data.proposalStatus)}`);
      
      setStatusSummary(data);
    } catch (error) {
      console.error('Error fetching status summary:', error);
      // 요약 정보는 실패해도 전체 페이지에 영향 없음
    }
  };

  const handleMenuClick = (menuItem) => {
    setActiveMenuItem(menuItem);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 승인요청 전송 함수
  const handleSendApproval = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      if (!proposal.id) {
        console.error('승인 요청 ID를 찾을 수 없습니다.');
        return;
      }

      // 승인권자 수 확인
      console.log('승인권자 수 확인 중...');
      try {
        const approverCheckResponse = await fetch(API_ENDPOINTS.APPROVAL.APPROVERS(proposal.id), {
          headers: {
            'Authorization': token,
          }
        });
        
        if (approverCheckResponse.ok) {
          let approverData;
          const responseText = await approverCheckResponse.text();
          
          if (responseText) {
            try {
              approverData = JSON.parse(responseText);
              console.log('승인권자 데이터:', approverData);
              
              // 다양한 응답 구조 처리
              let approvers = [];
              if (approverData.approverResponses) {
                approvers = approverData.approverResponses;
              } else if (Array.isArray(approverData)) {
                approvers = approverData;
              } else if (approverData.data && Array.isArray(approverData.data)) {
                approvers = approverData.data;
              }
              
              if (approvers.length === 0) {
                alert('승인권자가 한 명 이상 등록되어야 승인요청을 전송할 수 있습니다.');
                return;
              }
            } catch (e) {
              console.error('승인권자 데이터 파싱 오류:', e);
            }
          }
        } else {
          console.error('승인권자 확인 실패:', approverCheckResponse.status);
        }
      } catch (error) {
        console.error('승인권자 확인 중 오류:', error);
      }

      const isConfirmed = window.confirm('승인 요청을 전송하시겠습니까?');
      if (!isConfirmed) {
        return;
      }

      setSendingApproval(true);

      const response = await fetch(API_ENDPOINTS.APPROVAL.SEND(proposal.id), {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('승인 요청 전송 실패:', response.status, errorText);
        
        // 특정 에러 코드 및 메시지 처리
        if (errorText.includes('AP006') || errorText.includes('지정된 승인권자가 있어야 승인요청을 보낼 수 있습니다')) {
          alert('승인권자가 한 명 이상 등록되어야 승인요청을 전송할 수 있습니다.');
          setSendingApproval(false);
          return;
        }
        
        // 400 에러 특별 처리
        if (response.status === 400) {
          if (errorText.includes('이미 전송된 승인요청')) {
            alert('이미 전송된 승인요청입니다. 내용 변경 후 다시 시도해주세요.');
          } else {
            alert('승인요청 전송에 실패했습니다. 필수 정보가 모두 입력되었는지 확인해주세요.');
          }
          setSendingApproval(false);
          return;
        }
        
        alert(`승인 요청 전송에 실패했습니다. (${response.status})`);
        setSendingApproval(false);
        return;
      }

      alert('승인 요청이 성공적으로 전송되었습니다.');
      setLastSentAt(new Date());
      setHasChanges(false);
      await fetchProposalDetail();
      await fetchStatusSummary();
    } catch (error) {
      console.error('승인 요청 중 오류 발생:', error);
      alert('승인 요청 중 오류가 발생했습니다.');
    } finally {
      setSendingApproval(false);
    }
  };

  // 승인권자 수정 모달 열기 함수
  const handleOpenEditApprovers = () => {
    // 클래스명을 가진 버튼 찾아서 클릭
    const editButton = document.querySelector('.approvers-edit-button');
    if (editButton) {
      editButton.click();
    } else {
      alert('승인권자 수정 기능을 사용할 수 없습니다.');
    }
  };

  // 수정 및 삭제 핸들러 추가
  const handleEditProposal = () => {
    // 수정 모드로 전환
    setEditTitle(proposal.title);
    setEditContent(proposal.content);
    setIsEditing(true);
    setShowActionsMenu(false);
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // 수정 내용 저장
  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      // 토큰 새로 가져오기
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }
      
      console.log('수정 요청 시작:', proposal.id);
      
      // 요청 데이터 로깅
      const requestData = {
        title: editTitle,
        content: editContent
      };
      console.log('수정 요청 데이터:', requestData);
      console.log('API 엔드포인트:', API_ENDPOINTS.APPROVAL.MODIFY(proposal.id));
      
      const response = await fetch(API_ENDPOINTS.APPROVAL.MODIFY(proposal.id), {
        method: 'PATCH', 
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('수정 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('수정 응답 에러 내용:', errorText);
        
        // 권한 오류(403)인 경우 특별 처리
        if (response.status === 403) {
          alert('이 승인요청을 수정할 권한이 없습니다. 작성자 또는 관리자만 수정할 수 있습니다.');
          return;
        }
        
        throw new Error(`승인요청 수정 실패 (${response.status}): ${errorText}`);
      }

      // 응답 데이터 확인 시도
      let responseData;
      try {
        responseData = await response.json();
        console.log('수정 응답 데이터:', responseData);
      } catch (jsonError) {
        console.log('수정 응답 데이터 없음 (json 파싱 오류)');
      }

      // 수정된 정보로 proposal 업데이트 (서버 응답이 없는 경우에도 UI 업데이트)
      setProposal({
        ...proposal,
        title: editTitle,
        content: editContent,
        updatedAt: new Date().toISOString()
      });
      
      console.log('수정 완료, UI 업데이트');
      setIsEditing(false);
      setHasChanges(true);
      alert('승인요청이 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('승인요청 수정 중 오류:', error);
      alert(`승인요청 수정에 실패했습니다: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProposal = async () => {
    if (!proposal || !proposal.id) return;
    
    if (!window.confirm('정말로 이 승인요청을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.APPROVAL.DELETE(proposal.id), {
        method: 'DELETE',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('승인요청 삭제에 실패했습니다.');
      }

      alert('승인요청이 성공적으로 삭제되었습니다.');
      navigate(-1); // 이전 페이지로 이동
    } catch (error) {
      console.error('Error deleting proposal:', error);
      alert('승인요청 삭제에 실패했습니다.');
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
            <PageTitle>승인요청 상세보기</PageTitle>
            <HeaderButtonsContainer>
              <BackButton onClick={handleBack}>
                ← 돌아가기
              </BackButton>
            </HeaderButtonsContainer>
          </Header>

          {loading ? (
            <LoadingMessage>데이터를 불러오는 중...</LoadingMessage>
          ) : error ? (
            <ErrorMessage>{error}</ErrorMessage>
          ) : proposal ? (
            <ContentContainer>
              {/* 프로젝트 단계 진행 상황 표시 */}
              {progressLoading ? (
                <div style={{ marginBottom: '24px', padding: '20px', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <p>프로젝트 진행 단계를 불러오는 중...</p>
                </div>
              ) : progressList && progressList.length > 0 ? (
                <div style={{ marginBottom: '24px' }}>
                  <ProjectStageProgress 
                    progressList={progressList}
                    currentStageIndex={currentStageIndex}
                    setCurrentStageIndex={setCurrentStageIndex}
                    title="프로젝트 진행 단계"
                  />
                </div>
              ) : null}
              
              {/* 콘텐츠 영역을 그리드로 배치 */}
              <ContentGrid>
                {/* 왼쪽 영역: 제안 정보 및 승인 결정 */}
                <div>
                  <ProposalInfoSection>
                    {progressList && progressList.length > 0 && currentStageIndex >= 0 && currentStageIndex < progressList.length && (
                      <ProposalSubtitle style={{ marginTop: 0, marginBottom: '8px', color: '#4b5563' }}>
                        {progressList[currentStageIndex].name}
                      </ProposalSubtitle>
                    )}
                    
                    {/* 요청 상태를 제목 위에 표시 */}
                    <StatusContainer>
                      <StatusBadge status={proposal.approvalProposalStatus}>
                        {getApprovalStatusText(proposal.approvalProposalStatus)}
                      </StatusBadge>
                      <div style={{ flex: 1 }}></div>
                      
                      {!isEditing && (
                        <ActionsMenuContainer ref={actionsMenuRef}>
                          <ActionsButton 
                            onClick={() => setShowActionsMenu(!showActionsMenu)}
                          >
                            ⋮
                          </ActionsButton>
                          {showActionsMenu && (
                            <ActionsDropdown>
                              <DropdownItem 
                                onClick={handleEditProposal}
                              >
                                <FaEdit /> 수정
                              </DropdownItem>
                              <DropdownItem 
                                $danger
                                onClick={handleDeleteProposal}
                              >
                                <FaTrashAlt /> 삭제
                              </DropdownItem>
                            </ActionsDropdown>
                          )}
                        </ActionsMenuContainer>
                      )}
                    </StatusContainer>
                    
                    {isEditing ? (
                      <>
                        <div style={{ marginBottom: '16px' }}>
                          <EditLabel>제목</EditLabel>
                          <Input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                          />
                        </div>
                        
                        <div style={{ marginBottom: '16px' }}>
                          <EditLabel>내용</EditLabel>
                          <TextArea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                          />
                        </div>
                        
                        <ApprovalButtonContainer>
                          <ApprovalActionButton 
                            secondary
                            onClick={handleCancelEdit}
                          >
                            <FaTimes /> 취소
                          </ApprovalActionButton>
                          <ApprovalActionButton 
                            onClick={handleSaveEdit}
                            disabled={saving}
                          >
                            <FaSave /> {saving ? '저장 중...' : '저장'}
                          </ApprovalActionButton>
                        </ApprovalButtonContainer>
                      </>
                    ) : (
                      <>
                        <ProposalTitle>{proposal.title}</ProposalTitle>
                        <ProposalInfo>
                          <InfoItem>
                            <InfoLabel>작성자</InfoLabel>
                            <InfoValue>{proposal.creator?.name} ({proposal.creator?.companyName})</InfoValue>
                          </InfoItem>
                          <InfoItem>
                            <InfoLabel>작성일</InfoLabel>
                            <InfoValue>{formatDate(proposal.createdAt)}</InfoValue>
                          </InfoItem>
                        </ProposalInfo>

                        <ProposalContent> 
                          <div style={{ 
                            fontSize: '16px',
                            color: '#475569',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {proposal.content}
                          </div>
                        </ProposalContent>
                        
                        {/* 승인요청 전송 버튼과 승인권자 수정 버튼을 함께 배치 */}
                        {!isCustomer && (
                          <ApprovalButtonContainer>
                            <ApprovalActionButton 
                              secondary
                              onClick={handleOpenEditApprovers}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                              </svg>
                              승인권자 수정
                            </ApprovalActionButton>
                            <ApprovalActionButton 
                              onClick={handleSendApproval} 
                              disabled={
                                sendingApproval || 
                                (proposal.displayStatus !== ApprovalProposalStatus.DRAFT && !hasChanges)
                              }
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 2L11 13"></path>
                                <path d="M22 2L15 22L11 13L2 9L22 2z"></path>
                              </svg>
                              {sendingApproval ? '전송 중...' : (
                                !proposal.lastSentAt ? '승인요청 전송' : '승인요청 재전송'
                              )}
                            </ApprovalActionButton>
                          </ApprovalButtonContainer>
                        )}
                      </>
                    )}
                  </ProposalInfoSection>
                  
                  {/* 승인 현황 요약 정보를 ApprovalDecision 컴포넌트로 전달 */}
                  <div id="approvalDecisionComponent">
                    <ApprovalDecision approvalId={proposal.id} statusSummary={statusSummary} />
                  </div>
                </div>
              </ContentGrid>
            </ContentContainer>
          ) : (
            <ErrorMessage>승인요청을 찾을 수 없습니다.</ErrorMessage>
          )}
        </MainContent>
      </ContentWrapper>
    </PageContainer>
  );
};

export default ApprovalDetail; 