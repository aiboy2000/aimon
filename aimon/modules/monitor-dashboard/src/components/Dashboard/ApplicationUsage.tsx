import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
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

const ApplicationUsage: React.FC = () => {
  return (
    <Container>
      <Placeholder>
        <h3>Application Usage</h3>
        <p>Pie chart will be displayed here</p>
      </Placeholder>
    </Container>
  );
};

export default ApplicationUsage;