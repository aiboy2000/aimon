import React from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import { MdRefresh, MdNotifications, MdPerson } from 'react-icons/md';

const HeaderContainer = styled.header`
  height: 64px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
`;

const PageTitle = styled.h2`
  font-size: 20px;
  font-weight: 500;
  margin: 0;
  text-transform: capitalize;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const IconButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: ${({ theme }) => theme.colors.text};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.hover};
  }
`;

const Header: React.FC = () => {
  const location = useLocation();
  const pageTitle = location.pathname.split('/')[1] || 'Dashboard';

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <HeaderContainer>
      <PageTitle>{pageTitle}</PageTitle>
      <Actions>
        <IconButton onClick={handleRefresh} title="Refresh">
          <MdRefresh />
        </IconButton>
        <IconButton title="Notifications">
          <MdNotifications />
        </IconButton>
        <IconButton title="Profile">
          <MdPerson />
        </IconButton>
      </Actions>
    </HeaderContainer>
  );
};

export default Header;