import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 24px;
`;

const Applications: React.FC = () => {
  return (
    <Container>
      <h1>Applications</h1>
      <p>Application usage statistics will be shown here</p>
    </Container>
  );
};

export default Applications;