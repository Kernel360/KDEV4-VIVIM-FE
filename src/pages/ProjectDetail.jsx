/* grammarly-disable */
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import ProjectPostCreate from './ProjectPostCreate';
import { FaArrowLeft, FaArrowRight, FaPlus, FaCheck, FaClock, FaFlag, FaEdit, FaTrashAlt, FaTimes, FaGripVertical, FaInfoCircle } from 'react-icons/fa';
import ProjectStageProgress from '../components/ProjectStage';
import approvalUtils from '../utils/approvalStatus';
import { ApprovalProposalStatus } from '../constants/enums';
import axiosInstance from '../utils/axiosInstance';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useAuth } from '../hooks/useAuth';
import MainContent from '../components/common/MainContent';
import SortableItem from '../components/SortableItem';
import { ActionBadge } from '../components/common/Badge';

const { getApprovalStatusText, getApprovalStatusBackgroundColor, getApprovalStatusTextColor } = approvalUtils;

const PROGRESS_STAGE_MAP = {
  'REQUIREMENTS': '요구사항정의',
  'WIREFRAME': '화면설계',
  'DESIGN': '디자인',
  'PUBLISHING': '퍼블리싱',
  'DEVELOPMENT': '개발',
  'INSPECTION': '검수',
  'COMPLETED': '완료'
};

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
  padding: 20px;
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

const InfoItemFull = styled(InfoItem)`
  grid-column: 1 / -1;
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  box-sizing: border-box;
  margin-left: 270px;
  width: calc(100% - 270px);
  overflow-x: hidden;
  padding: 0;

  @media (max-width: 800px) {
    margin-left: 0;
    width: 100%;
  }
`;

const Header = styled.div`
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`;

const PageDescription = styled.p`
  font-size: 16px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
`;

const HeaderActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 24px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  position: absolute;
  top: 0;
  right: 0;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProjectInfoSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 0px;
  width: 100%;
  box-sizing: border-box;
`;

const ProjectHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  position: relative;
`;

const ProjectTitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
`;

const ProjectTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`;

const ProjectDescription = styled.p`
  font-size: 15px;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
`;

const ProjectSubDescription = styled.p`
  font-size: 14px;
  color: #94a3b8;
  margin: 8px 0 0 0;
  line-height: 1.5;
`;

const DateContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

const DateItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
`;

const DateLabel = styled.span`
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
`;

const DateValue = styled.span`
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
`;

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
`;

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 160px;
  z-index: 1000;
  margin-top: 8px;
`;

const DropdownItem = styled.div`
  padding: 12px 16px;
  font-size: 14px;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s ease;

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
  gap: 12px;
  padding: 48px 20px;
`;

const EmptyStateTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const EmptyStateDescription = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
  text-align: center;
`;

const StageSection = styled.div`
  background: transparent;
  width: 100%;
  box-sizing: border-box;
  padding: 0;
  margin-bottom: 16px;
`;

const StageGrid = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 600px;
  overflow: hidden;
  box-sizing: border-box;
`;

const StageItem = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 550px;
  max-height: 550px;
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  margin: 0 auto;
  box-sizing: border-box;
`;

const StageHeader = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  padding: 0;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 12px;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
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
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
`;

const BoardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '';
    display: block;
    width: 4px;
    height: 18px;
    background: #2E7D32;
    border-radius: 2px;
  }
`;

const CreateButton = styled.button`
  padding: 8px 16px;
  background: #2E7D32;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: #1B5E20;
    transform: translateY(-1px);
  }
`;

const BoardTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  box-sizing: border-box;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const BoardHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  box-sizing: border-box;
  white-space: nowrap;
  height: 40px;

  &:nth-child(1) { width: 40%; }
  &:nth-child(2) { width: 10%; }
  &:nth-child(3) { width: 20%; }
  &:nth-child(4) { width: 15%; }
  &:nth-child(5) { width: 15%; }
`;

const BoardCell = styled.td`
  padding: 10px 16px;
  font-size: 13px;
  color: #1e293b;
  border-bottom: 1px solid #e2e8f0;
  min-height: 24px;
  white-space: normal;
  word-break: break-word;
  background: transparent;
  vertical-align: middle;
  line-height: 1.4;
  box-sizing: border-box;
  transition: background-color 0.2s;
  height: 40px;

  &.title-cell {
    display: table-cell;
    width: 40%;
    font-weight: 500;
    cursor: pointer;
    color: #334155;
    padding-right: 8px;

    &:hover {
      color: #0f172a;
    }

    > div {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 100%;
      font-size: 13px;
    }
  }

  &.child-post {
    padding-left: 32px;
    color: #64748b;
    font-size: 12px;
    height: 36px;
  }
`;

const BoardRow = styled.tr`
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f8fafc;
    
    ${BoardCell} {
      background: #f8fafc;
    }
  }

  &:last-child ${BoardCell} {
    border-bottom: none;
  }
`;

const RoleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  margin-left: 8px;
  white-space: nowrap;
  height: 20px;
  line-height: 1;
  
  &.admin {
    background-color: #fee2e2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }
  
  &.developer {
    background-color: #dbeafe;
    color: #2563eb;
    border: 1px solid #bfdbfe;
  }
  
  &.client {
    background-color: #fef9c3;
    color: #ca8a04;
    border: 1px solid #fde047;
  }
`;

const AuthorCell = styled(BoardCell)`
  display: flex;
  align-items: center;
  gap: 4px;
  height: 45px;
  padding: 0 16px;

  > span {
    font-size: 13px;
    color: #1e293b;
  }

  ${RoleBadge} {
    height: 20px;
    line-height: 1;
  }
`;

const ReplyButton = styled.button`
  padding: 3px 8px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #e2e8f0;
    color: #475569;
  }
`;

const ReplyIndicator = styled.span`
  color: #94a3b8;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
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
  width: 100%;
  box-sizing: border-box;
  word-break: break-word;
  
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

const StageProgressHeader = styled.div`
  margin-bottom: 20px;
`;

const StageProgressTimeline = styled.div`
  position: relative;
  margin: 30px 0;
  padding: 0 10px;

  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    height: 2px;
    background: #2E7D32;
    z-index: 1;
  }
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
  background-color: ${props => props.completed ? '#2E7D32' : props.current ? '#3b82f6' : '#e2e8f0'};
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
  background-color: #2E7D32;
  border-radius: 2px;
`;

const StageHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  width: 100%;
  margin-top: 8px;
  box-sizing: border-box;
`;

const StageActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: #2E7D32;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: background-color 0.2s;
  min-width: 0;
  flex-shrink: 0;

  &:hover {
    background-color: rgba(46, 125, 50, 0.93);
  }

  svg {
    flex-shrink: 0;
  }
`;

const StageModalContent = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

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

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
  }
`;

const ModalBody = styled.div`
  margin-bottom: 20px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
`;

const ModalCloseButton = styled.button`
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

const ToggleSection = styled.div`
  margin-top: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const ToggleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: ${props => props.$isOpen ? '1px solid #e2e8f0' : 'none'};

  &:hover {
    background-color: #f8fafc;
  }

  span {
    color: #64748b;
    font-size: 14px;
    transition: transform 0.2s ease;
    transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  }
`;

const ToggleTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 16px;
    background-color: #2E7D32;
    border-radius: 2px;
  }
`;

const ToggleContent = styled.div`
  padding: ${props => props.$isOpen ? '20px' : '0'};
  max-height: ${props => props.$isOpen ? '500px' : '0'};
  opacity: ${props => props.$isOpen ? '1' : '0'};
  transition: all 0.3s ease;
  overflow: hidden;
`;

const ToggleItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }
`;

const ToggleLabel = styled.span`
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
`;

const ToggleValue = styled.span`
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
`;

const EmptyStage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #64748b;
  font-size: 14px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #e2e8f0;
  text-align: center;
`;

const StageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

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

const ActionButton = styled.button`
  padding: 10px 16px;
  background-color: #2E7D32;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color:rgba(46, 125, 50, 0.93);
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

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isClient, isDeveloperManager } = useAuth();
  const [project, setProject] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const stageRefs = useRef([]);
  const [showAll, setShowAll] = useState(false);
  const [progressList, setProgressList] = useState([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(() => {
    // 초기값을 null로 설정하여 데이터가 로드되기 전까지는 undefined 상태를 방지
    return null;
  });
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

  const [stages, setStages] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [showClientInfo, setShowClientInfo] = useState(false);
  const [showDevInfo, setShowDevInfo] = useState(false);

  const [projectCompanies, setProjectCompanies] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);
  const [isCompaniesLoading, setIsCompaniesLoading] = useState(false);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [currentStageAction, setCurrentStageAction] = useState(null);
  const [currentStage, setCurrentStage] = useState(null);
  const [newStageName, setNewStageName] = useState('');

  const [comments, setComments] = useState({});

  const [isSavingPositions, setIsSavingPositions] = useState(false);

  const openStageModal = (action, stage = null) => {
    if (action === 'delete') {
      if (window.confirm('정말로 이 단계를 삭제하시겠습니까?')) {
        handleDeleteStage(stage);
      }
      return;
    }
    
    setCurrentStageAction(action);
    setCurrentStage(stage);
    if (action === 'editName' && stage) {
      setNewStageName(stage.name);
    } else {
      setNewStageName('');
    }
    setIsStageModalOpen(true);
  };

  const handleDeleteStage = async (stage) => {
    try {
      await axiosInstance.delete(
        `${API_ENDPOINTS.PROJECT_DETAIL(id)}/progress/${stage.id}`,
        {
          withCredentials: true
        }
      );

      await fetchProjectProgress();
      alert('단계가 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting stage:', error);
      alert('단계 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleCloseStageModal = () => {
    setIsStageModalOpen(false);
    setCurrentStageAction(null);
    setCurrentStage(null);
    setNewStageName('');
  };

  const handleEditStageName = async () => {
    if (!newStageName.trim()) {
      alert('단계 이름을 입력해주세요.');
      return;
    }

    try {
      await axiosInstance.put(
        `${API_ENDPOINTS.PROJECT_DETAIL(id)}/progress/${currentStage.id}/naming`,
        {
          name: newStageName
        },
        {
          withCredentials: true
        }
      );

      await fetchProjectProgress();
      handleCloseStageModal();
      alert('단계 이름이 수정되었습니다.');
    } catch (error) {
      console.error('Error editing stage name:', error);
      alert('단계 이름 수정 중 오류가 발생했습니다.');
    }
  };

  const handleAddStage = async () => {
    if (!newStageName.trim()) {
      alert('단계 이름을 입력해주세요.');
      return;
    }

    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.PROJECT_DETAIL(id)}/progress`,
        {
          name: newStageName,
          position: progressList.length + 1,
          isCompleted: false  // 명시적으로 미완료 상태로 설정
        },
        {
          withCredentials: true
        }
      );

      if (response.data) {
        // 새로 추가된 단계를 포함한 전체 목록을 다시 가져옴
        await fetchProjectProgress();
        handleCloseStageModal();
      }
    } catch (error) {
      console.error('Error adding stage:', error);
      alert('단계 추가 중 오류가 발생했습니다.');
    }
  };

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
    if (isSavingPositions) {
      alert('단계 순서 저장 중입니다. 잠시만 기다려주세요.');
      return;
    }

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
        const response = await axiosInstance.delete(`${API_ENDPOINTS.PROJECTS}/${id}`, {
          withCredentials: true,
          data: {
            projectId: id,
            deleteReason: '사용자에 의한 삭제'
          }
        });
        
        if (response.data.statusCode === 200) {
          alert('프로젝트가 삭제되었습니다.');
          navigate('/admin/projects');
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
    }
  };

  const handleSavePositions = async () => {
    if (isSavingPositions) return;
    
    try {
      setIsSavingPositions(true);
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
          { targetIndex: i },
          {
            withCredentials: true
          }
        );
      }
      
      alert('단계 순서가 성공적으로 변경되었습니다.');
      setIsStageModalOpen(false);
      fetchProjectProgress(); // 단계 목록 새로고침
    } catch (error) {
      console.error('단계 순서 변경 중 오류 발생:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('단계 순서 변경에 실패했습니다.');
      }
    } finally {
      setIsSavingPositions(false);
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
      const response = await axiosInstance.get(`${API_ENDPOINTS.PROJECT_DETAIL(id)}/progress`, {
        withCredentials: true
      });
      console.log('Progress 조회 응답:', response.data);
      
      const updatedProgressList = response.data.progressList.map((progress, index, arr) => {
        const isLastStage = progress.position === Math.max(...arr.map(p => p.position));
        return {
          ...progress,
          isCompleted: isLastStage ? false : progress.isCompleted
        };
      }).sort((a, b) => a.position - b.position);
      
      setProgressList(updatedProgressList);

      // project 정보가 이미 로드되어 있다면 현재 진행 단계 설정
      if (project?.currentProgress) {
        const initialStageIndex = updatedProgressList.findIndex(stage => 
          stage.name === PROGRESS_STAGE_MAP[project.currentProgress] || 
          stage.name === project.currentProgress
        );
        if (initialStageIndex !== -1) {
          setCurrentStageIndex(initialStageIndex);
        } else {
          // 일치하는 단계를 찾지 못한 경우 첫 번째 단계로 설정
          setCurrentStageIndex(0);
        }
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchProjectDetail = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.PROJECT_DETAIL(id), {
        withCredentials: true
      });
      setProject(response.data);
      
      // progressList가 이미 로드되어 있다면 현재 진행 단계 설정
      if (response.data.currentProgress && progressList.length > 0) {
        const initialStageIndex = progressList.findIndex(stage => 
          stage.name === PROGRESS_STAGE_MAP[response.data.currentProgress] || 
          stage.name === response.data.currentProgress
        );
        if (initialStageIndex !== -1) {
          setCurrentStageIndex(initialStageIndex);
        } else {
          // 일치하는 단계를 찾지 못한 경우 첫 번째 단계로 설정
          setCurrentStageIndex(0);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching project:', error);
      setLoading(false);
    }
  };

  const fetchProjectPosts = async () => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINTS.PROJECT_DETAIL(id)}/posts`, {
        withCredentials: true
      });
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };
  
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
  const handleApprovalClick = (approval) => {
    console.log('승인요청 상세로 이동:', {
      approvalId: approval.id,
      projectId: id,
      state: { projectId: id }
    });
    navigate(`/project/${id}/approval/${approval.id}`);
  };
  
  // 승인요청 목록 조회
  const fetchApprovalRequests = async () => {
    try {
      if (!project) {
        console.log('프로젝트 정보가 없어 승인요청 목록을 조회하지 않습니다.');
        return;
      }

      // 사용자 권한 확인
      if (!isAdmin && !isClient && !isDeveloperManager) {
        console.log('접근 권한이 없습니다.');
        return;
      }

      const { data } = await axiosInstance.get(`${API_ENDPOINTS.PROJECT_DETAIL(id)}/approvals`, {
        withCredentials: true
      });
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
      const { data } = await axiosInstance.get(`${API_ENDPOINTS.PROJECT_DETAIL(id)}/progress/overall-progress`, {
        withCredentials: true
      });
      
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
      const { data } = await axiosInstance.get(`${API_ENDPOINTS.PROJECT_DETAIL(id)}/progress/status`, {
        withCredentials: true
      });

      // 각 단계의 완료 여부는 단계 승급 버튼을 눌러야만 설정되도록 수정
      const updatedProgressList = data.progressList.map(progress => ({
        ...progress,
        isCompleted: progress.isCompleted || false // 기존 isCompleted 값 유지
      }));

      setProgressStatus({
        ...data,
        progressList: updatedProgressList
      });

      // 현재 진행 중인 단계 찾기
      const currentProgressStage = updatedProgressList.find(stage => 
        stage.name === PROGRESS_STAGE_MAP[project?.currentProgress] || 
        stage.name === project?.currentProgress
      );
      const currentPosition = currentProgressStage?.position || 0;
      
      // 현재 진행 중인 단계보다 position이 낮은 단계들의 개수 계산
      const completedStages = updatedProgressList.filter(stage => stage.position < currentPosition).length;

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
  
  // 회사 정보 조회
  const fetchProjectCompanies = async () => {
    try {
      setIsCompaniesLoading(true);
      const response = await axiosInstance.get(`${API_ENDPOINTS.PROJECT_DETAIL(id)}/companies`, {
        withCredentials: true
      });
      setProjectCompanies(response.data);
    } catch (error) {
      console.error('회사 정보 조회 중 오류 발생:', error);
    } finally {
      setIsCompaniesLoading(false);
    }
  };

  // 고객사 사용자 정보 조회
  const fetchProjectUsers = async () => {
    try {
      setIsUsersLoading(true);
      const response = await axiosInstance.get(`${API_ENDPOINTS.PROJECT_DETAIL(id)}/users`, {
        withCredentials: true
      });
      setProjectUsers(response.data);
    } catch (error) {
      console.error('고객사 사용자 정보 조회 중 오류 발생:', error);
    } finally {
      setIsUsersLoading(false);
    }
  };

  // 토글 헤더 클릭 핸들러 수정
  const handleCompanyInfoToggle = async () => {
    try {
      if (!showCompanyInfo) {
        setIsCompaniesLoading(true);
        await fetchProjectCompanies();
      }
      setShowCompanyInfo(!showCompanyInfo);
    } catch (error) {
      console.error('토글 처리 중 오류:', error);
    } finally {
      setIsCompaniesLoading(false);
    }
  };

  const handleClientInfoToggle = async () => {
    try {
      if (!showClientInfo) {
        setIsUsersLoading(true);
        await fetchProjectUsers();
      }
      setShowClientInfo(!showClientInfo);
    } catch (error) {
      console.error('토글 처리 중 오류:', error);
    } finally {
      setIsUsersLoading(false);
    }
  };

  // progressList가 변경될 때도 현재 진행 단계 업데이트
  useEffect(() => {
    if (project?.currentProgress && progressList.length > 0) {
      const initialStageIndex = progressList.findIndex(
        stage => stage.name === PROGRESS_STAGE_MAP[project.currentProgress] || 
        stage.name === project.currentProgress
      );
      if (initialStageIndex !== -1) {
        setCurrentStageIndex(initialStageIndex);
      } else {
        // 일치하는 단계를 찾지 못한 경우 첫 번째 단계로 설정
        setCurrentStageIndex(0);
      }
    }
  }, [progressList, project?.currentProgress]);

  // 현재 단계의 모든 승인요청이 APPROVED 상태인지 확인하는 함수
  const isAllApprovalsApproved = (stageId) => {
    const stageApprovals = approvalRequests.filter(req => req.stageId === stageId);
    return stageApprovals.length > 0 && stageApprovals.every(req => 
      req.approvalProposalStatus === ApprovalProposalStatus.FINAL_APPROVED
    );
  };

  // 댓글 목록 조회 함수
  const fetchComments = async (postId) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINTS.POSTS}/${postId}/comments`, {
        withCredentials: true
      });
      setComments(prev => ({
        ...prev,
        [postId]: response.data
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // 게시글 클릭 핸들러 수정
  const handlePostClick = (post) => {
    // 댓글 목록 조회
    fetchComments(post.postId);
    // 게시글 상세 페이지로 이동
    navigate(`/project/${id}/post/${post.postId}`);
  };

  // 날짜 포맷 함수 추가
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // 역할 한글 변환
  const getRoleLabel = (role) => {
    switch (role) {
      case 'CLIENT_MANAGER': return '고객사 담당자';
      case 'CLIENT_USER': return '고객사 사용자';
      case 'DEVELOPER_MANAGER': return '개발사 담당자';
      case 'DEVELOPER_USER': return '개발사 사용자';
      case 'ADMIN': return '관리자';
      default: return role;
    }
  };

  // 상태 텍스트 반환 함수 수정: COMPLETED는 '완료됨'으로, ENDED는 제거
  const getProjectStatusText = (project) => {
    if (project.isDeleted) return '삭제됨';
    if (project.currentProgress === 'COMPLETED') return '완료';
    return '진행중';
  };

  // 사용자 역할 확인 함수 수정
  const checkUserRole = () => {
    if (!user) {
      return false;
    }
    console.log('user companyRole:', user.companyRole);
    return user.companyRole === 'CUSTOMER';
  };

  return (
        <MainContent>
      <ContentWrapper>
        {loading ? (
          <LoadingMessage>데이터를 불러오는 중...</LoadingMessage>
        ) : project ? (
          <ContentContainer>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <BackButton onClick={() => navigate('/admin/projects')}>
                <span>←</span>
                목록으로
              </BackButton>
              <PageTitle style={{ margin: '0 0 0 24px' }}>프로젝트 상세</PageTitle>
            </div>
            <ProjectInfoSection>
              <ProjectHeader>
                <ActionBadge 
                  type={project?.isDeleted ? "error" : "success"}
                  size="medium"
                  hoverable={false}
                >
                  {getProjectStatusText(project)}
                </ActionBadge>
                {isAdmin && !project?.isDeleted && (
                  <ActionButtons>
                    <ActionBadge
                      type="primary"
                      size="medium"
                      onClick={() => navigate(`/projectModify/${id}`)}
                    >
                      수정
                    </ActionBadge>
                    <ActionBadge
                      type="error"
                      size="medium"
                      onClick={() => handleDeleteProject()}
                    >
                      삭제
                    </ActionBadge>
                  </ActionButtons>
                )}
              </ProjectHeader>
              <ProjectTitleSection>
                <ProjectTitle>{project.name}</ProjectTitle>
                <ProjectDescription>{project.description || '프로젝트 설명이 없습니다.'}</ProjectDescription>
              </ProjectTitleSection>
              <DateContainer>
                <DateItem>
                  <DateLabel>시작일</DateLabel>
                  <DateValue>{project.startDate}</DateValue>
                </DateItem>
                <DateItem>
                  <DateLabel>종료일</DateLabel>
                  <DateValue>{project.endDate}</DateValue>
                </DateItem>
                <DateItem>
                  <DateLabel>계약금</DateLabel>
                  <DateValue>{project.projectFee?.toLocaleString()}원</DateValue>
                </DateItem>
              </DateContainer>

              {/* 회사 정보 표시 */}
              <ToggleSection>
                <ToggleHeader 
                  onClick={handleCompanyInfoToggle}
                  $isOpen={showCompanyInfo}
                >
                  <ToggleTitle>회사 정보</ToggleTitle>
                  <span>▼</span>
                </ToggleHeader>
                <ToggleContent $isOpen={showCompanyInfo}>
                  {isCompaniesLoading ? (
                    <LoadingMessage>회사 정보를 불러오는 중...</LoadingMessage>
                  ) : projectCompanies.length === 0 ? (
                    <EmptyStateContainer>
                      <EmptyStateTitle>회사 정보가 없습니다</EmptyStateTitle>
                    </EmptyStateContainer>
                  ) : (
                    <>
                      <ToggleItem>
                        <ToggleLabel>고객사</ToggleLabel>
                        <ToggleValue>
                          {projectCompanies.filter(c => c.companyRole === 'CUSTOMER').map(c => c.name).join(', ') || '-'}
                        </ToggleValue>
                      </ToggleItem>
                      <ToggleItem>
                        <ToggleLabel>개발사</ToggleLabel>
                        <ToggleValue>
                          {projectCompanies.filter(c => c.companyRole === 'DEVELOPER').map(c => c.name).join(', ') || '-'}
                        </ToggleValue>
                      </ToggleItem>
                    </>
                  )}
                </ToggleContent>
              </ToggleSection>

              {/* 프로젝트 소속 직원 정보 표시 */}
              <ToggleSection>
                <ToggleHeader 
                  onClick={handleClientInfoToggle}
                  $isOpen={showClientInfo}
                >
                  <ToggleTitle>프로젝트 소속 직원 정보</ToggleTitle>
                  <span>▼</span>
                </ToggleHeader>
                <ToggleContent $isOpen={showClientInfo}>
                  {isUsersLoading ? (
                    <LoadingMessage>직원 정보를 불러오는 중...</LoadingMessage>
                  ) : projectUsers.length === 0 ? (
                    <EmptyStateContainer>
                      <EmptyStateTitle>직원 정보가 없습니다</EmptyStateTitle>
                    </EmptyStateContainer>
                  ) : (
                    <StageList>
                      {projectUsers.map(user => (
                        <ToggleItem key={user.userId}>
                          <ToggleLabel>{getRoleLabel(user.role)}</ToggleLabel>
                          <ToggleValue>{user.userName}</ToggleValue>
                        </ToggleItem>
                      ))}
                    </StageList>
                  )}
                </ToggleContent>
              </ToggleSection>

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
                  currentProgress={project?.currentProgress}
                  projectId={project?.id}
                  fetchProjectProgress={fetchProjectProgress}
                  onProgressStatusUpdate={setProgressStatus}
                >
                  {progressList.length > 0 ? (
                    progressList
                  .sort((a, b) => a.position - b.position)
                    .map((stage, index) => {
                      // 전체 단계들 중에서의 순서 계산
                      const totalOrder = progressList
                        .sort((a, b) => a.position - b.position)
                        .findIndex(s => s.id === stage.id) + 1;
                      
                      return (
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
                            {approvalRequests.filter(req => req.stageId === stage.id).length === 0 && (
                              <EmptyStage>
                                <div>
                                  <FaInfoCircle /> 등록된 승인요청이 없습니다.
                                </div>
                                {checkUserRole() && (
                                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                                    개발사의 승인요청이 아직 전송되지 않았습니다.
                                  </div>
                                )}
                              </EmptyStage>
                            )}
                          </StageItem>
                        </StageContainer>
                      );
                    })
                  ) : (
                    <EmptyStage>
                      <FaInfoCircle /> 진행 단계가 없습니다.
                    </EmptyStage>
                  )}
                </ProjectStageProgress>
              </StageSplitLayout>
            </StageSection>

                        <BoardSection>
                          <BoardHeader>
                            <SectionTitle>게시판</SectionTitle>
                            <ActionBadge
                              type="success"
                              size="medium"
                              onClick={() => navigate(`/project/${id}/post/create`)}
                            >
                              글쓰기
                            </ActionBadge>
                          </BoardHeader>
                          <BoardTable>
                            <thead>
                              <tr>
                                <BoardHeaderCell>제목</BoardHeaderCell>
                                <BoardHeaderCell>상태</BoardHeaderCell>
                                <BoardHeaderCell>작성자</BoardHeaderCell>
                                <BoardHeaderCell>작성일</BoardHeaderCell>
                                <BoardHeaderCell>답글</BoardHeaderCell>
                              </tr>
                            </thead>
                            <tbody>
                              {posts.length === 0 ? (
                                <tr>
                                  <EmptyBoardCell colSpan="5">
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
                                        <div>
                                          {post.parentId && <ReplyIndicator>↳</ReplyIndicator>}
                                          {post.title}
                                        </div>
                                      </BoardCell>
                                      <BoardCell onClick={() => navigate(`/project/${id}/post/${post.postId}`)}>
                                        {post.projectPostStatus === 'NOTIFICATION' ? '공지' : 
                                         post.projectPostStatus === 'QUESTION' ? '질문' : '일반'}
                                      </BoardCell>
                                      <AuthorCell onClick={() => navigate(`/project/${id}/post/${post.postId}`)}>
                                        <span>{post.creatorName}</span>
                                        <RoleBadge className={
                                          post.creatorRole === 'ADMIN' ? 'admin' :
                                          post.creatorRole.includes('DEVELOPER') ? 'developer' :
                                          post.creatorRole.includes('CLIENT') ? 'client' : ''
                                        }>
                                          {post.creatorRole === 'ADMIN' ? '관리자' :
                                           post.creatorRole.includes('DEVELOPER') ? '개발사' :
                                           post.creatorRole.includes('CLIENT') ? '고객사' : ''}
                                        </RoleBadge>
                                      </AuthorCell>
                                      <BoardCell onClick={() => navigate(`/project/${id}/post/${post.postId}`)}>
                                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '-'}
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
                                                  parentId: post.parentId
                                                }
                                              }
                                            });
                                          }}>
                                            답글
                                          </ReplyButton>
                                        )}
                                      </BoardCell>
                                    </BoardRow>
                                  ))
                              )}
                            </tbody>
                          </BoardTable>
                        </BoardSection>

            {isStageModalOpen && (
              <ModalOverlay onClick={(e) => {
                // 모달 컨텐츠 영역 클릭 시 이벤트 전파 중단
                if (e.target === e.currentTarget) {
                  handleCloseStageModal();
                }
              }}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                  <ModalHeader>
                    <h2>
                      {currentStageAction === 'add' && '새 단계 추가'}
                      {currentStageAction === 'editName' && '단계 이름 수정'}
                      {currentStageAction === 'editPosition' && '단계 순서 변경'}
                    </h2>
                    <ModalCloseButton onClick={handleCloseStageModal}>×</ModalCloseButton>
                  </ModalHeader>
                  <ModalBody>
                    {currentStageAction === 'add' && (
                      <div style={{ boxSizing: 'border-box', width: '100%' }}>
                        <label htmlFor="stageName">단계 이름</label>
                        <input
                          type="text"
                          id="stageName"
                          value={newStageName}
                          onChange={(e) => setNewStageName(e.target.value)}
                          placeholder="새 단계 이름을 입력하세요"
                          style={{
                            width: '100%',
                            padding: '8px',
                            marginTop: '8px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    )}
                    {currentStageAction === 'editName' && (
                      <div style={{ boxSizing: 'border-box', width: '100%' }}>
                        <label htmlFor="editStageName">단계 이름</label>
                        <input
                          type="text"
                          id="editStageName"
                          value={newStageName}
                          onChange={(e) => setNewStageName(e.target.value)}
                          placeholder="단계 이름을 입력하세요"
                          style={{
                            width: '100%',
                            padding: '8px',
                            marginTop: '8px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    )}
                    {currentStageAction === 'editPosition' && (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        announcements={{
                          onDragStart: () => '',
                          onDragOver: () => '',
                          onDragEnd: () => '',
                          onDragCancel: () => ''
                        }}
                      >
                        <SortableContext
                          items={progressList
                            .filter(stage => {
                              // 현재 진행 중인 단계 찾기
                              const currentProgressStage = progressList.find(s => 
                                s.name === PROGRESS_STAGE_MAP[project?.currentProgress] || 
                                s.name === project?.currentProgress
                              );
                              const currentPosition = currentProgressStage?.position || 0;
                              return stage.position > currentPosition;
                            })
                            .map(item => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <StageList>
                            {isSavingPositions && (
                              <div style={{
                                padding: '12px',
                                marginBottom: '12px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                color: '#64748b',
                                textAlign: 'center',
                                fontSize: '14px'
                              }}>
                                단계 순서 저장 중입니다...
                              </div>
                            )}
                            {progressList
                              .filter(stage => {
                                // 현재 진행 중인 단계 찾기
                                const currentProgressStage = progressList.find(s => 
                                  s.name === PROGRESS_STAGE_MAP[project?.currentProgress] || 
                                  s.name === project?.currentProgress
                                );
                                const currentPosition = currentProgressStage?.position || 0;
                                return stage.position > currentPosition;
                              })
                              .sort((a, b) => a.position - b.position)
                              .map((stage) => {
                                // 전체 단계들 중에서의 순서 계산
                                const totalOrder = progressList
                                  .sort((a, b) => a.position - b.position)
                                  .findIndex(s => s.id === stage.id) + 1;
                                
                                return (
                                  <SortableItem
                                    key={stage.id}
                                    id={stage.id}
                                    name={stage.name}
                                    position={totalOrder}  // 전체 단계들 중에서의 순서
                                    disabled={isSavingPositions}
                                  />
                                );
                              })}
                          </StageList>
                        </SortableContext>
                      </DndContext>
                    )}
                  </ModalBody>
                  <ModalFooter>
                    {currentStageAction === 'add' && (
                      <>
                        <ActionButton onClick={handleAddStage}>추가</ActionButton>
                        <CancelButton onClick={handleCloseStageModal}>취소</CancelButton>
                      </>
                    )}
                    {currentStageAction === 'editName' && (
                      <>
                        <ActionButton onClick={handleEditStageName}>저장</ActionButton>
                        <CancelButton onClick={handleCloseStageModal}>취소</CancelButton>
                      </>
                    )}
                    {currentStageAction === 'editPosition' && (
                      <>
                        <ActionButton onClick={handleSavePositions}>순서 저장</ActionButton>
                        <CancelButton onClick={handleCloseStageModal}>취소</CancelButton>
                      </>
                    )}
                  </ModalFooter>
                </ModalContent>
              </ModalOverlay>
            )}
          </ContentContainer>
        ) : (
          <LoadingMessage>데이터를 불러오는 중...</LoadingMessage>
        )}
      </ContentWrapper>
    </MainContent>
  );
};

export default ProjectDetail;