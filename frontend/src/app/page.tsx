'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [sessionId, setSessionId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const createSession = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const data = await response.json();
      setSessionId(data.sessionId);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="card">
      <h1 className="title">📱📺 Camera Stream</h1>
      <p className="subtitle">
        Stream your phone&apos;s camera to your laptop in real-time
      </p>

      {!sessionId ? (
        <div>
          <div className="instruction">
            <h3>How it works:</h3>
            <ol>
              <li>Click &quot;Start New Session&quot; to create a streaming session</li>
              <li>A QR code will appear - scan it with your phone</li>
              <li>Grant camera access on your phone</li>
              <li>Your phone&apos;s camera will stream to this browser</li>
            </ol>
          </div>
          
          <button 
            className="button" 
            onClick={createSession}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Start New Session'}
          </button>
        </div>
      ) : (
        <div>
          <div className="status waiting">
            ✅ Session created! Use the viewer link below:
          </div>
          
          <Link href={`/viewer/${sessionId}`}>
            <button className="button">
              Open Viewer Page
            </button>
          </Link>
          
          <button 
            className="button" 
            onClick={() => setSessionId('')}
            style={{ background: '#6c757d' }}
          >
            Create New Session
          </button>
        </div>
      )}
    </div>
  );
}
