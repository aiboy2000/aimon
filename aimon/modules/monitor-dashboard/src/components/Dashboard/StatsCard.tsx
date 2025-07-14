import React from 'react';
import styled from 'styled-components';

const Card = styled.div<{ color: string }>`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: 8px;
  padding: 20px;
  box-shadow: ${({ theme }) => theme.shadows.small};
  transition: all ${({ theme }) => theme.transitions.normal};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
  }
`;

const Title = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 8px;
`;

const Value = styled.div<{ color: string }>`
  font-size: 28px;
  font-weight: 600;
  color: ${({ color }) => color};
`;

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: string;
  color: string;
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, color, loading }) => {
  return (
    <Card color={color}>
      <Title>{title}</Title>
      <Value color={color}>
        {loading ? '...' : value}
      </Value>
    </Card>
  );
};

export default StatsCard;