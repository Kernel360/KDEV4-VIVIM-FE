import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { API_ENDPOINTS } from '../config/api';
import axiosInstance from '../utils/axiosInstance';

const AdminInquiryDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [inquiry, setInquiry] = useState(null);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  
  const token = localStorage.getItem('token');
  const isAdmin = token && JSON.parse(atob(token.split('.')[1])).role === 'ADMIN';
  
  const [activeMenuItem, setActiveMenuItem] = useState(isAdmin ? '관리자 문의' : '내 문의 내역');

  useEffect(() => {
    const fetchInquiryDetail = async () => {
      try {
        const { data } = await axiosInstance.get(API_ENDPOINTS.ADMIN_INQUIRY_DETAIL(id));
        setInquiry(data);
      } catch (error) {
        console.error('Error fetching inquiry:', error);
      }
    };

    fetchInquiryDetail();
  }, [id]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const { data } = await axiosInstance.get(API_ENDPOINTS.ADMIN_INQUIRY_COMMENTS(id));
        console.log('Fetched comments:', data);
        setComments(data);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    if (id) {
      fetchComments();
    }
  }, [id]);

  const handleCompleteAnswer = async () => {
    try {
      setIsSubmitting(true);
      const { data } = await axiosInstance.patch(API_ENDPOINTS.ADMIN_INQUIRY_COMPLETE(id));
      alert('답변이 완료 처리되었습니다.');
      window.location.reload();
    } catch (error) {
      console.error('Error completing answer:', error);
      alert('답변 완료 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      alert('답변을 입력해주세요.');
      return;
    }

    try {
      const { data } = await axiosInstance.post(API_ENDPOINTS.ADMIN_INQUIRY_COMMENT(id), {
        content: answer
      });
      alert('답변이 등록되었습니다.');
      setAnswer('');
      window.location.reload();
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('답변 등록 중 오류가 발생했습니다.');
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    try {
      const { data } = await axiosInstance.put(API_ENDPOINTS.ADMIN_INQUIRY_COMMENT_EDIT(id, commentId), {
        content: editContent
      });
      alert('답변이 수정되었습니다.');
      setEditingCommentId(null);
      setEditContent('');
      window.location.reload();
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('답변 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteComment = async (comment) => {
    if (!window.confirm('정말로 이 답변을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_INQUIRY_COMMENT_DELETE(id, comment.id), {
        method: 'PATCH',
        headers: {
          'Authorization': token
        }
      });

      if (response.ok) {
        alert('답변이 삭제되었습니다.');
        window.location.reload();
      } else {
        throw new Error('답변 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('답변 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEditInquiry = () => {
    navigate(`/admin-inquiry-list/${id}/edit`);
  };

  const handleDeleteInquiry = async () => {
    if (window.confirm('정말로 이 문의를 삭제하시겠습니까?')) {
      try {
        const { data } = await axiosInstance.patch(API_ENDPOINTS.ADMIN_INQUIRY_DELETE(id));
        alert('문의가 삭제되었습니다.');
        navigate('/admin-inquiry-list');
      } catch (error) {
        console.error('Error deleting inquiry:', error);
        alert('문의 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  if (!inquiry) return null;

  return (
    <PageContainer>
      <Navbar 
        activeMenuItem={activeMenuItem}
        handleMenuClick={setActiveMenuItem}
      />
      <MainContent>
        <Header>
          <BackButton onClick={() => navigate(-1)}>← 목록으로</BackButton>
          <PageTitle>{isAdmin ? '관리자 문의 상세' : '문의 상세'}</PageTitle>
        </Header>
        <ContentContainer>
          <TitleSection>
            <TitleHeader>
              <div>
                <TypeBadge type={inquiry.inquiryType}>
                  {inquiry.inquiryType === 'NORMAL' ? '일반' :
                   inquiry.inquiryType === 'PROJECT' ? '프로젝트' : ''}
                </TypeBadge>
                <StatusBadge status={inquiry.inquiryStatus}>
                  {inquiry.inquiryStatus === 'PENDING' ? '대기중' :
                   inquiry.inquiryStatus === 'IN_PROGRESS' ? '처리중' : '완료'}
                </StatusBadge>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <EditButton onClick={handleEditInquiry}>
                    수정
                  </EditButton>
                  <DeleteButton onClick={handleDeleteInquiry}>
                    삭제
                  </DeleteButton>
                </div>
              )}
            </TitleHeader>
            <Title>{inquiry.title}</Title>
            <InfoSection>
              <InfoItem>
                <InfoLabel>작성자</InfoLabel>
                <InfoValue>{inquiry.creatorName}</InfoValue>
              </InfoItem>
              {inquiry.inquiryType === 'PROJECT' && (
                <InfoItem>
                  <InfoLabel>프로젝트</InfoLabel>
                  <InfoValue>{inquiry.projectName}</InfoValue>
                </InfoItem>
              )}
              <InfoItem>
                <InfoLabel>작성일</InfoLabel>
                <InfoValue>
                  {new Date(inquiry.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  }).replace(/\. /g, '.').slice(0, -1)}
                </InfoValue>
              </InfoItem>
              {isAdmin && comments.length > 0 && (
                <InfoItem style={{ marginLeft: 'auto' }}>
                  <CompleteButton 
                    onClick={handleCompleteAnswer}
                    disabled={inquiry.inquiryStatus === 'COMPLETED' || isSubmitting}
                  >
                    {inquiry.inquiryStatus === 'COMPLETED' ? '답변완료' : '답변완료하기'}
                  </CompleteButton>
                </InfoItem>
              )}
            </InfoSection>
          </TitleSection>
          <ContentSection>
            <Content>{inquiry.content}</Content>
          </ContentSection>

          <CommentSection>
            <CommentTitle>답변 내역</CommentTitle>
            {comments && comments.length > 0 ? (
              comments.map((comment) => (
                <CommentItem key={comment.id}>
                  <CommentHeader>
                    <CommentInfo>
                      <AdminBadge>관리자</AdminBadge>
                      <CommentDate>
                        {new Date(comment.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        }).replace(/\. /g, '.').slice(0, -1)}
                      </CommentDate>
                    </CommentInfo>
                    <CommentButtons>
                      <CommentButton onClick={() => handleEditComment(comment)}>
                        수정
                      </CommentButton>
                      <CommentButton className="delete" onClick={() => handleDeleteComment(comment)}>
                        삭제
                      </CommentButton>
                    </CommentButtons>
                  </CommentHeader>
                  {editingCommentId === comment.id ? (
                    <EditContainer>
                      <EditTextArea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        autoFocus
                      />
                      <EditButtons>
                        <EditButton onClick={() => handleSaveEdit(comment.id)}>
                          저장
                        </EditButton>
                        <EditButton className="cancel" onClick={handleCancelEdit}>
                          취소
                        </EditButton>
                      </EditButtons>
                    </EditContainer>
                  ) : (
                    <CommentContent>{comment.content}</CommentContent>
                  )}
                </CommentItem>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                아직 답변이 없습니다.
              </div>
            )}
          </CommentSection>

          {isAdmin && (
            <AnswerSection>
              <AnswerTitle>관리자 답변</AnswerTitle>
              <AnswerInputContainer>
                <AnswerTextArea
                  placeholder="답변을 입력해주세요..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={inquiry.inquiryStatus === 'COMPLETED'}
                />
                <SubmitButton 
                  onClick={handleSubmitAnswer}
                  disabled={inquiry.inquiryStatus === 'COMPLETED' || !answer.trim()}
                >
                  등록
                </SubmitButton>
              </AnswerInputContainer>
            </AnswerSection>
          )}
        </ContentContainer>
      </MainContent>
    </PageContainer>
  );
};

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
`;

const MainContent = styled.main`
  padding: 32px;
  margin-top: 60px;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
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

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const ContentContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TitleSection = styled.div`
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
`;

const TitleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  > div {
    display: flex;
    gap: 8px;
  }
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
`;

const InfoSection = styled.div`
  display: flex;
  gap: 24px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoLabel = styled.span`
  color: #64748b;
  font-size: 14px;
`;

const InfoValue = styled.span`
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
`;

const ContentSection = styled.div`
  padding: 24px;
`;

const Content = styled.div`
  font-size: 15px;
  line-height: 1.6;
  color: #1e293b;
  white-space: pre-wrap;
`;

const CreatedAt = styled.div`
  color: #64748b;
  font-size: 14px;
`;

const TypeBadge = styled.span`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  
  ${props => {
    switch (props.type) {
      case 'PROJECT':
        return `
          background: #EFF6FF;
          color: #2563EB;
        `;
      case 'TECHNICAL':
        return `
          background: #F5F3FF;
          color: #7C3AED;
        `;
      case 'BUSINESS':
        return `
          background: #FFFBEB;
          color: #D97706;
        `;
      default: // NORMAL
        return `
          background: #F3F4F6;
          color: #4B5563;
        `;
    }
  }}
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 'COMPLETED':
        return `
          background: #F0FDF4;
          color: #15803D;
        `;
      case 'IN_PROGRESS':
        return `
          background: #EFF6FF;
          color: #2563EB;
        `;
      default: // PENDING
        return `
          background: #FEF2F2;
          color: #DC2626;
        `;
    }
  }}
`;

const EditButton = styled.button`
  padding: 10px 20px;
  background-color: #2E7D32;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #1B5E20;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const CompleteButton = styled.button`
  padding: 10px 20px;
  background-color: ${props => props.disabled ? '#94A3B8' : '#2563EB'};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.disabled ? '#94A3B8' : '#1E40AF'};
    ${props => !props.disabled && `
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    `}
  }
`;

const DeleteButton = styled.button`
  padding: 10px 20px;
  background-color: #DC2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #B91C1C;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const AnswerSection = styled.div`
  padding: 24px;
  border-top: 1px solid #e2e8f0;
  box-sizing: border-box;
`;

const AnswerTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
`;

const AnswerInputContainer = styled.div`
  position: relative;
  width: 100%;
`;

const AnswerTextArea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: 16px;
  padding-bottom: 60px; // 버튼 공간 확보
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #2563EB;
  }
  
  &:disabled {
    background-color: #f8fafc;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  position: absolute;
  bottom: 16px;
  right: 16px;
  padding: 8px 16px;
  background-color: #2563EB;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #1E40AF;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    background-color: #94A3B8;
    cursor: not-allowed;
  }
`;

const CommentSection = styled.div`
  padding: 24px;
  border-top: 1px solid #e2e8f0;
`;

const CommentTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 20px 0;
`;

const CommentItem = styled.div`
  padding: 20px;
  background-color: #f8fafc;
  border-radius: 8px;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const CommentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AdminBadge = styled.span`
  padding: 4px 8px;
  background-color: #2563EB;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const CommentDate = styled.span`
  color: #64748b;
  font-size: 14px;
`;

const CommentContent = styled.div`
  color: #1e293b;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
`;

const CommentButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const CommentButton = styled.button`
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: white;
  border: 1px solid #e2e8f0;
  color: #64748b;

  &:hover {
    background-color: #f8fafc;
    transform: translateY(-1px);
  }

  &.delete {
    color: #DC2626;
    border-color: #DC2626;
    
    &:hover {
      background-color: #FEF2F2;
    }
  }
`;

const EditContainer = styled.div`
  position: relative;
  margin-top: 12px;
`;

const EditTextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #2563EB;
  }
`;

const EditButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

export default AdminInquiryDetail; 