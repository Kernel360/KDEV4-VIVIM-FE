import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { API_ENDPOINTS } from '../config/api';
import { ApprovalDecisionStatus, ApprovalProposalStatus } from '../constants/enums';
import ApprovalDecision from './ApprovalDecision';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaClock, FaPlus, FaArrowLeft, FaArrowRight, FaEdit, FaTrashAlt, FaEllipsisV, FaEye, FaArrowUp, FaArrowDown, FaGripVertical, FaTimes } from 'react-icons/fa';
import approvalUtils from '../utils/approvalStatus';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../hooks/useAuth';
import FileLinkUploader from './common/FileLinkUploader';
import ConfirmModal from './common/ConfirmModal';

const { getApprovalStatusText, getApprovalStatusBackgroundColor, getApprovalStatusTextColor } = approvalUtils;

// currentProgress 열거형 값과 단계 이름 매핑
const PROGRESS_STAGE_MAP = {
  '요구사항정의': '요구사항 정의',
  '화면설계': '화면 설계',
  '디자인': '디자인',
  '퍼블리싱': '퍼블리싱',
  '개발': '개발',
  '검수': '검수',
  '완료': '완료'
};

// Styled Components
const LoadingMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #64748b;
`;

const Container = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0;
  box-sizing: border-box;
`;

const ProposalContainer = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 45px auto;
  padding: 0;
  box-sizing: border-box;
`;

const ProposalList = styled.div`
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
  box-sizing: border-box;
`;

const EmptyState = styled.div`
  padding: 20px;
  text-align: center;
  color: #64748b;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;

const ProposalItem = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: background-color 0.2s;
  border: 1px solid #e2e8f0;
  
  &:hover {
    background-color: #f8fafc;
  }
`;

const ProposalContent = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
`;

const ProposalDescription = styled.div`
  display: none;
`;

const ListProposalInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
`;

const CreatorInfo = styled.div`
  display: flex;
  gap: 8px;
`;

const CompanyName = styled.span`
  font-size: 12px;
  color: #64748b;
`;

const CreatorName = styled.span`
  font-size: 12px;
  color: #1e293b;
  font-weight: 500;
`;

const DateInfo = styled.span`
  font-size: 12px;
  color: #64748b;
`;

const ProposalActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: flex-end;
`;

const ActionButton = styled.button.attrs({
  className: 'approval-proposal-action-button'
})`
  padding: 6px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #475569;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f8fafc;
  }
`;

const DeleteButton = styled.button.attrs({
  className: 'approval-proposal-delete-button'
})`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;
  margin-left: 8px;

  &:hover {
    background-color: #fee2e2;
    color: #dc2626;
  }
`;

const SendButton = styled(ActionButton).attrs({
  className: 'approval-proposal-send-button'
})`
  background: #2E7D32;
  border: none;
  color: white;
  width: 100%;
  text-align: center;
  padding: 8px 16px;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
  position: relative;
  overflow: hidden;

  &:hover {
    background: #1B5E20;
    color: white;
  }
`;

const ShowMoreButton = styled.button.attrs({
  className: 'approval-proposal-show-more-button'
})`
  width: 100%;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #334155;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 16px;
  
  &:hover {
    background: #f8fafc;
  }
`;

const AddButton = styled.button.attrs({
  className: 'approval-proposal-add-button'
})`
  padding: 12px 24px;
  background: ${props => props.disabled ? '#e2e8f0' : '#2E7D32'};
  border: none;
  border-radius: 6px;
  color: ${props => props.disabled ? '#94a3b8' : 'white'};
  font-size: 14px;
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  align-self: flex-start;
  width: 100%;

  &:hover {
    background: ${props => props.disabled ? '#e2e8f0' : '#1B5E20'};
  }
`;

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

const ModalContainer = styled.div`
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 8px 8px 0 0;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }
`;

const ModalContent = styled.div`
  padding: 24px;
  overflow-y: auto;
  flex: 1;
`;

const ModalButtonContainer = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: white;
  border-radius: 0 0 8px 8px;
`;

const InputGroup = styled.div`
  margin-bottom: 16px;
  width: 100%;
`;

const Label = styled.label`
  display: block;
  margin-top: 14px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #1e293b;
  background: white;
  transition: all 0.2s;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #94a3b8;
    box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 120px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #1e293b;
  resize: vertical;
  transition: all 0.2s;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #94a3b8;
    box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const StatusSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #1e293b;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #94a3b8;
    box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.1);
  }

  option {
    padding: 8px;
  }
`;

const getStatusColor = (status) => {
  return {
    background: getApprovalStatusBackgroundColor(status),
    text: getApprovalStatusTextColor(status)
  };
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

const ListProposalTitle = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProposalHeader = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  box-sizing: border-box;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  margin-left: 8px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const SendButtonSmall = styled.button.attrs({
  className: 'approval-proposal-send-button-small'
})`
  padding: 4px 8px;
  background: #2E7D32;
  color: white;
  border: 1px solid #2E7D32;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1B5E20;
    color: white;
    border-color: #1B5E20;
  }
`;

const AddButtonContainer = styled.div`
  position: sticky;
  bottom: 0;
  background: white;
  padding-top: 8px;
  margin-top: auto;
  z-index: 2;
`;

const ActionIcons = styled.div`
  display: flex;
  gap: 8px;
  margin-left: 8px;
`;

const ActionIcon = styled.button.attrs({
  className: 'approval-proposal-action-icon'
})`
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  font-size: 14px;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    color: #2563eb;
    background-color: #f0f7ff;
  }
  
  &.delete:hover {
    color: #dc2626;
    background-color: #fee2e2;
  }
`;

// 파일 관련 스타일 컴포넌트 추가
const FileInputContainer = styled.div`
  margin-bottom: 16px;

  &::after {
    content: '* 파일 크기는 10MB 이하여야 합니다.';
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-top: 4px;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const FileButton = styled.button.attrs({
  className: 'approval-proposal-file-button'
})`
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    background-color: #f8fafc;
  }
`;

const FileList = styled.ul`
  list-style: none;
  padding: 8px 16px;
  margin: 8px 0 0 0;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
`;

const FileItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:not(:last-child) {
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 12px;
    margin-bottom: 8px;
  }

  &:hover {
    background-color: #f8fafc;
  }
`;

const FileContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background-color: #f1f5f9;
  }
`;

const LinkContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  cursor: pointer;
  color: #2563eb;
  text-decoration: underline;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    color: #1d4ed8;
    background-color: #f1f5f9;
  }
`;

const ErrorMessage = styled.span`
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
`;

const CancelButton = styled(Button)`
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;

  &:hover {
    background: #f8fafc;
  }
`;

const SaveButton = styled(Button)`
  background: #2E7D32;
  color: white;
  border: none;

  &:hover {
    background: #1B5E20;
  }
`;

// 승인권자 관련 스타일 컴포넌트 복구
const ApproverSection = styled.div`
  margin-top: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: white;
`;

const EmployeeList = styled.div`
  font-size: 14px;
  background: white;
  padding: 8px 0;
  overflow-y: auto;
`;

const EmployeeItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  transition: all 0.2s;
  border-bottom: 1px solid #e2e8f0;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #f8fafc;
  }
`;

// EditApproversModal 컴포넌트 수정
const EditApproversModal = ({ isOpen, onClose, onSave, projectId, approvalId, proposalStatus }) => {
  const [companies, setCompanies] = useState([]);
  const [selectedApprovers, setSelectedApprovers] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);
  const [currentApprovers, setCurrentApprovers] = useState([]);
  const [changedApprovers, setChangedApprovers] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // 현재 승인권자 목록 조회
  const fetchCurrentApprovers = async () => {
    try {
      const { data } = await axiosInstance.get(API_ENDPOINTS.APPROVAL.APPROVERS(approvalId), {
        withCredentials: true
      });
      
      if (data.approverResponses) {
        // 현재 승인권자 목록 설정
        setCurrentApprovers(data.approverResponses);
        
        // 현재 승인권자들을 selectedApprovers에 추가
        const currentApproverList = data.approverResponses.map(approver => ({
          userId: approver.userId,
          memberId: approver.userId,
          name: approver.name
        }));
        
        setSelectedApprovers(currentApproverList);
        setChangedApprovers(new Set());
      }
    } catch (error) {
      console.error('▶ 승인권자 목록 조회 실패:', error);
      setCurrentApprovers([]);
      setSelectedApprovers([]);
    }
  };

  // 프로젝트 참여자 목록 가져오기
  const fetchProjectUsers = async () => {
    try {
      if (!projectId) {
        console.log('▶ 프로젝트 ID가 없어 사용자 목록을 조회하지 않습니다.');
        return;
      }

      const { data } = await axiosInstance.get(`${API_ENDPOINTS.PROJECTS}/${projectId}/users`, {
        withCredentials: true
      });
      
      // 고객사 사용자만 필터링
      const customerUsers = data.filter(user => 
        user.role === 'CLIENT_MANAGER' || user.role === 'CLIENT_USER'
      );
      
      setProjectUsers(data);
      setCompanies(customerUsers);
    } catch (error) {
      console.error('▶ 프로젝트 사용자 목록 조회 중 오류:', error);
      setProjectUsers([]);
      setCompanies([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // 프로젝트 사용자 목록과 승인권자 목록을 순차적으로 조회
      const fetchData = async () => {
        await fetchProjectUsers();
        if (approvalId) {
          await fetchCurrentApprovers();
        }
      };
      fetchData();
    } else {
      setCompanies([]);
      setSelectedApprovers([]);
      setProjectUsers([]);
      setCurrentApprovers([]);
      setChangedApprovers(new Set());
    }
  }, [isOpen, projectId, approvalId]);

  // 승인권자 선택/해제 처리
  const handleSelectApprover = (user, checked) => {
    const isCurrentApprover = currentApprovers.some(approver => approver.userId === user.userId);

    setSelectedApprovers(prev => {
      const newSelected = checked 
        ? [...prev, { 
            userId: user.userId, 
            memberId: user.userId,
            name: user.userName 
          }] 
        : prev.filter(a => a.userId !== user.userId);
      
      // 변경된 승인권자 추적
      setChangedApprovers(prev => {
        const newChanged = new Set(prev);
        if (isCurrentApprover !== checked) {
          newChanged.add(user.userId);
        } else {
          newChanged.delete(user.userId);
        }
        return newChanged;
      });

      return newSelected;
    });
  };

  // 승인권자 업데이트
  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    const approverIds = selectedApprovers.map(approver => approver.userId);

    try {
      await axiosInstance.put(
        API_ENDPOINTS.APPROVAL.UPDATE_APPROVERS(approvalId),
        { approverIds },
        { withCredentials: true }
      );
    } catch (error) {
      alert('승인권자 지정에 실패했습니다.');
      return;
    }

    alert('승인권자가 성공적으로 지정되었습니다.');
    onClose();
    onSave();
    setIsSaving(false);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>승인권자 지정</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        <ModalContent>
          <ApproverSection>
            {companies.length === 0 ? (
              <EmptyState>연결된 고객사 사용자가 없습니다.</EmptyState>
            ) : (
              <EmployeeList>
                {companies.map(user => {
                  const isSelected = selectedApprovers.some(approver => approver.userId === user.userId);
                  const isChanged = changedApprovers.has(user.userId);
                  return (
                    <EmployeeItem 
                      key={user.userId}
                      style={isChanged ? { backgroundColor: '#f8fafc' } : {}}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{user.userName}</span>
                        <span style={{ 
                          fontSize: '12px', 
                          color: '#64748b',
                          backgroundColor: '#f1f5f9',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {user.role === 'CLIENT_MANAGER' ? '담당자' : '일반'}
                        </span>
                        {isChanged && (
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#2E7D32',
                            backgroundColor: '#f0fdf4',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            지정됨
                          </span>
                        )}
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={e => {
                          e.stopPropagation();
                          handleSelectApprover(user, e.target.checked);
                        }} 
                      />
                    </EmployeeItem>
                  );
                })}
              </EmployeeList>
            )}
          </ApproverSection>
        </ModalContent>
        <ModalButtonContainer>
          <CancelButton onClick={onClose} disabled={isSaving}>취소</CancelButton>
          <SaveButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </SaveButton>
        </ModalButtonContainer>
      </ModalContainer>
    </ModalOverlay>
  );
};

const ApprovalProposal = ({ 
  progressId, 
  projectId,
  showMore, 
  onShowMore,
  stage,
  progressStatus,
  currentProgress,
  isProjectCompleted,
  currentStageIndex,
  progressList,
  fetchProjectProgress,
  onApprovalChange
}) => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllProposals, setShowAllProposals] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [approvalDecisions, setApprovalDecisions] = useState([]);
  const [newDecision, setNewDecision] = useState({ content: '', status: '' });
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProposal, setNewProposal] = useState({ title: '', content: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const contentRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [projectInfo, setProjectInfo] = useState(null);
  const [approvalRate, setApprovalRate] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [linksToDelete, setLinksToDelete] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [existingLinks, setExistingLinks] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newLinks, setNewLinks] = useState([]);

  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
    'application/pdf', 'application/rtf', 'text/plain', 'text/rtf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/gzip',
    'application/json', 'application/xml', 'text/html', 'text/css', 'application/javascript'
  ];

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // 승인요청 목록 조회 함수
  const fetchProposals = async () => {
    if (!progressId || !progressList || currentStageIndex === undefined) {
      console.log('▶ 필수 데이터가 없어 승인요청 목록을 조회하지 않습니다:', {
        progressId,
        currentStageIndex,
        progressList: progressList?.map(stage => ({
          id: stage.id,
          name: stage.name,
          position: stage.position
        }))
      });
      return;
    }
    
    try {
      // 현재 선택된 단계 정보 확인
      const selectedStage = progressList[currentStageIndex];
      if (!selectedStage) {
        console.log('▶ 선택된 단계를 찾을 수 없음:', {
          currentStageIndex,
          progressList: progressList.map(stage => ({
            id: stage.id,
            name: stage.name,
            position: stage.position
          }))
        });
        return;
      }

      const stageId = selectedStage.id;
      console.log('▶ 선택된 단계 승인요청 목록 조회 시작:', {
        stageId,
        stageName: selectedStage.name,
        currentStageIndex,
        currentProgress
      });
      
      const { data } = await axiosInstance.get(API_ENDPOINTS.APPROVAL.LIST(stageId), {
        withCredentials: true
      });
      
      console.log('▶ 선택된 단계 승인요청 목록 조회 결과:', {
        stageId,
        stageName: selectedStage.name,
        approvalCount: data.approvalList?.length || 0,
        approvals: data.approvalList
      });
      
      setProposals(data.approvalList || []);
      setLoading(false);
      fetchApprovalRate();
    } catch (error) {
      console.error('▶ 승인요청 목록 조회 실패:', {
        stageId: progressList[currentStageIndex]?.id,
        error: error.response?.data || error.message
      });
      setProposals([]);
      setLoading(false);
    }
  };

  // 승인요청 목록 조회를 위한 useEffect
  useEffect(() => {
    console.log('▶ ApprovalProposal useEffect 실행:', {
      currentStageIndex,
      selectedStage: progressList?.[currentStageIndex]?.name,
      currentProgress
    });
    
    if (progressList && currentStageIndex !== undefined) {
      fetchProposals();
    }
  }, [currentStageIndex, progressList]);

  // 파일과 링크 관련 핸들러 함수들
  const handleFileDelete = (index, isExisting) => {
    if (isExisting) {
      const fileToDelete = existingFiles[index];
      setFilesToDelete(prev => [...prev, fileToDelete.id]);
      setExistingFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setNewFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleLinkDelete = (index, isExisting) => {
    if (isExisting) {
      const linkToDelete = existingLinks[index];
      setLinksToDelete(prev => [...prev, linkToDelete.id]);
      setExistingLinks(prev => prev.filter((_, i) => i !== index));
    } else {
      setNewLinks(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleFilesChange = (fileChanges) => {
    console.log('▶ 파일 변경 이벤트 발생:', fileChanges);
    if (typeof fileChanges === 'object' && 'currentFiles' in fileChanges) {
      // FileLinkUploader에서 전달된 경우
      const { currentFiles } = fileChanges;
      setFiles(currentFiles);
    } else {
      // 직접 파일 배열이 전달된 경우
      setFiles(Array.isArray(fileChanges) ? fileChanges : []);
    }
  };

  const handleLinksChange = (linkChanges) => {
    console.log('▶ 링크 변경 이벤트 발생:', linkChanges);
    if (typeof linkChanges === 'object' && 'currentLinks' in linkChanges) {
      // FileLinkUploader에서 전달된 경우
      const { currentLinks } = linkChanges;
      setLinks(currentLinks);
    } else {
      // 직접 링크 배열이 전달된 경우
      setLinks(Array.isArray(linkChanges) ? linkChanges : []);
    }
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingProposal(null);
    setExistingFiles([]);
    setExistingLinks([]);
    setNewFiles([]);
    setNewLinks([]);
    setFilesToDelete([]);
    setLinksToDelete([]);
  };

  const handleProposalClick = (proposal) => {
    navigate(`/project/${proposal.projectId}/approval/${proposal.id}`);
  };

  // 전체 데이터 새로고침 함수 수정
  const refreshAllData = async () => {
    try {
      if (fetchProjectProgress) {
        await fetchProjectProgress();
      }
    } catch (error) {
      console.error('데이터 새로고침 중 오류 발생:', error);
    }
  };

  const handleAddProposal = async () => {
    if (!newProposal.title.trim() || !newProposal.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      console.log('▶ 승인요청 생성 시작:', {
        title: newProposal.title,
        content: newProposal.content,
        files: files,
        links: links
      });

      // 1. 승인요청 생성
      const { data: response } = await axiosInstance.post(
        API_ENDPOINTS.APPROVAL.CREATE(progressId),
        {
          title: newProposal.title,
          content: newProposal.content
        },
        {
          withCredentials: true
        }
      );

      const approvalId = response.data || response;
      console.log('▶ 승인요청 생성 성공:', { approvalId });

      // 2. 파일 업로드 처리 (멀티파트 업로드)
      if (Array.isArray(files) && files.length > 0) {
        console.log('▶ 파일 업로드 시작:', { filesCount: files.length });
        for (const file of files) {
          if (!(file instanceof File)) {
            console.error('▶ 유효하지 않은 파일 객체:', file);
            continue;
          }

          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`파일 크기 제한 초과: ${file.name}`);
          }

          try {
            // 1. 멀티파트 업로드를 위한 presigned URL 요청
            const { data: presignedData } = await axiosInstance.post(
              API_ENDPOINTS.APPROVAL_FILE_UPLOAD(approvalId),
              {
                fileName: file.name,
                fileSize: file.size,
                contentType: file.type
              },
              {
                withCredentials: true
              }
            );

            const { objectKey, uploadId, presignedParts } = presignedData;

            // 2. 각 파트 업로드 (병렬 처리)
            const partSize = 25 * 1000 * 1000; // 25MB
            const totalParts = Math.ceil(file.size / partSize);
            const uploadPromises = [];

            for (let i = 0; i < totalParts; i++) {
              const start = i * partSize;
              const end = Math.min(start + partSize, file.size);
              const chunk = file.slice(start, end);
              const partNumber = i + 1;
              const presignedUrl = presignedParts.find(part => part.partNumber === partNumber).presignedUrl;

              uploadPromises.push(
                fetch(presignedUrl, {
                  method: 'PUT',
                  body: chunk,
                  headers: {
                    'Content-Type': file.type
                  }
                }).then(async (response) => {
                  if (!response.ok) {
                    throw new Error(`파일 파트 업로드 실패: ${file.name} (파트 ${partNumber})`);
                  }
                  const etag = response.headers.get('ETag');
                  return {
                    partNumber,
                    etag
                  };
                })
              );
            }

            // 모든 파트 업로드가 완료될 때까지 대기
            const uploadedParts = await Promise.all(uploadPromises);

            // 3. 멀티파트 업로드 완료 요청
            await axiosInstance.post(
              API_ENDPOINTS.FILE_COMPLETE(),
              {
                key: objectKey,
                uploadId: uploadId,
                parts: uploadedParts
              },
              {
                withCredentials: true
              }
            );

            console.log('▶ 파일 업로드 성공:', { fileName: file.name });
          } catch (error) {
            console.error('▶ 파일 업로드 실패:', {
              fileName: file.name,
              error: error.response?.data || error.message
            });
            throw new Error(`파일 "${file.name}" 업로드 실패: ${error.response?.data?.message || error.message}`);
          }
        }
      }

      // 3. 링크 업로드 처리
      if (Array.isArray(links) && links.length > 0) {
        console.log('▶ 링크 업로드 시작:', { linksCount: links.length });
        for (const link of links) {
          if (!link.title || !link.url) {
            console.error('▶ 유효하지 않은 링크 데이터:', link);
            continue;
          }

          try {
            await axiosInstance.post(
              API_ENDPOINTS.APPROVAL.LINKS(approvalId),
              {
                title: link.title,
                url: link.url
              },
              {
                withCredentials: true
              }
            );
            console.log('▶ 링크 업로드 성공:', link.title);
          } catch (error) {
            console.error('▶ 링크 업로드 실패:', {
              linkTitle: link.title,
              error: error.response?.data || error.message
            });
            throw new Error(`링크 "${link.title}" 업로드 실패: ${error.response?.data?.message || error.message}`);
          }
        }
      }

      console.log('▶ 승인요청 생성 완료');
      alert('승인요청이 성공적으로 생성되었습니다.');
      handleCloseCreateModal();
      onShowMore();
      
      // 승인요청 목록 새로고침
      await fetchProposals();
      
      // 승인요청 변경 이벤트 발생
      if (onApprovalChange) {
        await onApprovalChange();
      }
    } catch (error) {
      console.error('▶ 승인요청 생성 실패:', {
        error: error.response?.data || error.message,
        stack: error.stack
      });
      alert(error.message || error.response?.data?.message || '승인요청 생성에 실패했습니다.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProposal(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditClick = async (proposal) => {
    try {
      // 승인요청 상세 정보 조회
      const { data } = await axiosInstance.get(API_ENDPOINTS.APPROVAL.DETAIL(proposal.id));
      
      // 파일 목록 조회
      const { data: filesData } = await axiosInstance.get(API_ENDPOINTS.APPROVAL.FILES(proposal.id));
      
      // 링크 목록 조회
      const { data: linksData } = await axiosInstance.get(API_ENDPOINTS.APPROVAL.LINKS(proposal.id));
      
      console.log('▶ 승인요청 상세 정보 조회:', {
        proposal: data,
        files: filesData,
        links: linksData
      });

      setEditingProposal({ ...proposal });
      setExistingFiles(filesData?.files || []);
      setExistingLinks(linksData?.links || []);
      setNewFiles([]);
      setNewLinks([]);
      setFilesToDelete([]);
      setLinksToDelete([]);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error('▶ 승인요청 상세 정보 조회 실패:', error);
      alert('승인요청 상세 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleModifyProposal = async () => {
    try {
      console.log('▶ 승인요청 수정 시작:', {
        editingProposal,
        existingFiles,
        newFiles,
        filesToDelete,
        existingLinks,
        newLinks,
        linksToDelete
      });

      const requestBody = {};
      
      if (editingProposal.title !== undefined) {
        requestBody.title = editingProposal.title;
      }
      if (editingProposal.content !== undefined) {
        requestBody.content = editingProposal.content;
      }

      // 1. 승인요청 기본 정보 수정
      const { data } = await axiosInstance.patch(
        API_ENDPOINTS.APPROVAL.MODIFY(editingProposal.id),
        requestBody,
        {
          withCredentials: true
        }
      );
      
      if (data.statusCode === 201) {
        // 2. 삭제할 파일 처리
        for (const fileId of filesToDelete) {
          try {
            console.log('▶ 파일 삭제 시도:', { fileId });
            await axiosInstance.patch(
              API_ENDPOINTS.FILE_DELETE(fileId),
              {},
              { withCredentials: true }
            );
            console.log('▶ 파일 삭제 성공:', { fileId });
          } catch (error) {
            console.error('▶ 파일 삭제 실패:', { fileId, error });
            throw new Error(`파일 삭제 실패: ${error.response?.data?.message || error.message}`);
          }
        }

        // 3. 삭제할 링크 처리
        for (const linkId of linksToDelete) {
          try {
            console.log('▶ 링크 삭제 시도:', { linkId });
            await axiosInstance.patch(
              API_ENDPOINTS.LINK_DELETE(linkId),
              {},
              { withCredentials: true }
            );
            console.log('▶ 링크 삭제 성공:', { linkId });
          } catch (error) {
            console.error('▶ 링크 삭제 실패:', { linkId, error });
            throw new Error(`링크 삭제 실패: ${error.response?.data?.message || error.message}`);
          }
        }

        // 4. 새 파일 업로드
        for (const file of newFiles) {
          try {
            if (file instanceof File) {
              const formData = new FormData();
              formData.append('file', file);
              console.log('▶ 새 파일 업로드 시도:', { fileName: file.name });
              
              const uploadResponse = await axiosInstance.post(
                API_ENDPOINTS.APPROVAL.FILES(editingProposal.id), 
                formData,
                {
                  headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                  },
                  withCredentials: true
                }
              );
              console.log('▶ 새 파일 업로드 성공:', { fileName: file.name });
            }
          } catch (error) {
            console.error('▶ 새 파일 업로드 실패:', { fileName: file.name, error });
            throw new Error(`파일 "${file.name}" 업로드 실패: ${error.response?.data?.message || error.message}`);
          }
        }

        // 5. 새 링크 추가
        for (const link of newLinks) {
          try {
            if (link.title && link.url) {
              console.log('▶ 새 링크 추가 시도:', { linkTitle: link.title });
              const linkResponse = await axiosInstance.post(
                API_ENDPOINTS.APPROVAL.LINKS(editingProposal.id),
                {
                  title: link.title,
                  url: link.url
                },
                {
                  withCredentials: true
                }
              );
              console.log('▶ 새 링크 추가 성공:', { linkTitle: link.title });
            }
          } catch (error) {
            console.error('▶ 새 링크 추가 실패:', { linkTitle: link.title, error });
            throw new Error(`링크 "${link.title}" 추가 실패: ${error.response?.data?.message || error.message}`);
          }
        }

        console.log('▶ 승인요청 수정 완료');
        setIsEditModalOpen(false);
        setEditingProposal(null);
        setExistingFiles([]);
        setExistingLinks([]);
        setNewFiles([]);
        setNewLinks([]);
        setFilesToDelete([]);
        setLinksToDelete([]);
        await fetchProposals();
      } else {
        throw new Error(data.statusMessage || '승인요청 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('▶ 승인요청 수정 실패:', error);
      alert(error.response?.data?.message || error.message || '승인요청 수정에 실패했습니다.');
    }
  };

  const handleDeleteClick = (e, approvalId) => {
    e.stopPropagation();
    setDeleteTargetId(approvalId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;

    try {
      await axiosInstance.delete(API_ENDPOINTS.APPROVAL.DELETE(deleteTargetId), {
        withCredentials: true
      });
      
      // 승인요청 목록 새로고침
      await fetchProposals();
      
      // 승인요청 변경 이벤트 발생
      if (onApprovalChange) {
        await onApprovalChange();
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
      alert(error.response?.data?.message || '승인요청 삭제에 실패했습니다.');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  const handleSendProposal = async (approvalId) => {
    try {
      // 전송 전 승인권자 수 확인
      const { data: approversData } = await axiosInstance.get(API_ENDPOINTS.APPROVAL.APPROVERS(approvalId), {
        withCredentials: true
      });
      
      if (!approversData || approversData.approverResponses?.length === 0) {
        window.alert('승인권자가 한 명 이상 등록되어야 승인요청을 전송할 수 있습니다.');
        return;
      }

      const response = await axiosInstance.post(API_ENDPOINTS.APPROVAL.SEND(approvalId), {}, {
        withCredentials: true
      });

      if (response.data) {
        window.alert('승인요청이 성공적으로 전송되었습니다.');
        
        // 승인요청 변경 이벤트 발생
        if (onApprovalChange) {
          await onApprovalChange();
        }
      }
    } catch (error) {
      console.error('승인요청 전송 중 오류:', error);
      if (error.response?.status === 400) {
        if (error.response.data?.message?.includes('이미 전송된 승인요청')) {
          window.alert('이미 전송된 승인요청입니다.');
        } else {
          window.alert(error.response.data?.message || '승인요청 전송에 실패했습니다.');
        }
      } else {
        window.alert('승인요청 전송에 실패했습니다.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const isClient = () => {
    if (!user) return false;
    console.log('user companyRole:', user.companyRole);
    return user.companyRole === 'CUSTOMER';
  };

  const canSendProposal = () => {
    if (!user) return false;
    return user.companyRole === 'ADMIN' || user.companyRole === 'DEVELOPER';
  };

  const handleAddLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      alert('링크 제목과 URL을 모두 입력해주세요.');
      return;
    }

    try {
      new URL(newLink.url);
    } catch (e) {
      alert('올바른 URL 형식이 아닙니다.');
      return;
    }

    // links가 undefined나 null인 경우를 대비해 빈 배열로 초기화
    setLinks(prevLinks => {
      const currentLinks = Array.isArray(prevLinks) ? prevLinks : [];
      return [...currentLinks, { ...newLink }];
    });
    
    // 입력 필드 초기화
    setNewLink({ title: '', url: '' });
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewProposal({ title: '', content: '' });
    setFiles([]);
    setLinks([]);
    setNewLink({ title: '', url: '' });
  };

  useEffect(() => {
    if (authLoading) return;
  }, [authLoading]);

  // 승인률 조회 함수 수정
  const fetchApprovalRate = async () => {
    try {
      const { data } = await axiosInstance.get(
        `${API_ENDPOINTS.PROJECTS}/${progressId}/approval-rate`,
        { withCredentials: true }
      );
      console.log('▶ 승인률 조회 결과:', data);
      setApprovalRate(data);
      setIsCompleted(data === 100);
    } catch (error) {
      console.error('▶ 승인률 조회 실패:', error);
      setApprovalRate(0);
      setIsCompleted(false);
    }
  };

  // 승인률 조회를 위한 useEffect
  useEffect(() => {
    if (progressId) {
      fetchApprovalRate();
    }
  }, [progressId]);

  const displayedProposals = showAllProposals ? proposals : proposals.slice(0, 5);

  // 현재 단계가 진행 중인 단계 이전인지 확인하는 함수 수정
  const isPreviousStage = () => {
    if (!currentProgress || !progressList) return false;
    
    // 현재 진행 중인 단계 찾기
    const currentProgressStage = progressList.find(stage => 
      stage.name === currentProgress || 
      stage.name === PROGRESS_STAGE_MAP[currentProgress]
    );
    
    if (!currentProgressStage) return false;
    
    // 현재 단계 찾기
    const currentStage = progressList.find(stage => stage.id === progressId);
    if (!currentStage) return false;
    
    // 현재 단계의 position이 진행 중인 단계의 position보다 작으면 이전 단계
    return currentStage.position < currentProgressStage.position;
  };

  if (loading) {
    return <LoadingMessage>데이터를 불러오는 중...</LoadingMessage>;
  }

  return (
    <Container>
      <ProposalContainer>
        <ProposalList ref={contentRef}>
          {proposals.length === 0 ? (
            <EmptyState>등록된 승인요청이 없습니다.</EmptyState>
          ) : (
            <>
              {displayedProposals.map((proposal) => {
                const colors = getStatusColor(proposal.approvalProposalStatus);
                return (
                  <ProposalItem key={proposal.id} onClick={() => handleProposalClick(proposal)}>
                    <ProposalContent>
                      <ProposalHeader>
                        <HeaderLeft>
                          <StatusBadge $status={proposal.approvalProposalStatus}>
                            {getApprovalStatusText(proposal.approvalProposalStatus)}
                          </StatusBadge>
                          <ListProposalTitle>{proposal.title}</ListProposalTitle>
                        </HeaderLeft>
                        <HeaderRight>
                          {proposal.approvalProposalStatus !== 'FINAL_APPROVED' && 
                           !isPreviousStage() && (
                            <ActionIcons>
                              <ActionIcon className="delete" onClick={(e) => handleDeleteClick(e, proposal.id)} title="삭제">
                                <FaTimes />
                              </ActionIcon>
                            </ActionIcons>
                          )}
                        </HeaderRight>
                      </ProposalHeader>
                    </ProposalContent>
                    <ListProposalInfo>
                      <CreatorInfo>
                        <CompanyName>{proposal.creator.companyName}</CompanyName>
                        <CreatorName>{proposal.creator.name}</CreatorName>
                      </CreatorInfo>
                      <DateInfo>{formatDate(proposal.createdAt)}</DateInfo>
                    </ListProposalInfo>
                  </ProposalItem>
                );
              })}
              {proposals.length > 5 && (
                <ShowMoreButton 
                  onClick={() => setShowAllProposals(!showAllProposals)}
                  style={{ 
                    marginTop: '16px',
                    backgroundColor: showAllProposals ? '#f1f5f9' : 'white',
                    color: showAllProposals ? '#475569' : '#334155',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '12px',
                    width: '100%',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}
                >
                  {showAllProposals ? '접기' : `더보기 (${proposals.length - 5}개 더)`}
                </ShowMoreButton>
              )}
            </>
          )}
        </ProposalList>
        {!Boolean(projectInfo?.isDeleted) && !isClient() && !isProjectCompleted && (
          <AddButtonContainer>
            <AddButton onClick={() => setIsCreateModalOpen(true)}>
              + 승인요청 추가  
            </AddButton>
          </AddButtonContainer>
        )}
      </ProposalContainer>

      {isCreateModalOpen && (
        <ModalOverlay onClick={handleCloseCreateModal}>
          <ModalContainer onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>승인요청 생성</ModalTitle>
              <CloseButton onClick={handleCloseCreateModal}>×</CloseButton>
            </ModalHeader>
            <ModalContent>
              <InputGroup>
                <Label>제목</Label>
                <Input
                  type="text"
                  name="title"
                  value={newProposal.title}
                  onChange={handleInputChange}
                  placeholder="제목을 입력하세요"
                />
              </InputGroup>
              <InputGroup>
                <Label>내용</Label>
                <TextArea
                  name="content"
                  value={newProposal.content}
                  onChange={handleInputChange}
                  placeholder="내용을 입력하세요"
                />
              </InputGroup>

              <InputGroup>
                <Label>첨부파일 및 링크</Label>
                <FileLinkUploader
                  onFilesChange={handleFilesChange}
                  onLinksChange={handleLinksChange}
                  initialFiles={files}
                  initialLinks={links}
                  maxFileSize={MAX_FILE_SIZE}
                  allowedMimeTypes={allowedMimeTypes}
                />
                <span style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  color: '#64748b',
                  marginTop: '4px'
                }}>
                  * 파일 크기는 10MB 이하여야 합니다.
                </span>
              </InputGroup>
            </ModalContent>
            <ModalButtonContainer>
              <CancelButton onClick={handleCloseCreateModal}>취소</CancelButton>
              <SaveButton onClick={handleAddProposal}>저장</SaveButton>
            </ModalButtonContainer>
          </ModalContainer>
        </ModalOverlay>
      )}

      {isEditModalOpen && editingProposal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContainer onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>승인요청 수정</ModalTitle>
              <CloseButton onClick={handleCloseModal}>×</CloseButton>
            </ModalHeader>
            <ModalContent>
              <InputGroup>
                <Label>제목</Label>
                <Input
                  type="text"
                  name="title"
                  value={editingProposal.title || ''}
                  onChange={(e) => setEditingProposal({...editingProposal, title: e.target.value})}
                  placeholder="제목을 입력하세요"
                />
              </InputGroup>
              <InputGroup>
                <Label>내용</Label>
                <TextArea
                  name="content"
                  value={editingProposal.content || ''}
                  onChange={(e) => setEditingProposal({...editingProposal, content: e.target.value})}
                  placeholder="내용을 입력하세요"
                />
              </InputGroup>

              <FileLinkUploader
                onFilesChange={handleFilesChange}
                onLinksChange={handleLinksChange}
                initialFiles={[...existingFiles, ...newFiles]}
                initialLinks={[...existingLinks, ...newLinks]}
              />
            </ModalContent>
            <ModalButtonContainer>
              <CancelButton onClick={handleCloseModal}>취소</CancelButton>
              <SaveButton onClick={handleModifyProposal}>저장</SaveButton>
            </ModalButtonContainer>
          </ModalContainer>
        </ModalOverlay>
      )}

      {isDeleteModalOpen && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteTargetId(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="승인요청 삭제"
          message="정말로 이 승인요청을 삭제하시겠습니까?"
          confirmText="삭제"
          cancelText="취소"
          type="danger"
        />
      )}
    </Container>
  );
};

// EditApproversModal을 ApprovalProposal의 정적 프로퍼티로 추가
ApprovalProposal.EditApproversModal = EditApproversModal;

export default ApprovalProposal; 