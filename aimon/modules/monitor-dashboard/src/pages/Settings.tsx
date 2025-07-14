import React from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { updateSettings, saveSettings } from '@/store/slices/settingsSlice';

const Container = styled.div`
  padding: 24px;
  max-width: 800px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
`;

const Input = styled.input`
  padding: 8px 12px;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 4px;
  font-weight: 500;
  align-self: flex-start;
  
  &:hover {
    opacity: 0.9;
  }
`;

const Settings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector((state: RootState) => state.settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(saveSettings(settings));
  };

  const handleChange = (field: string, value: any) => {
    dispatch(updateSettings({ [field]: value }));
  };

  return (
    <Container>
      <h1>Settings</h1>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="apiUrl">API URL</Label>
          <Input
            id="apiUrl"
            type="text"
            value={settings.apiUrl}
            onChange={(e) => handleChange('apiUrl', e.target.value)}
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={settings.apiKey}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            placeholder="Enter your API key"
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="refreshInterval">Refresh Interval (ms)</Label>
          <Input
            id="refreshInterval"
            type="number"
            value={settings.refreshInterval}
            onChange={(e) => handleChange('refreshInterval', parseInt(e.target.value))}
          />
        </FormGroup>
        
        <Button type="submit">Save Settings</Button>
      </Form>
    </Container>
  );
};

export default Settings;