'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import OpeningAnimation from '@/components/birthday/OpeningAnimation';
import BookCanvas from '@/components/birthday/BookCanvas';
import SmallLetter from '@/components/birthday/SmallLetter';
import '@/app/birthday/birthday.css';
import { assetPath } from '@/lib/path';

export default function BirthdayPage() {
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const [showBook, setShowBook] = useState(true);

  useEffect(() => {
    const handlePageLoad = () => {
      setTimeout(() => setAnimateOut(true), 8400);
      setTimeout(() => setLoading(false), 9000);
      setTimeout(() => setShowContent(true), 8600);
    };

    if (document.readyState === "complete") {
      handlePageLoad();
    } else {
      window.addEventListener("load", handlePageLoad);
    }

    return () => window.removeEventListener("load", handlePageLoad);
  }, []);

  useEffect(() => {
    if (!showContent) return;

    const datetxt = "15 June";
    const charArrDate = datetxt.split('');
    let currentIndex = 0;
    let date__of__birth: HTMLElement | null = null;
    let typedText = "";

    const initTyping = () => {
      date__of__birth = document.querySelector(".date__of__birth span");
      if (!date__of__birth) return;

      setTimeout(function () {
        const timeDatetxt = setInterval(function () {
          if (currentIndex < charArrDate.length) {
            typedText += charArrDate[currentIndex];
            if (date__of__birth) date__of__birth.textContent = typedText;
            currentIndex++;
          } else {
            clearInterval(timeDatetxt);
            if (date__of__birth && !date__of__birth.classList.contains("svg-added")) {
              const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
              svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
              svg.setAttribute("width", "24");
              svg.setAttribute("height", "24");
              svg.setAttribute("viewBox", "0 0 24 24");
              svg.innerHTML = `<path fill="#a31414" d="M18.483 16.767A8.5 8.5 0 0 1 8.118 7.081a1 1 0 0 1-.113.097c-.28.213-.63.292-1.33.45l-.635.144c-2.46.557-3.69.835-3.983 1.776c-.292.94.546 1.921 2.223 3.882l.434.507c.476.557.715.836.822 1.18c.107.345.071.717-.001 1.46l-.066.677c-.253 2.617-.38 3.925.386 4.506s1.918.052 4.22-1.009l.597-.274c.654-.302.981-.452 1.328-.452s.674.15 1.329.452l.595.274c2.303 1.06 3.455 1.59 4.22 1.01c.767-.582.64-1.89.387-4.507z"/> <path fill="#a31414" d="m9.153 5.408l-.328.588c-.36.646-.54.969-.82 1.182q.06-.045.113-.097a8.5 8.5 0 0 0 10.366 9.686l-.02-.19c-.071-.743-.107-1.115 0-1.46c.107-.344.345-.623.822-1.18l.434-.507c1.677-1.96 2.515-2.941 2.222-3.882c-.292-.941-1.522-1.22-3.982-1.776l-.636-.144c-.699-.158-1.049-.237-1.33-.45c-.28-.213-.46-.536-.82-1.182l-.327-.588C13.58 3.136 12.947 2 12 2s-1.58 1.136-2.847 3.408" opacity="0.5"/>`;
              const container = document.querySelector(".date__of__birth");
              if (container) {
                container.prepend(svg);
                container.appendChild(svg.cloneNode(true));
                date__of__birth.classList.add("svg-added");
              }
            }
          }
        }, 100);
      }, 12000);
    };

    const timer = setTimeout(initTyping, 1000);
    return () => clearTimeout(timer);
  }, [showContent]);

  return (
    <>
      {loading && <OpeningAnimation animateOut={animateOut} />}
      
      {showContent && (
        <div id="wrapper">
          <div className="flag__birthday">
            <Image src={assetPath("/assets/birthday/1.png")} alt="" width={350} height={200} className="flag__left" />
            <Image src={assetPath("/assets/birthday/1.png")} alt="" width={350} height={200} className="flag__right" />
          </div>

          <div className="content">
            <div className="left">
              <div className="title">
                <h1 className="happy">
                  <span style={{ "--t": "4s" } as React.CSSProperties}>H</span>
                  <span style={{ "--t": "4.2s" } as React.CSSProperties}>a</span>
                  <span style={{ "--t": "4.4s" } as React.CSSProperties}>p</span>
                  <span style={{ "--t": "4.6s" } as React.CSSProperties}>p</span>
                  <span style={{ "--t": "4.8s" } as React.CSSProperties}>y</span>
                </h1>
                <h1 className="birthday">
                  <span style={{ "--t": "5s" } as React.CSSProperties}>B</span>
                  <span style={{ "--t": "5.2s" } as React.CSSProperties}>i</span>
                  <span style={{ "--t": "5.4s" } as React.CSSProperties}>r</span>
                  <span style={{ "--t": "5.6s" } as React.CSSProperties}>t</span>
                  <span style={{ "--t": "5.8s" } as React.CSSProperties}>h</span>
                  <span style={{ "--t": "6s" } as React.CSSProperties}>d</span>
                  <span style={{ "--t": "6.2s" } as React.CSSProperties}>a</span>
                  <span style={{ "--t": "6.4s" } as React.CSSProperties}>y</span>
                </h1>
                <div className="hat">
                  <Image src={assetPath("/assets/birthday/hat.png")} alt="" width={130} height={130} />
                </div>
              </div>

              <div className="date__of__birth">
                <span></span>
              </div>

              <div className="btn flex md:gap-2 md:flex-row flex-col">
                <button onClick={() => setShowBook(!showBook)} id="btn__letter">
                  <div className="mail flex items-center justify-center gap-2 md:text-[1rem] text-sm">
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
                      <path fill="#d13852" d="M63.841 18.646c-.246-3.85-1.072-6.977-3.752-10.198c-5.369-6.439-17.71-7.511-23.23-1.312c-.963.912-1.872 2.01-2.785 3.322l-2.066 2.969l-2.067-2.969c-.916-1.312-1.827-2.411-2.79-3.322C21.627.937 9.287 2.008 3.921 8.448C1.237 11.669.412 14.796.166 18.646C-.184 30.092 8.122 39.257 9.147 40.6c5.637 6.613 11.786 12.866 18.03 18.627 1.13.989 2.106 1.812 3.082 2.628.587.479 1.166.964 1.749 1.44.582-.477 1.159-.961 1.743-1.44.98-.816 1.956-1.639 3.082-2.628 6.247-5.761 12.397-12.01 18.04-18.627 1.025-1.343 9.332-10.508 8.979-21.954" />
                      <path fill="#f1a5b1" d="M60.39 16.604a10.1 10.1 0 0 0-.457-2.909 9 9 0 0 0-1.169-2.42c-2.973-4.369-9.451-5.943-14.863-4.837c-2.111.508-4.225 1.302-5.197 3.318c-.331.865.365 1.281 1.44 1.228 3.894-.435 8.202-.043 11.645 1.63.858.42 1.661.918 2.395 1.503 2.47 1.913 3.537 4.887 4.02 7.837 1.201-.242 1.854-1.683 2.01-2.965a10.5 10.5 0 0 0 .177-2.385" />
                    </svg>
                    打开信件
                  </div>
                </button>
                <div id="FromRexon">
                  <button onClick={() => window.location.href = assetPath("/beads2.html")} className="flex items-center gap-2 md:text-[1rem] text-sm">
                    <svg className='w-7 h-7' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72">
                      <path fill="#fff" d="M65.086 55.5H6.878A2.877 2.877 0 0 1 4 52.623V17.248A2.25 2.25 0 0 1 6.248 15h59.446A2.306 2.306 0 0 1 68 17.306v35.28a2.914 2.914 0 0 1-2.914 2.914" />
                      <path fill="#ea5a47" d="M47.064 33.552A5.885 5.885 0 0 0 36 30.755a5.885 5.885 0 0 0-11.064 2.797c0 1.398.49 2.68 1.304 3.69l-.002.002L36 49.342l9.762-12.098l-.003-.002a5.86 5.86 0 0 0 1.305-3.69" />
                    </svg>
                    互动小游戏
                  </button>
                </div>
              </div>
            </div>

            <div className="right">
              <div className="box__account">
                <div className="image">
                  <Image src={assetPath("/assets/birthday/profile2.jpg")} alt="" width={400} height={400} />
                </div>
                <div className="name">
                  <i className="fa-solid fa-heart"></i>
                  <span>文静宝宝</span>
                  <i className="fa-solid fa-heart"></i>
                </div>
                <div className="balloon_one">
                  <Image width={100} height={150} src={assetPath("/assets/birthday/balloon1.png")} alt="" />
                </div>
                <div className="balloon_two">
                  <Image width={100} height={150} src={assetPath("/assets/birthday/balloon2.png")} alt="" />
                </div>
              </div>

              <div className="cricle">
                <div className="text__cricle">
                  {["h", "a", "p", "p", "y", "-", "b", "i", "r", "t", "h", "d", "a", "y", "-"].map(
                    (char, i) => (
                      <span key={i} style={{ "--i": i + 1 } as React.CSSProperties}>
                        {char}
                      </span>
                    )
                  )}
                </div>
                <i className="fa-solid fa-heart"></i>
              </div>
            </div>
          </div>

          {[1, 2, 3, 4, 5].map((n, i) => (
            <div key={i} className={`decorate_star star${n}`} style={{ "--t": `${15 + i * 0.2}s` } as React.CSSProperties}></div>
          ))}

          <div className="decorate_flower--one" style={{ "--t": "15s" } as React.CSSProperties}>
            <Image width={20} height={20} src={assetPath("/assets/birthday/decorate_flower.png")} alt="" />
          </div>
          <div className="decorate_flower--two" style={{ "--t": "15.3s" } as React.CSSProperties}>
            <Image width={20} height={20} src={assetPath("/assets/birthday/decorate_flower.png")} alt="" />
          </div>
          <div className="decorate_flower--three" style={{ "--t": "15.6s" } as React.CSSProperties}>
            <Image width={20} height={20} src={assetPath("/assets/birthday/decorate_flower.png")} alt="" />
          </div>

          <div className="decorate_bottom">
            <Image src={assetPath("/assets/birthday/decorate.png")} alt="" width={100} height={100} />
          </div>

          <div className="smiley__icon">
            <Image src={assetPath("/assets/birthday/smiley_icon.png")} alt="" width={100} height={100} />
          </div>

          <BookCanvas active={showBook} setActive={setShowBook} />

          <section className="smallLetter absolute md:-bottom-26 -bottom-40 md:left-[45%] left-[50%] -translate-x-1/2" style={{ "--t": "15.6s" } as React.CSSProperties}>
            <SmallLetter />
          </section>
        </div>
      )}
    </>
  );
}
