'use client';

import { useState, useRef } from 'react';

export default function SmallLetter() {
  const [isOpen, setIsOpen] = useState(false);
  const letterRef = useRef<HTMLDivElement>(null);

  const handleToggleLetter = () => {
    const letterElement = letterRef.current;
    if (!letterElement) return;

    if (isOpen) {
      letterElement.classList.add('small-rajib-letter--close');
      setIsOpen(false);
      setTimeout(() => {
        letterElement.classList.remove('small-rajib-letter--close');
      }, 600);
    } else {
      letterElement.classList.remove('small-rajib-letter--close');
      setIsOpen(true);
    }
  };

  const handleCloseLetter = () => {
    const letterElement = letterRef.current;
    if (!letterElement) return;

    letterElement.classList.remove('small-rajib-letter--open');
    letterElement.classList.add('small-rajib-letter--close');
    setIsOpen(false);
    setTimeout(() => {
      letterElement.classList.remove('small-rajib-letter--close');
    }, 600);
  };

  const letterStateClass = isOpen ? 'small-rajib-letter--open' : '';

  return (
    <>
      <div
        className={`small-rajib-letter ${letterStateClass}`}
        ref={letterRef}
      >
        <div
          className="small-rajib-envelope"
          onClick={handleToggleLetter}
        >
          <div className="small-rajib-envelope-flap"></div>
          <div className="small-rajib-envelope-paper"></div>
          <div className="small-rajib-envelope-detail"></div>
        </div>

        <div className="small-rajib-paper">
          <div className="small-rajib-paper-content">
            <div
              className="small-rajib-paper-close"
              onClick={handleCloseLetter}
            >
              x
            </div>
            <p>
              Yo brocaccho,<br /><br />
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud <br /><br />
              Rajib
            </p>
          </div>

          <svg className="rajib-diary-deco" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="5" y1="0" x2="5" y2="100" stroke="#E0DDB7" strokeWidth="1" className="diary-line left-line" />
            <line x1="95" y1="0" x2="95" y2="100" stroke="#E0DDB7" strokeWidth="1" className="diary-line right-line" />
            <line x1="0" y1="5" x2="100" y2="5" stroke="#E0DDB7" strokeWidth="0.5" className="diary-line top-line" />
            <line x1="0" y1="95" x2="100" y2="95" stroke="#E0DDB7" strokeWidth="0.5" className="diary-line bottom-line" />
            <circle cx="5" cy="10" r="0.5" fill="#E0DDB7" className="diary-dot dot-1" />
            <circle cx="5" cy="20" r="0.5" fill="#E0DDB7" className="diary-dot dot-2" />
            <circle cx="5" cy="30" r="0.5" fill="#E0DDB7" className="diary-dot dot-3" />
            <circle cx="5" cy="40" r="0.5" fill="#E0DDB7" className="diary-dot dot-4" />
            <circle cx="5" cy="50" r="0.5" fill="#E0DDB7" className="diary-dot dot-5" />
            <circle cx="5" cy="60" r="0.5" fill="#E0DDB7" className="diary-dot dot-6" />
            <circle cx="5" cy="70" r="0.5" fill="#E0DDB7" className="diary-dot dot-7" />
            <circle cx="5" cy="80" r="0.5" fill="#E0DDB7" className="diary-dot dot-8" />
            <circle cx="5" cy="90" r="0.5" fill="#E0DDB7" className="diary-dot dot-9" />
          </svg>
        </div>
      </div>
    </>
  );
}
