import React from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import {
  MdDashboard,
  MdEvent,
  MdHistory,
  MdApps,
  MdAnalytics,
  MdSettings
} from 'react-icons/md';

const SidebarContainer = styled.aside`
  width: 240px;
  background-color: ${({ theme }) => theme.colors.sidebar};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
`;

const Logo = styled.div`
  padding: 24px;
  font-size: 20px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Nav = styled.nav`
  flex: 1;
  padding: 16px 0;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 12px 24px;
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.hover};
  }
  
  &.active {
    background-color: ${({ theme }) => theme.colors.activeBg};
    color: ${({ theme }) => theme.colors.primary};
    border-left: 3px solid ${({ theme }) => theme.colors.primary};
  }
  
  svg {
    margin-right: 12px;
    font-size: 20px;
  }
`;

const Version = styled.div`
  padding: 16px 24px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const Sidebar: React.FC = () => {
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <MdDashboard /> },
    { path: '/events', label: 'Events', icon: <MdEvent /> },
    { path: '/sessions', label: 'Sessions', icon: <MdHistory /> },
    { path: '/applications', label: 'Applications', icon: <MdApps /> },
    { path: '/analytics', label: 'Analytics', icon: <MdAnalytics /> },
    { path: '/settings', label: 'Settings', icon: <MdSettings /> },
  ];

  return (
    <SidebarContainer>
      <Logo>AI Activity Monitor</Logo>
      <Nav>
        {menuItems.map((item) => (
          <NavItem key={item.path} to={item.path}>
            {item.icon}
            {item.label}
          </NavItem>
        ))}
      </Nav>
      <Version>Version 0.1.0</Version>
    </SidebarContainer>
  );
};

export default Sidebar;