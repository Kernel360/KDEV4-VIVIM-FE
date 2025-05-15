import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Navbar from '../components/Navbar';
import { API_ENDPOINTS } from '../config/api';
import ApprovalDecision from '../components/ApprovalDecision';
import { ApprovalDecisionStatus, ApprovalProposalStatus } from '../constants/enums';
import ProjectStageProgress from '../components/ProjectStage';
import { FaEdit, FaTrashAlt, FaSave, FaTimes, FaCheck, FaClock } from 'react-icons/fa';
import approvalUtils from '../utils/approvalStatus';
import ApprovalProposal from '../components/ApprovalProposal';
import axiosInstance from '../utils/axiosInstance';
import MainContent from '../components/common/MainContent';
import { useAuth } from '../hooks/useAuth';
import FileLinkUploader from '../components/common/FileLinkUploader';

const { getApprovalStatusText, getApprovalStatusBackgroundColor, getApprovalStatusTextColor } = approvalUtils;

// Styled Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
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
  background: none;
  border: none;
  color: #64748b;
  font-size: 15px;
  cursor: pointer;
  padding: 8px 0;
  
  &:hover {
    color: #2E7D32;
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
  background: ${props => props.$secondary ? '#f8fafc' : '#1E40AF'};
  color: ${props => props.$secondary ? '#475569' : 'white'};
  border: ${props => props.$secondary ? '1px solid #e2e8f0' : 'none'};
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
    background: ${props => props.$secondary ? '#e2e8f0' : '#1E3A8A'};
    box-shadow: ${props => props.$secondary ? 'none' : '0 2px 8px rgba(30, 64, 175, 0.2)'};
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

const AttachmentsSection = styled.div`
  width: 100%;
  padding: 16px 0;
  margin: 16px 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  gap: 24px;
`;

const AttachmentContainer = styled.div`
  width: 50%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;

  &:first-child::after {
    content: '';
    position: absolute;
    right: -12px;
    top: 0;
    bottom: 0;
    width: 1px;
    background-color: #e2e8f0;
  }
`;

const AttachmentGroup = styled.div`
  width: 100%;
`;

const GroupTitle = styled.h4`
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  margin: 0 0 8px 0;
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  
  &:hover {
    background-color: #f1f5f9;
  }
`;

const FileIcon = styled.span`
  font-size: 16px;
`;

const FileName = styled.span`
  font-size: 14px;
  color: #1e293b;
`;

const LinkList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LinkItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  &:hover {
    background-color: #f1f5f9;
  }
`;

const LinkIcon = styled.span`
  font-size: 16px;
`;

const LinkTitle = styled.span`
  font-size: 14px;
  color: #2563eb;
  text-decoration: underline;
`;

const PlaceholderMessage = styled.p`
  color: #64748b;
  font-size: 14px;
  margin: 0;
  text-align: center;
  padding: 8px;
  background-color: #f8fafc;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
`;

const FileInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const FileButton = styled.button`
  padding: 8px 12px;
  background-color: white;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background-color: #f8fafc;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const AddLinkButton = styled(FileButton)`
  &:hover {
    background-color: #f8fafc;
  }

  ${props => props.$hasValue && `
    background-color: #2E7D32;
    color: white;
    border-color: #2E7D32;

    &:hover {
      background-color: #1B5E20;
      border-color: #1B5E20;
    }
  `}
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  
  &:hover {
    color: #b91c1c;
  }
`;

const ApproversSection = styled.div`
  margin-top: 24px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const ApproversHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
`;

const ApproversTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const ApproversList = styled.div`
  padding: 0;
`;

const ApproverItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ApproverInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ApproverName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
`;

const ApproverCompany = styled.span`
  font-size: 12px;
  color: #64748b;
`;

const ApproverStatus = styled.span`
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  background-color: ${props => {
    switch (props.$status) {
      case 'APPROVED':
        return '#f0fdf4';
      case 'REJECTED':
        return '#fef2f2';
      case 'MODIFICATION_REQUESTED':
        return '#fff7ed';
      default:
        return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'APPROVED':
        return '#166534';
      case 'REJECTED':
        return '#991b1b';
      case 'MODIFICATION_REQUESTED':
        return '#9a3412';
      default:
        return '#475569';
    }
  }};
`;

const StatusMessage = styled.div`
  padding: 16px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-top: 16px;
  text-align: center;
  color: #475569;
  font-size: 14px;
  line-height: 1.5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  svg {
    color: #2E7D32;
    flex-shrink: 0;
  }
`;

const RejectionNotice = styled.div`
  background-color: #FEF2F2;
  border: 1px solid #FEE2E2;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #991B1B;
  font-size: 14px;
  line-height: 1.5;

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const ApprovalDetail = () => {
  const { projectId, approvalId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isDeveloper = user?.projectUserManagerRole === 'DEVELOPER';
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isApproversModalOpen, setIsApproversModalOpen] = useState(false);
  const [progressList, setProgressList] = useState([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progressLoading, setProgressLoading] = useState(false);
  const [sendingApproval, setSendingApproval] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const approvalDecisionRef = useRef(null);
  const actionsMenuRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [editFiles, setEditFiles] = useState([]);
  const [editLinks, setEditLinks] = useState([]);
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [deletedFileIds, setDeletedFileIds] = useState([]);
  const [deletedLinkIds, setDeletedLinkIds] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [showApproverGuide, setShowApproverGuide] = useState(false);

  useEffect(() => {
    if (projectId && approvalId) {
      console.log('프로젝트 ID와 승인 ID로 데이터를 가져옵니다:', { projectId, approvalId });
      fetchProposalDetail();
      fetchFiles();
      fetchLinks();
    }
  }, [projectId, approvalId]);

  // 프로젝트 진행 단계 조회
  const fetchProjectProgress = async () => {
    try {
      setProgressLoading(true);
      console.log("프로젝트 진행 단계 조회 시작:", projectId);
      
      const { data } = await axiosInstance.get(`${API_ENDPOINTS.PROJECT_DETAIL(projectId)}/progress`);
      console.log("프로젝트 진행 단계 데이터:", data);
      
      if (data.progressList && data.progressList.length > 0) {
        setProgressList(data.progressList);
        console.log("프로젝트 진행 단계 설정 완료:", data.progressList.length, "개 항목");
        
        // 승인 요청이 속한 단계 찾기
        const stageIndex = data.progressList.findIndex(
          stage => stage.id === proposal?.progressId
        );
        
        if (stageIndex >= 0) {
          console.log("현재 단계 찾음:", stageIndex, data.progressList[stageIndex].name);
          setCurrentStageIndex(stageIndex);
        } else {
          console.log("승인요청의 단계를 찾지 못함. progressId:", proposal?.progressId);
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

  const fetchProposalDetail = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(API_ENDPOINTS.APPROVAL.DETAIL(approvalId), {
        withCredentials: true
      });
      console.log('승인요청 상세 응답:', JSON.stringify(data, null, 2));
      setProposal(data);
      
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
        data.displayStatus = proposalStatus;
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
      
      setLoading(false);
    } catch (error) {
      console.error('승인요청 상세 조회 실패:', error);
      setError('승인요청을 불러오는데 실패했습니다.');
      setLoading(false);
    }
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
      if (!proposal.id) {
        console.error('승인 요청 ID를 찾을 수 없습니다.');
        return;
      }

      // 승인권자 수 확인
      console.log('승인권자 수 확인 중...');
      try {
        const { data: approverData } = await axiosInstance.get(API_ENDPOINTS.APPROVAL.APPROVERS(proposal.id), {
          withCredentials: true
        });
        
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
      } catch (error) {
        console.error('승인권자 확인 중 오류:', error);
        return;
      }

      const isConfirmed = window.confirm('승인 요청을 전송하시겠습니까?\n전송 후에는 승인권자를 수정할 수 없습니다.');
      if (!isConfirmed) {
        return;
      }

      setSendingApproval(true);

      try {
        const response = await axiosInstance.post(API_ENDPOINTS.APPROVAL.SEND(proposal.id), {}, {
          withCredentials: true
        });

        if (response.data) {
          alert('승인 요청이 성공적으로 전송되었습니다.\n이제 승인권자를 수정할 수 없습니다.');
          setLastSentAt(new Date());
          setHasChanges(false);
          await fetchProposalDetail();
        }
      } catch (error) {
        console.error('승인 요청 중 오류 발생:', error);
        if (error.response?.status === 400) {
          if (error.response.data?.message?.includes('이미 전송된 승인요청')) {
            alert('이미 전송된 승인요청입니다.');
          } else {
            alert(error.response.data?.message || '승인요청 전송에 실패했습니다.');
          }
        } else {
          alert('승인요청 전송에 실패했습니다.');
        }
      }
    } finally {
      setSendingApproval(false);
    }
  };

  // 재승인요청 전송 함수 수정
  const handleResendApproval = async () => {
    try {
      if (!proposal.id) {
        console.error('승인 요청 ID를 찾을 수 없습니다.');
        return;
      }

      // 변경사항이 없는 경우 알림 표시 후 함수 종료
      if (!hasChanges) {
        alert('승인요청 상세 내용에 수정사항이 없습니다.\n수정 후 재승인요청을 전송해주세요.');
        return;
      }

      // 변경사항이 있는 경우에만 확인 메시지 표시
      const isConfirmed = window.confirm(
        '고객사의 승인요청 반려에 따른 수정사항 반영이 필요합니다.\n' +
        '반영된 수정사항은 승인요청 수정 버튼을 눌러 작성해주세요.\n\n' +
        '재승인 요청을 전송하시겠습니까?'
      );
      
      if (!isConfirmed) {
        return;
      }

      setSendingApproval(true);

      try {
        const response = await axiosInstance.post(API_ENDPOINTS.APPROVAL.SEND(proposal.id), {}, {
          withCredentials: true
        });

        if (response.data) {
          alert('재승인 요청이 성공적으로 전송되었습니다.');
          setLastSentAt(new Date());
          setHasChanges(false);
          await fetchProposalDetail();
        }
      } catch (error) {
        console.error('재승인 요청 중 오류 발생:', error);
        if (error.response?.status === 400) {
          alert(error.response.data?.message || '재승인요청 전송에 실패했습니다.');
        } else {
          alert('재승인요청 전송에 실패했습니다.');
        }
      }
    } finally {
      setSendingApproval(false);
    }
  };

  // 승인권자 수정 모달 열기 함수
  const handleOpenEditApprovers = () => {
    console.log('승인권자 수정 모달 열기 시도:', { projectId, locationState: location.state, proposal });
    
    if (!projectId) {
      console.error('프로젝트 ID를 찾을 수 없습니다. 프로젝트 상세 페이지에서 접근해주세요.');
      alert('프로젝트 상세 페이지에서 접근해주세요.');
      return;
    }
    
    setIsApproversModalOpen(true);
  };

  const handleCloseEditApprovers = () => {
    setIsApproversModalOpen(false);
  };

  // 수정 및 삭제 핸들러 추가
  const handleEditProposal = () => {
    setEditTitle(proposal.title);
    setEditContent(proposal.content);
    setEditFiles(files);
    setEditLinks(links);
    setIsEditing(true);
    setShowActionsMenu(false);
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFiles(files);
    setEditLinks(links);
    setDeletedFileIds([]); // 삭제 목록 초기화
    setDeletedLinkIds([]); // 링크 삭제 목록 초기화
  };

  const handleFileDelete = (indexToDelete) => {
    const fileToDelete = editFiles[indexToDelete];
    if (fileToDelete.id) {
      // 기존 파일인 경우 삭제 목록에 추가
      setDeletedFileIds(prev => [...prev, fileToDelete.id]);
    }
    // 파일 목록에서 제거
    setEditFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToDelete));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setEditFiles(prevFiles => [...prevFiles, ...selectedFiles]);
  };

  const handleLinkDelete = (indexToDelete) => {
    const linkToDelete = editLinks[indexToDelete];
    if (linkToDelete.id) {
      // 기존 링크인 경우 삭제 목록에 추가
      setDeletedLinkIds(prev => [...prev, linkToDelete.id]);
    }
    // 링크 목록에서 제거
    setEditLinks(prevLinks => prevLinks.filter((_, index) => index !== indexToDelete));
  };

  const handleAddLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      alert('링크 제목과 URL을 모두 입력해주세요.');
      return;
    }

    // URL 형식 검증
    try {
      new URL(newLink.url);
    } catch (e) {
      alert('올바른 URL 형식이 아닙니다.');
      return;
    }

    // 새 링크 추가
    setEditLinks(prevLinks => [...prevLinks, { ...newLink }]);
    
    // 입력 필드 초기화
    setNewLink({ title: '', url: '' });
  };

  const handleFilesChange = (newFiles) => {
    setEditFiles(newFiles);
  };

  const handleLinksChange = (newLinks) => {
    setEditLinks(newLinks);
  };

  // 수정 내용 저장
  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      
      console.log('수정 요청 시작:', approvalId);
      
      // 1. 기본 정보 수정
      const requestData = {
        title: editTitle,
        content: editContent
      };
      
      await axiosInstance.patch(API_ENDPOINTS.APPROVAL.MODIFY(approvalId), requestData);

      // 2. 삭제된 파일 처리
      for (const fileId of deletedFileIds) {
        await axiosInstance.patch(API_ENDPOINTS.APPROVAL.FILE_DELETE(fileId));
      }

      // 3. 삭제된 링크 처리
      for (const linkId of deletedLinkIds) {
        await axiosInstance.patch(API_ENDPOINTS.APPROVAL.DELETE_LINK(linkId));
      }

      // 4. 새 파일 업로드 처리
      for (const file of editFiles) {
        // 기존 파일인 경우 건너뛰기
        if (file.id) continue;

        // 새 파일인 경우에만 업로드
        const { data: { preSignedUrl, fileId } } = await axiosInstance.post(
          API_ENDPOINTS.APPROVAL.FILE_PRESIGNED(approvalId),
          {
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type
          }
        );

        // S3에 파일 업로드
        await fetch(preSignedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type
          }
        });
      }

      // 5. 새 링크 저장 처리
      for (const link of editLinks) {
        // 기존 링크인 경우 건너뛰기
        if (link.id) continue;

        await axiosInstance.post(API_ENDPOINTS.APPROVAL.LINKS(approvalId), link);
      }

      // 6. 파일 목록 새로고침
      await fetchFiles();
      // 7. 링크 목록 새로고침
      await fetchLinks();

      // 8. UI 업데이트
      setProposal({
        ...proposal,
        title: editTitle,
        content: editContent,
        updatedAt: new Date().toISOString()
      });
      
      setIsEditing(false);
      setHasChanges(true);
      setDeletedFileIds([]); // 삭제 목록 초기화
      setDeletedLinkIds([]); // 링크 삭제 목록 초기화
      alert('승인요청이 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('승인요청 수정 중 오류:', error);
      if (error.response?.status === 403) {
        alert('이 승인요청을 수정할 권한이 없습니다. 작성자 또는 관리자만 수정할 수 있습니다.');
      } else {
        alert(`승인요청 수정에 실패했습니다: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProposal = async () => {
    if (!proposal || !approvalId) return;
    
    if (!window.confirm('정말로 이 승인요청을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await axiosInstance.delete(API_ENDPOINTS.APPROVAL.DELETE(approvalId));
      alert('승인요청이 성공적으로 삭제되었습니다.');
      navigate(-1); // 이전 페이지로 이동
    } catch (error) {
      console.error('Error deleting proposal:', error);
      alert('승인요청 삭제에 실패했습니다.');
    }
  };

  const fetchFiles = async () => {
    try {
      // 권한 체크
      if (!user.isAdmin && !user.isClient && !user.isDeveloperManager) {
        console.log('파일 조회 권한이 없습니다.');
        return;
      }

      const response = await axiosInstance.get(`${API_ENDPOINTS.APPROVAL.FILES(approvalId)}`, {
        withCredentials: true
      });
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
      if (error.response?.status === 403) {
        console.log('파일 조회 권한이 없습니다.');
      }
      setFiles([]);
    }
  };

  const fetchLinks = async () => {
    try {
      // 권한 체크
      if (!user.isAdmin && !user.isClient && !user.isDeveloperManager) {
        console.log('링크 조회 권한이 없습니다.');
        return;
      }

      const response = await axiosInstance.get(`${API_ENDPOINTS.APPROVAL.GET_LINKS(approvalId)}`, {
        withCredentials: true
      });
      setLinks(response.data);
    } catch (error) {
      console.error('Error fetching links:', error);
      if (error.response?.status === 403) {
        console.log('링크 조회 권한이 없습니다.');
      }
      setLinks([]);
    }
  };

  const handleFileDownload = async (fileId, fileName) => {
    try {
      const { data: { preSignedUrl } } = await axiosInstance.get(API_ENDPOINTS.APPROVAL.FILE_DOWNLOAD(fileId));
      window.location.href = preSignedUrl;
    } catch (error) {
      console.error('파일 다운로드 중 오류 발생:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  };

  // 승인권자 저장 처리 함수 수정
  const handleSaveApprovers = async (approverIds) => {
    try {
      if (!approvalId) {
        console.error('승인요청 ID를 찾을 수 없습니다.');
        return;
      }

      // 승인권자 목록 새로고침
      await fetchApprovers();
      
      setIsApproversModalOpen(false);
      alert('승인권자가 성공적으로 저장되었습니다.');
    } catch (error) {
      // 403이 아닌 다른 에러만 처리
      if (error.response?.status !== 403) {
        console.error('승인권자 저장 중 오류:', error);
        alert('승인권자 저장에 실패했습니다: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // 승인권자 목록 조회 함수 수정
  const fetchApprovers = async () => {
    try {
      const { data } = await axiosInstance.get(API_ENDPOINTS.APPROVAL.APPROVERS(approvalId), {
        withCredentials: true
      });
      console.log('승인권자 목록 응답:', data);
      
      // approverResponses 배열이 있는 경우 해당 데이터 사용
      const approversList = data.approverResponses || [];
      setApprovers(approversList);
    } catch (error) {
      console.error('승인권자 목록 조회 실패:', error);
      setApprovers([]);
    }
  };

  // 승인권자 목록 자동 새로고침
  useEffect(() => {
    if (approvalId) {
      fetchApprovers();
    }
  }, [approvalId, isApproversModalOpen]); // 모달이 닫힐 때도 목록 새로고침

  // 승인권자 상태 텍스트 변환 함수 수정
  const getApproverStatusText = (status) => {
    switch (status) {
      case 'APPROVED':
        return '승인';
      case 'REJECTED':
        return '반려';
      case 'MODIFICATION_REQUESTED':
        return '수정요청';
      case 'NOT_RESPONDED':
        return '응답대기중';
      default:
        return '미정';
    }
  };

  return (
    <PageContainer>
      <ContentWrapper>
        <MainContent>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <BackButton onClick={handleBack}>
              <span>←</span>
              목록으로
            </BackButton>
            <PageTitle style={{ margin: '0 0 0 24px' }}>승인요청 상세</PageTitle>
          </div>

          {loading ? (
            <LoadingMessage>데이터를 불러오는 중...</LoadingMessage>
          ) : error ? (
            <ErrorMessage>{error}</ErrorMessage>
          ) : proposal ? (
            <ContentContainer>
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
                    
                    {/* 반려 상태일 때 강조 멘트 표시 */}
                    {proposal.approvalProposalStatus === ApprovalProposalStatus.FINAL_REJECTED && (
                      <RejectionNotice>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <div>
                          <strong>고객사의 승인요청 반려에 따라, 승인요청 상세 내용을 수정해주세요.</strong>
                          <br />
                          수정사항을 반영한 후 재승인요청을 전송해주시기 바랍니다.
                        </div>
                      </RejectionNotice>
                    )}
                    
                    {/* 요청 상태를 제목 위에 표시 */}
                    <StatusContainer>
                      <StatusBadge status={proposal.approvalProposalStatus}>
                        {getApprovalStatusText(proposal.approvalProposalStatus)}
                      </StatusBadge>
                      <div style={{ flex: 1 }}></div>
                      
                      {!isEditing && (
                        <>
                          {proposal.approvalProposalStatus === ApprovalProposalStatus.DRAFT && (
                            <ApprovalActionButton 
                              onClick={handleSendApproval} 
                              disabled={sendingApproval}
                              style={{ marginRight: '8px' }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 2L11 13"></path>
                                <path d="M22 2L15 22L11 13L2 9L22 2z"></path>
                              </svg>
                              {sendingApproval ? '전송 중...' : '승인요청 전송'}
                            </ApprovalActionButton>
                          )}
                          {proposal.approvalProposalStatus === ApprovalProposalStatus.FINAL_REJECTED && (
                            <ApprovalActionButton 
                              onClick={handleResendApproval} 
                              disabled={sendingApproval}
                              style={{ 
                                marginRight: '8px',
                                opacity: hasChanges ? 1 : 0.6,
                                cursor: hasChanges ? 'pointer' : 'not-allowed',
                                backgroundColor: hasChanges ? '#1E40AF' : '#94A3B8',
                                transition: 'all 0.2s ease'
                              }}
                              title={!hasChanges ? "승인요청 상세 내용에 수정사항이 없습니다. 수정 후 재승인요청을 전송해주세요." : "수정사항이 있습니다. 재승인요청을 전송할 수 있습니다."}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 2L11 13"></path>
                                <path d="M22 2L15 22L11 13L2 9L22 2z"></path>
                              </svg>
                              {sendingApproval ? '전송 중...' : '재 승인요청 전송'}
                            </ApprovalActionButton>
                          )}
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
                        </>
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

                        <FileLinkUploader
                          onFilesChange={handleFilesChange}
                          onLinksChange={handleLinksChange}
                          initialFiles={editFiles}
                          initialLinks={editLinks}
                        />

                        <ApprovalButtonContainer>
                          <ApprovalActionButton 
                            $secondary
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
                        
                        {/* 파일 목록 섹션 */}
                        <AttachmentsSection>
                          <AttachmentContainer>
                            <AttachmentGroup>
                              <GroupTitle>파일</GroupTitle>
                              {files.length > 0 ? (
                                <FileList>
                                  {files.map((file) => (
                                    <FileItem 
                                      key={file.id} 
                                      onClick={() => handleFileDownload(file.id, file.fileName)}
                                      style={{ cursor: 'pointer' }}
                                    >
                                      <FileIcon>📎</FileIcon>
                                      <FileName>{file.fileName}</FileName>
                                    </FileItem>
                                  ))}
                                </FileList>
                              ) : (
                                <PlaceholderMessage>아직 등록된 파일이 없습니다.</PlaceholderMessage>
                              )}
                            </AttachmentGroup>
                          </AttachmentContainer>
                          
                          <AttachmentContainer>
                            <AttachmentGroup>
                              <GroupTitle>링크</GroupTitle>
                              {links.length > 0 ? (
                                <LinkList>
                                  {links.map((link, index) => (
                                    <LinkItem key={index} onClick={() => window.open(link.url, '_blank')}>
                                      <LinkIcon>🔗</LinkIcon>
                                      <LinkTitle>{link.title}</LinkTitle>
                                    </LinkItem>
                                  ))}
                                </LinkList>
                              ) : (
                                <PlaceholderMessage>아직 등록된 링크가 없습니다.</PlaceholderMessage>
                              )}
                            </AttachmentGroup>
                          </AttachmentContainer>
                        </AttachmentsSection>

                        {/* 승인권자 목록 섹션 수정 */}
                        {(proposal.approvalProposalStatus === ApprovalProposalStatus.DRAFT || 
                          proposal.approvalProposalStatus === ApprovalProposalStatus.BEFORE_REQUEST_PROPOSAL) && (
                          <ApproversSection>
                            <ApproversHeader>
                              <ApproversTitle>승인권자 목록</ApproversTitle>
                              {proposal.approvalProposalStatus === ApprovalProposalStatus.DRAFT && (
                                <ApprovalActionButton 
                                  $secondary
                                  onClick={handleOpenEditApprovers}
                                  style={{ padding: '4px 8px', fontSize: '13px' }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                  </svg>
                                  승인권자 지정
                                </ApprovalActionButton>
                              )}
                            </ApproversHeader>
                            <ApproversList>
                              {approvers.length > 0 ? (
                                approvers.map((approver) => (
                                  <ApproverItem key={approver.approverId}>
                                    <ApproverInfo>
                                      <ApproverName>{approver.name}</ApproverName>
                                      {approver.companyName && (
                                        <ApproverCompany>{approver.companyName}</ApproverCompany>
                                      )}
                                    </ApproverInfo>
                                    <ApproverStatus $status={approver.approverStatus}>
                                      {getApproverStatusText(approver.approverStatus)}
                                    </ApproverStatus>
                                  </ApproverItem>
                                ))
                              ) : (
                                <div style={{ 
                                  padding: '16px', 
                                  textAlign: 'center', 
                                  color: '#64748b', 
                                  fontSize: '14px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    width="24" 
                                    height="24" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    style={{ color: '#9ca3af' }}
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                  </svg>
                                  등록된 승인권자가 없습니다.
                                </div>
                              )}
                            </ApproversList>
                          </ApproversSection>
                        )}

                        {/* 승인 현황 요약 정보를 ApprovalDecision 컴포넌트로 전달 */}
                        {proposal?.displayStatus !== ApprovalProposalStatus.DRAFT && (
                          <div id="approvalDecisionComponent" style={{ marginTop: '24px' }}>
                            <ApprovalDecision 
                              approvalId={proposal?.id} 
                              status={proposal?.displayStatus}
                              waitingMessage={
                                proposal?.displayStatus === ApprovalProposalStatus.UNDER_REVIEW
                                  ? "승인요청이 전송되었습니다. 고객사의 승인응답을 기다리고 있습니다."
                                  : null
                              }
                              isDeveloper={isDeveloper}
                              onRefresh={fetchProposalDetail}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </ProposalInfoSection>
                  
                  {/* 프로젝트 진행 단계를 ProposalInfoSection 바깥으로 이동 */}
                  {progressLoading ? (
                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                      <p>프로젝트 진행 단계를 불러오는 중...</p>
                    </div>
                  ) : progressList && progressList.length > 0 ? (
                    <div style={{ marginTop: '24px' }}>
                      <ProjectStageProgress 
                        progressList={progressList}
                        currentStageIndex={currentStageIndex}
                        setCurrentStageIndex={setCurrentStageIndex}
                        title="프로젝트 진행 단계"
                        projectId={projectId}
                      />
                    </div>
                  ) : null}
                </div>
              </ContentGrid>
            </ContentContainer>
          ) : (
            <ErrorMessage>승인요청을 찾을 수 없습니다.</ErrorMessage>
          )}

          {isApproversModalOpen && projectId && (
            <ApprovalProposal.EditApproversModal
              isOpen={isApproversModalOpen}
              onClose={handleCloseEditApprovers}
              onSave={handleSaveApprovers}
              projectId={projectId}
              approvalId={approvalId}
              proposalStatus={proposal?.approvalProposalStatus}
            />
          )}
        </MainContent>
      </ContentWrapper>
    </PageContainer>
  );
};

export default ApprovalDetail; 