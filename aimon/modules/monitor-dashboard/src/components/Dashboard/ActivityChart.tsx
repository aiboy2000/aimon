import React from 'react';
import styled from 'styled-components';

const ChartContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: 8px;
  padding: 24px;
  box-shadow: ${({ theme }) => theme.shadows.small};
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Placeholder = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
`;

const ActivityChart: React.FC = () => {
  return (
    <ChartContainer>
      <Placeholder>
        <h3>Activity Timeline</h3>
        <p>Chart visualization will be displayed here</p>
      </Placeholder>
    </ChartContainer>
  );
};

export default ActivityChart;