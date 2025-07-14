import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 24px;
`;

const Sessions: React.FC = () => {
  return (
    <Container>
      <h1>Sessions</h1>
      <p>Session history and details will be displayed here</p>
    </Container>
  );
};

export default Sessions;