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
      <h1 className="title">🎯🤖 AI Object Detection Stream</h1>
      <p className="subtitle">
        Stream your phone&apos;s camera with real-time AI object detection and analysis
      </p>

      {!sessionId ? (
        <div>
          <div className="instruction">
            <h3>How AI Detection Works:</h3>
            <ol>
              <li>Click &quot;Start AI Detection Session&quot; to create a streaming session</li>
              <li>A QR code will appear - scan it with your phone</li>
              <li>Grant camera access on your phone</li>
              <li>Enable object detection to see AI-powered analysis</li>
              <li>Watch real-time object detection with bounding boxes and labels</li>
              <li>Monitor detection performance and accuracy metrics</li>
            </ol>
          </div>
          
          <button 
            className="button" 
            onClick={createSession}
            disabled={isCreating}
          >
            {isCreating ? 'Initializing AI...' : 'Start AI Detection Session'}
          </button>
        </div>
      ) : (
        <div>
          <div className="status waiting">
            ✅ AI Detection Session created! Use the viewer link below:
          </div>
          
          <Link href={`/viewer/${sessionId}`}>
            <button className="button">
              Open AI Detection Viewer
            </button>
          </Link>
          
          <button 
            className="button" 
            onClick={() => setSessionId('')}
            style={{ background: '#6c757d' }}
          >
            Create New AI Session
          </button>
        </div>
      )}
    </div>
  );
}
