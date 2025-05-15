import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { API_ENDPOINTS } from '../config/api';
import { ApprovalDecisionStatus, ApprovalProposalStatus } from '../constants/enums';
import approvalUtils from '../utils/approvalStatus';
import axiosInstance from '../utils/axiosInstance';
import FileLinkUploader from './common/FileLinkUploader';
import { useAuth } from '../hooks/useAuth';

const { getApproverStatusText } = approvalUtils;

// Styled Components
const ResponseSection = styled.div`
  margin-top: 24px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const ApproversSectionHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
`;

const ApproversSectionTitle = styled.h3`
  color: #1e293b;
  font-size: 14px;
  margin: 0;
`;

const ResponseList = styled.div`
  display: flex;
  flex-direction: column;
`;

const ResponseItem = styled.div`
  background: white;
  overflow: hidden;
  
  &:hover {
    background-color: #f8fafc;
  }
`;

const ResponseHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #e2e8f0;
  
  &:hover {
    background-color: #f8fafc;
  }
`;

const ResponseName = styled.div`
  font-weight: 500;
  color: #475569;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ApproverContent = styled.div`
  padding: 16px;
  background-color: white;
  border-top: 1px solid #e2e8f0;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background-color: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  
  ${props => {
    if (props.$status === ApprovalDecisionStatus.APPROVED) {
      return `
        background-color: #f0fdf4;
        color: #15803d;
        border-color: #dcfce7;
      `;
    } else if (props.$status === ApprovalDecisionStatus.REJECTED) {
      return `
        background-color: #fef2f2;
        color: #b91c1c;
        border-color: #fee2e2;
      `;
    } else {
      return `
        background-color: #f8fafc;
        color: #64748b;
        border-color: #e2e8f0;
      `;
    }
  }}
`;

const ToggleButton = styled.button.attrs({
  className: 'approval-toggle-button'
})`
  width: 100%;
  padding: 12px;
  background: transparent;
  border: none;
  border-top: 1px solid #f0f0f0;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f9fafb;
    color: #111827;
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const ResponseDecision = styled.div`
  margin-top: 12px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;

  &:hover {
    background-color: #f1f5f9;
  }
`;

const DecisionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
`;

const DecisionStatus = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #64748b;
  
  &::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #94a3b8;
    transition: all 0.3s ease;
    
    ${props => {
      if (props.$status === ApprovalDecisionStatus.APPROVED) {
        return 'background-color: #22c55e;';
      } else if (props.$status === ApprovalDecisionStatus.REJECTED) {
        return 'background-color: #ef4444;';
      } else {
        return 'background-color: #94a3b8;';
      }
    }}
  }
`;

const DecisionDate = styled.div`
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
`;

const DecisionContent = styled.div`
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  
  strong {
    font-weight: 600;
    color: #1e293b;
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
  }
`;

const DeleteAction = styled.button.attrs({
  className: 'approval-delete-action'
})`
  padding: 4px 8px;
  font-size: 12px;
  color: #ef4444;
  background-color: transparent;
  border: 1px solid #fecdd3;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #fef2f2;
    border-color: #fca5a5;
  }
`;

const AddResponseButton = styled.button.attrs({
  className: 'approval-add-response-button'
})`
  width: 100%;
  padding: 10px 16px;
  margin-top: 12px;
  background: #2E7D32;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    background: #1B5E20;
    box-shadow: 0 2px 8px rgba(46, 125, 50, 0.2);
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const ResponseText = styled.div`
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  flex: 1;
  text-align: left;
  
  strong {
    font-weight: 600;
    color: #1e293b;
  }
`;

const EmptyResponseMessage = styled.div`
  padding: 32px;
  font-size: 14px;
  color: #64748b;
  text-align: center;
`;

const ResponseButton = styled.button`
  width: 100%;
  padding: 12px 20px;
  background: #2E7D32;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;

  &:hover {
    background: #1B5E20;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
  background: white;
  padding: 24px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  max-width: 100%;
  box-sizing: border-box;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 15px;
  color: #1e293b;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #2E7D32;
    box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 120px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 15px;
  color: #1e293b;
  resize: vertical;
  transition: all 0.2s;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #2E7D32;
    box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const StatusSelect = styled.select`
  width: 100%;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 15px;
  color: #1e293b;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #2E7D32;
    box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
  }

  option {
    padding: 12px;
  }
`;

const CancelButton = styled.button.attrs({
  className: 'approval-cancel-button'
})`
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #e2e8f0;
    color: #1e293b;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SaveButton = styled.button.attrs({
  className: 'approval-save-button'
})`
  background: #2E7D32;
  color: white;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #1B5E20;
    box-shadow: 0 2px 8px rgba(46, 125, 50, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled.button.attrs({
  className: 'approval-delete-button'
})`
  padding: 6px 12px;
  background: #fee2e2;
  border: none;
  border-radius: 6px;
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #fecaca;
    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.1);
  }
`;

const CompletedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: #f0fdf4;
  color: #15803d;
  border: 1px solid #dcfce7;
`;

const CompletedMessage = styled.div`
  padding: 14px;
  text-align: center;
  color: #64748b;
  font-size: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-top: 16px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f1f5f9;
  }
`;

// 승인권자 헤더와 편집 버튼을 위한 스타일
const ApproversHeaderButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const EditApproversButton = styled.button.attrs({
  className: 'approval-edit-approvers-button'
})`
  background: #2E7D32;
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
    background: #1B5E20;
    box-shadow: 0 2px 8px rgba(46, 125, 50, 0.2);
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

const SendApprovalButton = styled.button.attrs({
  className: 'approval-send-approval-button'
})`
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

// 승인권자 모달 관련 스타일 컴포넌트
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: white;
  padding: 28px;
  border-radius: 12px;
  width: 600px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 16px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f1f5f9;
    color: #334155;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CompanyList = styled.div`
  margin-top: 16px;
  margin-bottom: 24px;
`;

const CompanyItem = styled.div`
  margin-bottom: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
`;

const CompanyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8fafc;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f1f5f9;
  }
`;

const CompanyName = styled.div`
  font-weight: 600;
  color: #1e293b;
  font-size: 15px;
`;

const EmployeeList = styled.div`
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
  background-color: white;
`;

const EmployeeItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
  
  &:last-child {
    border-bottom: none;
  }
`;

const EmployeeCheckbox = styled.input`
  margin-right: 12px;
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: #2E7D32;
  
  &:checked {
    background-color: #2E7D32;
    border-color: #2E7D32;
  }
`;

const EmployeeName = styled.span`
  margin-right: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #334155;
`;

const SelectedApprovers = styled.div`
  margin-top: 20px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;

const SelectedApproverList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
`;

const SelectedApproverItem = styled.div`
  display: flex;
  align-items: center;
  background-color: #e2e8f0;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background-color: #cbd5e1;
  }
`;

const RemoveApproverButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  margin-left: 8px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #dc2626;
  }
`;

const ModalButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
`;

// 로딩 표시 컴포넌트
const LoadingIndicator = styled.div`
  text-align: center;
  padding: 20px;
  color: #64748b;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: "";
    display: block;
    width: 24px;
    height: 24px;
    border: 2px solid #e2e8f0;
    border-radius: 50%;
    border-top-color: #2E7D32;
    animation: spinner 0.8s linear infinite;
  }
  
  @keyframes spinner {
    to {
      transform: rotate(360deg);
    }
  }
`;

// 모달 내용 컨테이너
const ModalContent = styled.div`
  padding: 16px 0;
  position: relative;
  min-height: 200px;
`;

const StatusSummary = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #cbd5e1;
`;

const StatusSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatusItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: ${props => props.bgColor || '#f8fafc'};
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
`;

const StatusLabel = styled.span`
  color: ${props => props.color || '#64748b'};
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: ${props => props.color || '#64748b'};
  }
`;

const StatusCount = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: ${props => props.color || '#1e293b'};
  
  .count {
    font-size: 20px;
    font-weight: 600;
    line-height: 1;
  }
  
  .unit {
    font-size: 13px;
    font-weight: 500;
    color: ${props => props.color || '#64748b'};
    opacity: 0.8;
  }
`;

const ApprovalDecision = ({ approvalId, statusSummary }) => {
  // 모달 상태를 하나로 통합
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'add' 또는 'detail'
    selectedApprover: null,
    selectedDecision: null
  });

  // 기존 상태들
  const [approversData, setApproversData] = useState([]);
  const [newDecision, setNewDecision] = useState({ content: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [expandedApprovers, setExpandedApprovers] = useState(new Set());
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [currentUser, setCurrentUser] = useState(null);
  
  // useAuth 훅 사용
  const { user } = useAuth();
  const isDeveloper = user?.companyRole === 'DEVELOPER' || 
                     user?.projectUserManagerRole === 'DEVELOPER_MANAGER' || 
                     user?.projectUserManagerRole === 'DEVELOPER_USER';
  
  // 승인요청 전송 여부 확인
  const isRequestSent = statusSummary && 
    (statusSummary.proposalStatus !== ApprovalProposalStatus.DRAFT || statusSummary.lastSentAt);

  // 현재 사용자 정보 가져오기
  const fetchCurrentUser = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.AUTH.CURRENT_USER);
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchDecisions();
  }, [approvalId]);

  const fetchDecisions = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.DECISION.LIST(approvalId));
      const approvers = response.data.decisionResponses || response.data.approvers || [];
      setApproversData(approvers);
    } catch (error) {
      console.error('Error fetching decisions:', error);
      alert(error.message || '승인응답 목록을 불러오는데 실패했습니다.');
      setApproversData([]);
    }
  };

  const hasApprovedDecision = (approver) => {
    return approver.decisionResponses?.some(
      decision => decision.status === ApprovalDecisionStatus.APPROVED
    );
  };

  const hasRejectedDecision = (approver) => {
    return approver.decisionResponses?.some(
      decision => decision.status === ApprovalDecisionStatus.REJECTED
    );
  };

  const isCurrentUserApprover = (approverId) => {
    return currentUser && String(currentUser.id) === String(approverId);
  };

  const hasExistingDecision = (approver) => {
    return approver.decisionResponses?.some(decision => 
      decision.status === ApprovalDecisionStatus.APPROVED
    );
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileDelete = (indexToDelete) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToDelete));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    console.log('선택된 파일들:', selectedFiles);
    
    // 파일 크기 검증
    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      alert('10MB 이상의 파일은 업로드할 수 없습니다:\n' + 
        oversizedFiles.map(file => `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`).join('\n'));
      e.target.value = ''; // 파일 선택 초기화
      return;
    }

    // 기존 파일 목록에 새로 선택된 파일들 추가
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    e.target.value = ''; // 파일 선택 초기화
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
    setLinks(prevLinks => [...prevLinks, { ...newLink }]);
    
    // 입력 필드 초기화
    setNewLink({ title: '', url: '' });
  };

  const handleLinkDelete = (indexToDelete) => {
    setLinks(prevLinks => prevLinks.filter((_, index) => index !== indexToDelete));
  };

  const openModal = (type, data = null) => {
    setModalState({
      isOpen: true,
      type,
      selectedApprover: type === 'add' ? data : null,
      selectedDecision: type === 'detail' ? data : null
    });
  };

  const closeModal = () => {
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  const handleDeleteDecision = async (decisionId, status, approverId, approverName) => {
    const statusText = status === ApprovalDecisionStatus.APPROVED ? '승인' : 
                      status === ApprovalDecisionStatus.REJECTED ? '반려' : '검토중';
    
    if (status === ApprovalDecisionStatus.APPROVED) {
      alert('승인 상태의 응답은 삭제할 수 없습니다.\n다른 응답을 추가하시려면 먼저 반려 응답을 삭제해주세요.');
      return;
    }
    
    const confirmMessage = `${approverName}님의 "${statusText}" 응답을 삭제하시겠습니까?\n\n이 작업은 취소할 수 없으며, 삭제 후에는 승인권자가 새로운 응답을 등록해야 합니다.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.delete(API_ENDPOINTS.DECISION.DELETE(decisionId));

      if (response.status === 200) {
        alert('승인응답이 성공적으로 삭제되었습니다.');
        await fetchDecisions();
      }
    } catch (error) {
      console.error('승인응답 삭제 오류:', error);
      alert(`승인응답 삭제에 실패했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDecision = async () => {
    if (!newDecision.content || !newDecision.status) {
      alert('내용과 상태를 모두 입력해주세요.');
      return;
    }

    if (!modalState.selectedApprover?.approverId) {
      alert('승인권자 정보가 없습니다.');
      return;
    }

    try {
      // 1. 먼저 승인 응답 생성
      const response = await axiosInstance.post(
        API_ENDPOINTS.DECISION.CREATE_WITH_APPROVER(modalState.selectedApprover.approverId),
        {
          content: newDecision.content,
          decisionStatus: newDecision.status
        }
      );

      const decisionId = response.data.id;

      // 2. 파일 업로드
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file);
        });
        
        await axiosInstance.post(
          API_ENDPOINTS.DECISION.FILES(decisionId),
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      // 3. 링크 업로드
      if (links.length > 0) {
        await axiosInstance.post(
          API_ENDPOINTS.DECISION.LINKS(decisionId),
          links
        );
      }

      // 상태 초기화
      setNewDecision({ content: '', status: '' });
      setFiles([]);
      setLinks([]);
      setNewLink({ title: '', url: '' });
      
      // 모달 닫기 - 먼저 모달 상태를 초기화
      setModalState({
        isOpen: false,
        type: null,
        selectedApprover: null,
        selectedDecision: null
      });
      
      alert('승인응답이 등록되었습니다.');
      
      // 승인 응답 목록 새로고침
      await fetchDecisions();
      
    } catch (error) {
      console.error('승인응답 생성 오류:', error);
      const errorMessage = error.response?.data?.message || '승인응답 생성에 실패했습니다.';
      alert(errorMessage);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case ApprovalDecisionStatus.APPROVED:
        return '승인됨';
      case ApprovalDecisionStatus.REJECTED:
        return '반려됨';
      case ApprovalDecisionStatus.UNDER_REVIEW:
        return '검토중';
      default:
        return '미정';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const sortApprovers = (approvers) => {
    return [...approvers].sort((a, b) => {
      const aCompleted = hasApprovedDecision(a);
      const bCompleted = hasApprovedDecision(b);
      if (aCompleted === bCompleted) return 0;
      return aCompleted ? 1 : -1;
    });
  };

  const toggleApproverExpansion = (approverId) => {
    setExpandedApprovers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(approverId)) {
        newSet.delete(approverId);
      } else {
        newSet.add(approverId);
      }
      return newSet;
    });
  };

  const handleDecisionClick = async (decision) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.DECISION.FILES(decision.id));
      const filesData = response.data;

      // 링크 정보 가져오기
      const linksResponse = await axiosInstance.get(API_ENDPOINTS.DECISION.GET_LINKS(decision.id));
      const linksData = linksResponse.data;

      // 파일과 링크 정보를 포함하여 상태 업데이트
      setModalState(prev => ({
        ...prev,
        selectedDecision: {
          ...decision,
          files: filesData,
          links: linksData
        }
      }));
    } catch (error) {
      console.error('상세 정보 조회 오류:', error);
      alert('상세 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleFileDownload = async (fileId, fileName) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.DECISION.FILE_DOWNLOAD(fileId), {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('파일 다운로드 중 오류 발생:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  };

  return (
    <>
      <ResponseSection>
        <ApproversSectionHeader>
          <ApproversSectionTitle>고객사의 승인응답 목록</ApproversSectionTitle>
        </ApproversSectionHeader>
        
        {/* 승인 현황 요약 정보 - 승인요청 전송 후에만 표시 */}
        {statusSummary?.proposalStatus !== ApprovalProposalStatus.DRAFT && statusSummary && (
          <StatusSummary>
            <StatusSummaryGrid>
              {statusSummary.totalApproverCount > 0 && (
                <StatusItem bgColor="#f8fafc">
                  <StatusLabel>전체</StatusLabel>
                  <StatusCount>
                    <span className="count">{statusSummary.totalApproverCount}</span>
                    <span className="unit">명</span>
                  </StatusCount>
                </StatusItem>
              )}
              <StatusItem bgColor="#eff6ff">
                <StatusLabel color="#1e40af">대기</StatusLabel>
                <StatusCount color="#1e40af">
                  <span className="count">{statusSummary.waitingApproverCount}</span>
                  <span className="unit">명</span>
                </StatusCount>
              </StatusItem>
              <StatusItem bgColor="#f0fdf4">
                <StatusLabel color="#166534">승인</StatusLabel>
                <StatusCount color="#166534">
                  <span className="count">{statusSummary.approvedApproverCount}</span>
                  <span className="unit">명</span>
                </StatusCount>
              </StatusItem>
              <StatusItem bgColor="#fef2f2">
                <StatusLabel color="#991b1b">반려</StatusLabel>
                <StatusCount color="#991b1b">
                  <span className="count">{statusSummary.modificationRequestedApproverCount}</span>
                  <span className="unit">명</span>
                </StatusCount>
              </StatusItem>
            </StatusSummaryGrid>
          </StatusSummary>
        )}
        
        <ResponseList>
          {approversData.length === 0 ? (
            <EmptyResponseMessage>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px', display: 'block', color: '#9ca3af' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              등록된 승인권자가 없습니다.
              <br />
              승인권자를 추가해주세요.
            </EmptyResponseMessage>
          ) : (
            sortApprovers(approversData).map((approver) => (
              <ResponseItem 
                key={approver.approverId}
                $hasApproved={hasApprovedDecision(approver)}
                $hasRejected={hasRejectedDecision(approver)}
                $isCompleted={hasApprovedDecision(approver)}
              >
                <ResponseHeader onClick={() => toggleApproverExpansion(approver.approverId)}>
                  <ResponseName>
                    {approver.approverName}
                    {hasApprovedDecision(approver) && (
                      <StatusBadge $status={ApprovalDecisionStatus.APPROVED}>
                        승인 완료
                      </StatusBadge>
                    )}
                    {!hasApprovedDecision(approver) && hasRejectedDecision(approver) && (
                      <StatusBadge $status={ApprovalDecisionStatus.REJECTED}>
                        반려
                      </StatusBadge>
                    )}
                    {!hasApprovedDecision(approver) && !hasRejectedDecision(approver) && approver.decisionResponses?.length > 0 && (
                      <StatusBadge $status={ApprovalDecisionStatus.UNDER_REVIEW}>
                        검토중
                      </StatusBadge>
                    )}
                  </ResponseName>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{
                      transform: expandedApprovers.has(approver.approverId) ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </ResponseHeader>
                {expandedApprovers.has(approver.approverId) && (
                  <ApproverContent>
                    {statusSummary?.proposalStatus === ApprovalProposalStatus.DRAFT ? (
                      <div style={{ 
                        padding: '20px', 
                        textAlign: 'center', 
                        color: '#6b7280', 
                        fontSize: '14px', 
                        background: '#f9fafb', 
                        borderRadius: '8px', 
                        border: '1px dashed #e5e7eb',
                        marginBottom: '16px'
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px', display: 'block', color: '#9ca3af' }}>
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        승인요청 전송 후 응답을 등록할 수 있습니다
                      </div>
                    ) : approver.decisionResponses && approver.decisionResponses.length > 0 ? (
                      <>
                        {approver.decisionResponses.map((decision) => (
                          <ResponseDecision 
                            key={decision.id}
                            onClick={() => handleDecisionClick(decision)}
                            style={{ cursor: 'pointer' }}
                          >
                            <DecisionHeader>
                              <DecisionStatus $status={decision.status}>
                                {getStatusText(decision.status)}
                              </DecisionStatus>
                              <DecisionDate>
                                {formatDate(decision.decidedAt)}
                                {decision.status !== ApprovalDecisionStatus.APPROVED && (
                                  <DeleteAction 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteDecision(decision.id, decision.status, decision.approverId, approver.approverName);
                                    }}
                                  >
                                    삭제
                                  </DeleteAction>
                                )}
                              </DecisionDate>
                            </DecisionHeader>
                            <DecisionContent>
                              {decision.content || '내용 없음'}
                            </DecisionContent>
                          </ResponseDecision>
                        ))}
                        
                        {!isDeveloper && !hasApprovedDecision(approver) && (
                          <AddResponseButton 
                            onClick={() => openModal('add', approver)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span>승인응답 추가</span>
                          </AddResponseButton>
                        )}
                      </>
                    ) : (
                      <>
                        <div style={{ 
                          padding: '20px', 
                          textAlign: 'center', 
                          color: '#6b7280', 
                          fontSize: '14px', 
                          background: '#f9fafb', 
                          borderRadius: '8px', 
                          border: '1px dashed #e5e7eb',
                          marginBottom: '16px'
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px', display: 'block', color: '#9ca3af' }}>
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          아직 등록된 응답이 없습니다
                        </div>
                        
                        {!isDeveloper && !hasApprovedDecision(approver) && (
                          <AddResponseButton 
                            onClick={() => openModal('add', approver)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span>승인응답 추가</span>
                          </AddResponseButton>
                        )}
                      </>
                    )}
                  </ApproverContent>
                )}
              </ResponseItem>
            ))
          )}
        </ResponseList>
      </ResponseSection>

      {/* 승인응답 추가 모달 */}
      {modalState.isOpen && modalState.type === 'add' && (
        <ModalOverlay>
          <ModalContainer>
            <ModalHeader>
              <ModalTitle>승인응답 추가</ModalTitle>
              <CloseButton onClick={closeModal}>×</CloseButton>
            </ModalHeader>
            <ModalContent>
              <InputGroup>
                <Label>응답 내용</Label>
                <TextArea
                  value={newDecision.content}
                  onChange={(e) => setNewDecision(prev => ({
                    ...prev,
                    content: e.target.value
                  }))}
                  placeholder="응답 내용을 입력하세요"
                />
              </InputGroup>
              <InputGroup>
                <Label>승인 상태</Label>
                <StatusSelect
                  value={newDecision.status}
                  onChange={(e) => setNewDecision(prev => ({
                    ...prev,
                    status: e.target.value
                  }))}
                >
                  <option value="">승인 상태를 선택하세요</option>
                  <option value={ApprovalDecisionStatus.APPROVED}>승인</option>
                  <option value={ApprovalDecisionStatus.REJECTED}>반려</option>
                </StatusSelect>
              </InputGroup>
              <InputGroup>
                <Label>파일 첨부 (선택사항)</Label>
                <FileLinkUploader
                  onFilesChange={(newFiles) => setFiles(newFiles)}
                  onLinksChange={(newLinks) => setLinks(newLinks)}
                  initialFiles={files}
                  initialLinks={links}
                />
              </InputGroup>
              <InputGroup>
                <Label>링크 추가 (선택사항)</Label>
                <FileLinkUploader
                  onFilesChange={(newFiles) => setFiles(newFiles)}
                  onLinksChange={(newLinks) => setLinks(newLinks)}
                  initialFiles={files}
                  initialLinks={links}
                />
              </InputGroup>
              <ModalButtonContainer>
                <CancelButton onClick={closeModal}>취소</CancelButton>
                <SaveButton onClick={handleCreateDecision}>저장</SaveButton>
              </ModalButtonContainer>
            </ModalContent>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* 승인응답 상세보기 모달 */}
      {modalState.isOpen && modalState.type === 'detail' && modalState.selectedDecision && (
        <ModalOverlay>
          <ModalContainer>
            <ModalHeader>
              <ModalTitle>승인응답 상세</ModalTitle>
              <CloseButton onClick={closeModal}>×</CloseButton>
            </ModalHeader>
            <ModalContent>
              <InputGroup>
                <Label>승인 상태</Label>
                <StatusBadge $status={modalState.selectedDecision.status}>
                  {getStatusText(modalState.selectedDecision.status)}
                </StatusBadge>
              </InputGroup>
              <InputGroup>
                <Label>응답 내용</Label>
                <div style={{ 
                  padding: '16px', 
                  background: '#f8fafc', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0',
                  minHeight: '100px'
                }}>
                  {modalState.selectedDecision.content || '내용 없음'}
                </div>
              </InputGroup>
              <InputGroup>
                <Label>응답 일시</Label>
                <div style={{ color: '#64748b' }}>
                  {formatDate(modalState.selectedDecision.decidedAt)}
                </div>
              </InputGroup>
              {modalState.selectedDecision.files && modalState.selectedDecision.files.length > 0 && (
                <InputGroup>
                  <Label>첨부 파일 및 링크</Label>
                  <FileLinkUploader
                    initialFiles={modalState.selectedDecision.files}
                    initialLinks={modalState.selectedDecision.links}
                    readOnly={true}
                    onFileDownload={handleFileDownload}
                  />
                </InputGroup>
              )}
              <ModalButtonContainer>
                <CancelButton onClick={closeModal}>닫기</CancelButton>
              </ModalButtonContainer>
            </ModalContent>
          </ModalContainer>
        </ModalOverlay>
      )}
    </>
  );
};

export default ApprovalDecision; 