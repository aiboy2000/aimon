# Monitor Dashboard Module

Real-time monitoring dashboard built with React and Electron for the AI Activity Monitor ecosystem.

## Features

- **Real-time Visualization**: Live updates of activity data
- **Multi-page Dashboard**: Comprehensive views for events, sessions, applications, and analytics
- **Electron Desktop App**: Native desktop application with system tray support
- **Responsive Design**: Works on various screen sizes
- **Dark/Light Theme**: Toggle between themes
- **Redux State Management**: Centralized state with Redux Toolkit
- **TypeScript**: Full type safety
- **Styled Components**: Modern CSS-in-JS styling

## Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **Desktop**: Electron 27
- **State Management**: Redux Toolkit
- **Styling**: Styled Components
- **Charts**: Chart.js and Recharts
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client

### Project Structure
```
monitor-dashboard/
├── public/                 # Static assets
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.js       # Main entry point
│   │   └── preload.js     # Preload script
│   ├── components/        # React components
│   │   ├── Layout/        # Layout components
│   │   └── Dashboard/     # Dashboard components
│   ├── pages/             # Page components
│   ├── store/             # Redux store
│   │   ├── slices/        # Redux slices
│   │   └── index.ts       # Store configuration
│   ├── services/          # API services
│   ├── styles/            # Global styles and theme
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Main App component
│   └── index.tsx          # React entry point
├── package.json
└── tsconfig.json
```

## Pages

### Dashboard
- Real-time statistics cards
- Activity timeline chart
- Application usage breakdown
- Recent events list

### Events
- Searchable event list
- Advanced filtering options
- Event details view
- Export functionality

### Sessions
- Session history
- Session timeline
- Activity breakdown per session
- Session comparison

### Applications
- Application usage statistics
- Time spent per application
- Application categories
- Productivity analysis

### Analytics
- Advanced data visualization
- Custom date ranges
- Trend analysis
- Productivity insights

### Settings
- API configuration
- Theme preferences
- Notification settings
- Data refresh intervals

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Python (for node-gyp dependencies)

### Development Setup
```bash
cd modules/monitor-dashboard

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run Electron app only
npm start

# Run React dev server only
npm run dev:react
```

### Production Build
```bash
# Build React app
npm run build:react

# Build Electron distributables
npm run build:electron

# Build everything
npm run build
```

## Configuration

The dashboard connects to the activity-db API. Configure the connection in Settings:

- **API URL**: Default `http://localhost:8080`
- **API Key**: Your activity-db API key
- **Refresh Interval**: How often to fetch new data (default 5000ms)

## State Management

### Redux Store Structure
```typescript
{
  activity: {
    events: InputEvent[],
    totalEvents: number,
    loading: boolean,
    filters: {...},
    pagination: {...}
  },
  sessions: {
    sessions: Session[],
    loading: boolean
  },
  applications: {
    applications: Application[],
    loading: boolean
  },
  settings: {
    apiUrl: string,
    apiKey: string,
    refreshInterval: number,
    theme: 'light' | 'dark',
    notifications: boolean
  },
  dashboard: {
    stats: DashboardStats,
    loading: boolean,
    lastUpdated: string
  }
}
```

## API Integration

The dashboard communicates with activity-db through REST APIs:

```typescript
// Fetch events
GET /api/v1/events/

// Fetch statistics
GET /api/v1/events/statistics/

// Fetch sessions
GET /api/v1/sessions/

// Fetch applications
GET /api/v1/applications/
```

## Electron Features

### System Tray
- Minimize to tray
- Quick access menu
- Show/hide dashboard

### IPC Communication
- Settings management
- Window controls
- Navigation handling

### Auto-updater
- Automatic update checks
- User notifications
- Seamless updates

## Styling

### Theme System
```typescript
const theme = {
  colors: {
    primary: '#3498db',
    secondary: '#2ecc71',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#2c3e50',
    ...
  },
  shadows: {...},
  transitions: {...}
}
```

### Styled Components
```typescript
const StatsCard = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: 8px;
  padding: 20px;
  box-shadow: ${({ theme }) => theme.shadows.small};
`;
```

## Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Performance Optimization

- **React.memo**: Prevent unnecessary re-renders
- **Redux Selectors**: Memoized selectors with reselect
- **Code Splitting**: Lazy loading for routes
- **Virtual Scrolling**: For large lists
- **Debounced Updates**: Prevent excessive API calls

## Security

- **Context Isolation**: Enabled in Electron
- **No Node Integration**: In renderer process
- **Preload Scripts**: Safe IPC communication
- **CSP Headers**: Content Security Policy
- **API Key Storage**: Secure storage with electron-store

## Troubleshooting

### Common Issues

1. **Blank white screen**
   - Check if API is running
   - Verify API URL in settings
   - Check console for errors

2. **Cannot connect to API**
   - Verify API is running on correct port
   - Check API key configuration
   - Ensure CORS is configured

3. **Build failures**
   - Clear node_modules and reinstall
   - Check Node.js version
   - Run `npm run clean`

4. **Electron crashes**
   - Check system requirements
   - Update graphics drivers
   - Disable hardware acceleration

## Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Advanced data filtering
- [ ] Custom dashboard layouts
- [ ] Export reports (PDF/CSV)
- [ ] Multi-language support
- [ ] Plugin system
- [ ] Cloud sync
- [ ] Mobile companion app

## Contributing

1. Follow React and TypeScript best practices
2. Write tests for new features
3. Update documentation
4. Use conventional commit messages
5. Ensure linting passes