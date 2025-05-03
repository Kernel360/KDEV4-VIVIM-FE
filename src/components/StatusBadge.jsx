import styled from 'styled-components';

const StatusBadge = styled.div`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => {
    switch (props.$status) {
      case 'pending':
        return '#FFD700';
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'delayed':
        return '#FF9800';
      case 'normal':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  }};
  color: ${props => props.$status === 'pending' ? '#000' : '#fff'};
`; 