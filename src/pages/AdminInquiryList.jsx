import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import axiosInstance from '../utils/axiosInstance';

const AdminInquiryList = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  
  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  };

  const token = localStorage.getItem('token');
  const decodedToken = decodeToken(token);
  const isAdmin = decodedToken?.role === 'ADMIN';
  
  const [activeMenuItem, setActiveMenuItem] = useState(isAdmin ? '관리자 문의' : '내 문의 내역');

  const fetchInquiries = async () => {
    try {

      const { data } = await axiosInstance.get(
        isAdmin ? API_ENDPOINTS.ADMIN_INQUIRY_LIST : API_ENDPOINTS.USER_INQUIRY_LIST
      );
      const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setInquiries(sortedData);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      setInquiries([]);
    }
  };

  // 문의 내역 조회
  useEffect(() => {
    fetchInquiries();
  }, [isAdmin, token]);

  const handleMenuClick = (menuItem) => {
    setActiveMenuItem(menuItem);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말로 삭제하시겠습니까?')) return;

    try {
      await axiosInstance.delete(API_ENDPOINTS.ADMIN_INQUIRY_DETAIL(id));
      alert('삭제되었습니다.');
      fetchInquiries();
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <PageContainer>
      <Navbar 
        activeMenuItem={activeMenuItem}
        handleMenuClick={handleMenuClick}
      />
      <MainContent>
        <Header>
          <PageTitle>{isAdmin ? '관리자 문의' : '내 문의 내역'}</PageTitle>
          {!isAdmin && (
            <CreateButton onClick={() => navigate('/admin-inquiry')}>
              문의 작성
            </CreateButton>
          )}
        </Header>
        <Table>
          <thead>
            <tr>
              <Th>문의 유형</Th>
              <Th>제목</Th>
              <Th>작성자</Th>
              <Th>작성일</Th>
              <Th>상태</Th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry) => (
              <tr key={inquiry.id}>
                <Td>
                  <TypeBadge type={inquiry.inquiryType}>
                    {inquiry.inquiryType === 'NORMAL' ? '일반' :
                     inquiry.inquiryType === 'PROJECT' ? '프로젝트' :
                     inquiry.inquiryType === 'TECHNICAL' ? '기술' : '사업'}
                  </TypeBadge>
                </Td>
                <Td 
                  isTitle
                  onClick={() => navigate(`/admin-inquiry-list/${inquiry.id}`)}
                  style={{ color: '#1e293b' }}
                >
                  {inquiry.title}
                </Td>
                <Td style={{ color: '#4B5563' }}>{inquiry.creatorName}</Td>
                <Td style={{ color: '#64748B' }}>
                  {new Date(inquiry.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  }).replace(/\. /g, '.').slice(0, -1)}
                </Td>
                <Td>
                  <StatusBadge status={inquiry.inquiryStatus}>
                    {inquiry.inquiryStatus === 'PENDING' ? '대기중' :
                     inquiry.inquiryStatus === 'IN_PROGRESS' ? '처리중' : '완료'}
                  </StatusBadge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
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
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
`;

const Section = styled.section`
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 20px 0;
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  width: 100%;
  margin: 0 auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const TableHeader = styled.thead`
  background: #f8fafc;
  
  th {
    padding: 16px;
    text-align: left;
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
    border-bottom: 1px solid #e2e8f0;
  }
`;

const TableBody = styled.tbody`
  tr:hover {
    background: #f8fafc;
  }
`;

const TableRow = styled.tr`
  td {
    padding: 16px;
    font-size: 14px;
    color: #1e293b;
    border-bottom: 1px solid #e2e8f0;
  }
`;

const InquiryTitle = styled.span`
  color: #1e293b;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    color: #3b82f6;
  }
`;

const InquiryStatus = styled.span`
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  ${props => {
    switch (props.status) {
      case '미답변':
        return `
          background-color: #FEF2F2;
          color: #EF4444;
        `;
      case '답변완료':
        return `
          background-color: #F0FDF4;
          color: #22C55E;
        `;
      case '검토중':
        return `
          background-color: #F0F9FF;
          color: #0EA5E9;
        `;
      default:
        return `
          background-color: #F8FAFC;
          color: #64748B;
        `;
    }
  }}
`;

const CreateButton = styled.button`
  padding: 10px 20px;
  background-color: #2E7D32;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #1B5E20;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:before {
    content: '+';
    font-size: 18px;
    font-weight: 600;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const Th = styled.th`
  text-align: left;
  padding: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  
  &:first-child {
    padding-left: 24px;
  }
  
  &:last-child {
    padding-right: 24px;
  }
`;

const Td = styled.td`
  padding: 16px;
  font-size: 14px;
  color: #1e293b;
  border-bottom: 1px solid #e2e8f0;
  
  &:first-child {
    padding-left: 24px;
  }
  
  &:last-child {
    padding-right: 24px;
  }

  ${props => props.isTitle && `
    font-weight: 500;
    cursor: pointer;
    
    &:hover {
      text-decoration: underline;
      opacity: 0.8;
    }
  `}
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

export default AdminInquiryList; 