'use client';

import React, { useRef, useEffect } from 'react';
import { Product } from '@/shared/types';

interface HeroProps {
  products?: Product[];
  videoSrc?: string;
  ctaText?: string;
  ctaLink?: string;
}

const DEFAULT_HERO_VIDEO = '/ZYRO_Wear_Studio_Imgs/hero-showcase.mp4';

export default function Hero({
  videoSrc = DEFAULT_HERO_VIDEO,
  ctaText = 'EXPLORE COLLECTION',
  ctaLink = '#shop',
}: HeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.defaultMuted = true;
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Autoplay prevented by browser:', error);
        });
      }
    }
  }, [videoSrc]);

  return (
    <section className="cinematic-hero-section" id="home">
      {/* Background ambient lighting/glow */}
      <div className="hero-ambient-glow" aria-hidden="true" />

      {/* 1. Large Full-Width Cinematic Video Hero with seamless edge blending */}
      <div className="cinematic-video-container">
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="cinematic-hero-video"
        />
        {/* Soft edge blend overlays so video melts seamlessly into the page */}
        <div className="cinematic-video-fade-top" aria-hidden="true" />
        <div className="cinematic-video-fade-bottom" aria-hidden="true" />
      </div>

      {/* 2. Clean Integrated CTA Section */}
      <div className="hero-cta-section">
        <a href={ctaLink} className="btn-gold hero-cta-btn">
          {ctaText} <i className="fa-solid fa-arrow-right"></i>
        </a>
      </div>
    </section>
  );
}



