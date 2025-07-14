import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: 8px;
  padding: 24px;
  box-shadow: ${({ theme }) => theme.shadows.small};
`;

const EventList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
`;

const EventItem = styled.div`
  padding: 12px;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RecentEvents: React.FC = () => {
  return (
    <Container>
      <h3>Recent Events</h3>
      <EventList>
        <EventItem>
          <span>Sample event data will be displayed here</span>
          <span>Just now</span>
        </EventItem>
      </EventList>
    </Container>
  );
};

export default RecentEvents;