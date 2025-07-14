import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { AppDispatch, RootState } from '@/store';
import { fetchDashboardStats } from '@/store/slices/dashboardSlice';
import { fetchEvents } from '@/store/slices/activitySlice';

// Components
import StatsCard from '@/components/Dashboard/StatsCard';
import ActivityChart from '@/components/Dashboard/ActivityChart';
import RecentEvents from '@/components/Dashboard/RecentEvents';
import ApplicationUsage from '@/components/Dashboard/ApplicationUsage';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { stats, loading } = useSelector((state: RootState) => state.dashboard);
  const { refreshInterval } = useSelector((state: RootState) => state.settings);

  useEffect(() => {
    // Initial fetch
    dispatch(fetchDashboardStats());
    dispatch(fetchEvents());

    // Set up refresh interval
    const interval = setInterval(() => {
      dispatch(fetchDashboardStats());
      dispatch(fetchEvents());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [dispatch, refreshInterval]);

  return (
    <DashboardContainer>
      <h1>Dashboard</h1>
      
      <StatsGrid>
        <StatsCard
          title="Total Events"
          value={stats.totalEvents}
          icon="events"
          color="#3498db"
          loading={loading}
        />
        <StatsCard
          title="Active Time"
          value={`${Math.floor(stats.activeTime / 3600)}h ${Math.floor((stats.activeTime % 3600) / 60)}m`}
          icon="time"
          color="#2ecc71"
          loading={loading}
        />
        <StatsCard
          title="Keystrokes"
          value={stats.keystrokes}
          icon="keyboard"
          color="#e74c3c"
          loading={loading}
        />
        <StatsCard
          title="Mouse Clicks"
          value={stats.mouseClicks}
          icon="mouse"
          color="#f39c12"
          loading={loading}
        />
        <StatsCard
          title="Applications"
          value={stats.applications}
          icon="apps"
          color="#9b59b6"
          loading={loading}
        />
        <StatsCard
          title="Productivity"
          value={`${Math.round(stats.productivityScore * 100)}%`}
          icon="productivity"
          color="#1abc9c"
          loading={loading}
        />
      </StatsGrid>

      <ChartsGrid>
        <ActivityChart />
        <ApplicationUsage />
      </ChartsGrid>

      <RecentEvents />
    </DashboardContainer>
  );
};

export default Dashboard;