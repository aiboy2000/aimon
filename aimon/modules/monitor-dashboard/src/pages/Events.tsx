import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 24px;
`;

const Events: React.FC = () => {
  return (
    <Container>
      <h1>Events</h1>
      <p>Event list and filtering will be implemented here</p>
    </Container>
  );
};

export default Events;