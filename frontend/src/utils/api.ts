// API utility functions
const API_BASE_URL = process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || 'http://localhost:3001';

export const api = {
  // Create a new streaming session
  createSession: async (): Promise<{ sessionId: string }> => {
    const response = await fetch(`${API_BASE_URL}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to create session');
    }
    
    return response.json();
  },

  // Get session information
  getSession: async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/session/${sessionId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Session not found');
      }
      throw new Error('Failed to get session');
    }
    
    return response.json();
  },

  // Health check
  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  }
};
