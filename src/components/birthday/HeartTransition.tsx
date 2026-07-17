'use client';

import { useEffect, useState, useRef } from 'react';

interface HeartTransitionProps {
  children: React.ReactNode;
}

export default function HeartTransition({ children }: HeartTransitionProps) {
  const [loading, setLoading] = useState(true);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const minTime = new Promise(res => setTimeout(res, 100));
      Promise.all([minTime]).then(() => setLoading(false));
      return;
    }

    setLoading(true);
    const minTime = new Promise(res => setTimeout(res, 7000));
    const loadDone = new Promise(res => window.requestIdleCallback(res, { timeout: 2000 }));

    Promise.all([minTime, loadDone]).then(() => setLoading(false));
  }, []);

  return (
    <>
      {loading && (
        <div className="route-loader">
          <main className='bg-[#8b0000] HeartTransisitonOpen'>
            <svg
              className="heart-loader"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 90 90"
              version="1.1"
            >
              <g className="heart-loader__group">
                <path
                  className="heart-loader__square"
                  strokeWidth="1"
                  fill="none"
                  d="M0,30 0,90 60,90 60,30z"
                />
                <path
                  className="heart-loader__circle m--left"
                  strokeWidth="1"
                  fill="none"
                  d="M60,60 a30,30 0 0,1 -60,0 a30,30 0 0,1 60,0"
                />
                <path
                  className="heart-loader__circle m--right"
                  strokeWidth="1"
                  fill="none"
                  d="M60,60 a30,30 0 0,1 -60,0 a30,30 0 0,1 60,0"
                />
                <path
                  className="heart-loader__heartPath"
                  strokeWidth="2"
                  d="M60,30 a30,30 0 0,1 0,60 L0,90 0,30 a30,30 0 0,1 60,0"
                />
              </g>
            </svg>
          </main>
        </div>
      )}

      <div style={{ opacity: loading ? 0.3 : 1, transition: "opacity 0.3s ease" }}>
        {children}
      </div>
    </>
  );
}
