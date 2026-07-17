'use client';

import { useEffect, useRef, useState } from 'react';

interface Letter {
  id: number;
  name: string;
  msg: string;
}

export default function LoveLetter() {
  const lettersData: Letter[] = [
    { id: 1, name: "Rexon", msg: "Wish you the happiest birthday" },
    { id: 2, name: "Rexon", msg: "One picture from you can change my whole day, my whole mood, my whole heartbeat." },
    { id: 3, name: "Rexon", msg: "Even through screens and pixels, your laugh reaches me like sunlight through a window—warm, real, and impossible to forget." },
    { id: 4, name: "Rexon", msg: "Every notification from you feels like a heartbeat whispering, I'm here, and I love you." },
    { id: 5, name: "Rexon", msg: "Our messages might travel through wires, but every word you send lands straight in my heart." },
    { id: 6, name: "Rexon", msg: "Ever since our we met, my heart knew where it wanted to stay— with you, in every soft moment, every smile, every quiet piece of forever." },
    { id: 7, name: "Rexon", msg: " but you turned it into a memory my heart refuses to forget. Since then, every moment with you has felt softer, brighter, and filled with a kind of peace only you bring." },
    { id: 8, name: "Rexon", msg: "Since our first conversation, you've been the quiet spark that changed my world, turning ordinary days into moments that feel beautifully meant to be." },
  ];

  const [openEnvelope, setOpenEnvelope] = useState(false);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [zIndexCounter] = useState(10);
  const lettersContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLetters(lettersData);
  }, []);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const isTouch = e.type === "touchstart";
    const startEvent = isTouch ? (e as React.TouchEvent).touches[0] : e as React.MouseEvent;

    if ((startEvent.target as HTMLElement).tagName === "BUTTON") return;

    const letterEl = (e.currentTarget as HTMLElement);
    const rect = letterEl.getBoundingClientRect();

    const offsetX = startEvent.clientX - rect.left;
    const offsetY = startEvent.clientY - rect.top;

    const startLeft = rect.left + window.scrollX;
    const startTop = rect.top + window.scrollY;

    letterEl.style.transform = "none";
    letterEl.classList.remove("-translate-x-1/2");
    letterEl.classList.remove("-translate-y-1/2");

    letterEl.style.position = "absolute";
    letterEl.style.left = `${startLeft}px`;
    letterEl.style.top = `${startTop}px`;
    letterEl.style.margin = "0";
    letterEl.style.zIndex = zIndexCounter.toString();

    const moveAt = (posX: number, posY: number) => {
      letterEl.style.left = `${posX - offsetX}px`;
      letterEl.style.top = `${posY - offsetY}px`;
    };

    const onMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const ev = isTouch ? (moveEvent as TouchEvent).touches[0] : moveEvent as MouseEvent;
      moveAt(ev.clientX, ev.clientY);
    };

    const onMouseUp = () => {
      if (isTouch) {
        document.removeEventListener("touchmove", onMouseMove as EventListener);
        document.removeEventListener("touchend", onMouseUp);
      } else {
        document.removeEventListener("mousemove", onMouseMove as EventListener);
        document.removeEventListener("mouseup", onMouseUp);
      }
    };

    if (isTouch) {
      document.addEventListener("touchmove", onMouseMove as EventListener);
      document.addEventListener("touchend", onMouseUp);
    } else {
      document.addEventListener("mousemove", onMouseMove as EventListener);
      document.addEventListener("mouseup", onMouseUp);
    }
  };

  const handleCloseLetter = (id: number) => {
    setLetters((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <main className='munna bg-[#8b0000] h-screen w-full overflow-hidden'>
      <section className="munna cssletter z-10">
        <div className={`envelope ${openEnvelope ? "active" : ""}`}>
          <button
            className="munna heart"
            id="openEnvelope"
            aria-label="Open Envelope"
            onClick={() => setOpenEnvelope(true)}
          >
            <span className="munna heart-text">Open</span>
          </button>
          <div className="munna envelope-flap text-black relative">
            <div className='munna absolute left-1/2 top-[20%] -translate-x-1/2 flex items-center justify-center flex-col md:gap-y-2'>
              <span className='munna font-sriracha md:text-2xl text-lg'>Envelope Of Love</span>
              <span className='munna font-dancingScript md:text-3xl text-xl'>Dear Trisha</span>
            </div>
          </div>
          <div className="munna envelope-folds">
            <div className="munna envelope-left"></div>
            <div className="munna envelope-right"></div>
            <div className="munna envelope-bottom"></div>
          </div>
        </div>

        <div className="munna letters" ref={lettersContainerRef}>
          {letters.map((letter) => (
            <blockquote
              key={letter.id}
              className="munna letter center -translate-x-1/2 -translate-y-1/2"
              id={letter.id.toString()}
              tabIndex={0}
              style={{
                position: 'absolute',
                top: typeof window !== 'undefined' && window.innerWidth < 768 ? '53%' : '50%',
                left: typeof window !== 'undefined' && window.innerWidth < 768 ? '50%' : '50%',
                transform: 'none',
              }}
            onMouseDown={(e) => handleMouseDown(e)}
            onTouchStart={handleMouseDown}
            >
              <button
                className="munna closeLetter"
                title={`Close ${letter.name}'s letter`}
                onClick={() => handleCloseLetter(letter.id)}
              >
                Close {letter.name}&apos;s letter
              </button>
              <p>{letter.msg}</p>
              <cite>{letter.name}</cite>
            </blockquote>
          ))}
        </div>
      </section>

      {/* Heart Beating */}
      <div className="munna heart-container absolute top-[20%] md:left-20 left-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          className="munna heartBeating md:w-[150px] w-[110px] h-[200px]"
        >
          <path
            d="M471.7 73.6c-54.5-46.4-136-38.3-186.4 15.8L256 120.6l-29.3-31.2C176.3 35.3 94.8 27.2 40.3 73.6-18 125.4-13.3 221 43 273.7l187.3 177.6a24 24 0 0032.4 0L469 273.7c56.3-52.8 61-148.3 2.7-200.1z"
            fill="#b10505"
          />
        </svg>
      </div>

      <div className="munna heart-container absolute bottom-[10%] md:right-20 right-6 rotate-180">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          className="munna heartBeating md:w-[150px] w-[110px] h-[200px]"
        >
          <path
            d="M471.7 73.6c-54.5-46.4-136-38.3-186.4 15.8L256 120.6l-29.3-31.2C176.3 35.3 94.8 27.2 40.3 73.6-18 125.4-13.3 221 43 273.7l187.3 177.6a24 24 0 0032.4 0L469 273.7c56.3-52.8 61-148.3 2.7-200.1z"
            fill="#b10505"
          />
        </svg>
      </div>

      {/* Heart Falling */}
      <div className="munna snowflakes z-0">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="munna snowflake">
            <img src="https://i.pinimg.com/originals/96/c7/8b/96c78bc8ab873498b763798793d64f62.png" width="25" alt="" />
          </div>
        ))}
      </div>
    </main>
  );
}
