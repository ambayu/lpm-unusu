import React, { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { assetUrl } from "../lib/assets";
import { fetchPublicSliders, LpmBannerSliderItem } from "../services/api";

export interface HeroSlideItem {
  id: number;
  image: string;
  imageMobile: string;
  title: string;
  badge: string;
  headline: string;
  subheadline: string;
}

const defaultHeroSlides: HeroSlideItem[] = [
  {
    id: 1,
    image: assetUrl("/assets/hero/lpm-hero-1.png"),
    imageMobile: assetUrl("/assets/hero/lpm-hero-1.png"),
    title: "Auditor Mutu Internal UNUSU",
    badge: "Siklus PPEPP Nasional",
    headline: "Standar Penjaminan Mutu Internal",
    subheadline: "Mengawal mutu tata kelola tridharma perguruan tinggi menuju akreditasi institusi Unggul.",
  },
  {
    id: 2,
    image: assetUrl("/assets/hero/lpm-hero-2.png"),
    imageMobile: assetUrl("/assets/hero/lpm-hero-2.png"),
    title: "Evaluasi Kurikulum & Capaian Akademik",
    badge: "Outcome-Based Education",
    headline: "Capaian Pembelajaran Terstandarisasi",
    subheadline: "Penyelarasan kurikulum 14 Program Studi S1 berbasis KKNI level 6 dan nilai Aswaja An-Nahdliyah.",
  },
  {
    id: 3,
    image: assetUrl("/assets/hero/lpm-hero-3.png"),
    imageMobile: assetUrl("/assets/hero/lpm-hero-3.png"),
    title: "Kampus Terpadu UNUSU Medan",
    badge: "Audit AMI Real-Time",
    headline: "Audit Mutu Internal Berkelanjutan",
    subheadline: "Pencatatan kesenjangan mutu (KTS Mayor & Minor) dan rekomendasi tindak lanjut (RTL) terintegrasi.",
  },
  {
    id: 4,
    image: assetUrl("/assets/hero/lpm-hero-4.png"),
    imageMobile: assetUrl("/assets/hero/lpm-hero-4.png"),
    title: "Pusat Dokumentasi & Akreditasi",
    badge: "Bank Dokumen Legal",
    headline: "Arsip Kebijakan, Manual & SOP",
    subheadline: "Dokumentasi digital resmi pedoman mutu universitas terverifikasi SK Rektor.",
  },
];

export const FullHeroSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [slides, setSlides] = useState<HeroSlideItem[]>(defaultHeroSlides);
  const touchStartX = React.useRef<number | null>(null);
  const touchEndX = React.useRef<number | null>(null);

  useEffect(() => {
    fetchPublicSliders()
      .then((res) => {
        if (res.data.success && res.data.data.length > 0) {
          const mapped: HeroSlideItem[] = res.data.data.map((item) => ({
            id: item.id,
            image: item.gambarUrl,
            imageMobile: item.gambarMobileUrl || item.gambarUrl,
            title: item.judul,
            badge: "LPM UNUSU",
            headline: item.judul,
            subheadline: item.subjudul || "Sistem Penjaminan Mutu Internal Universitas Nahdlatul Ulama Sumatera Utara.",
          }));
          setSlides(mapped);
        }
      })
      .catch(() => {
        // Fallback memakai defaultHeroSlides bawaan
      });
  }, []);

  useEffect(() => {
    if (isPaused || slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const goTo = (index: number) => setCurrentSlide(index);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % slides.length);

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const distance = touchStartX.current - touchEndX.current;
      if (distance > 50) nextSlide();
      else if (distance < -50) prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
    setIsPaused(false);
  };

  const slide = slides[currentSlide] || slides[0] || defaultHeroSlides[0];
  const counter = `${String(currentSlide + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;

  return (
    <section
      aria-label="Hero Banner Slider"
      className="relative isolate w-full overflow-hidden bg-lpm-blue-950 text-white md:flex md:h-[calc(100vh-5rem)] md:min-h-[560px] md:flex-col md:justify-end select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 
        Mobile: Aspek 1:1 memakai aset khusus mobile agar visual utuh.
        Desktop: Full-bleed menutupi seluruh hero 16:9.
      */}
      <div className="relative aspect-square w-full overflow-hidden md:absolute md:inset-0 md:aspect-auto md:h-full">
        {slides.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <picture>
              <source media="(max-width: 767px)" srcSet={item.imageMobile} />
              <img
                src={item.image}
                alt={item.title}
                width={1280}
                height={720}
                className="h-full w-full object-cover object-center"
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            </picture>

            {/* Gradient Scrim Tipis agar teks terbaca kontras & elegan */}
            <div className="absolute inset-0 bg-gradient-to-t from-lpm-blue-950/90 via-lpm-blue-900/40 to-transparent md:from-lpm-blue-950/85 md:via-lpm-blue-900/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-lpm-blue-950/85 via-lpm-blue-900/35 to-transparent" />
          </div>
        ))}
      </div>

      {/* Konten di kiri-bawah, kontrol slider di kanan-bawah */}
      <div className="relative z-20 px-4 sm:px-6 lg:px-8 pb-8 md:pb-12 pt-20 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-lpm-yellow-400 text-slate-950 w-fit">
              <span>{slide.badge}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1] drop-shadow-md">
              {slide.headline}
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-lpm-blue-100 leading-relaxed max-w-xl font-normal">
              {slide.subheadline}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 shrink-0 lg:flex-col lg:items-end lg:gap-3">
            <div className="flex items-center gap-2">
              {slides.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(idx)}
                  aria-label={`Slide ${idx + 1}: ${item.title}`}
                  aria-current={idx === currentSlide}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentSlide ? "w-8 bg-lpm-yellow-400" : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Slide Sebelumnya"
                className="min-h-[44px] w-11 h-11 rounded-[8px] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/25 transition-colors cursor-pointer"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Slide Berikutnya"
                className="min-h-[44px] w-11 h-11 rounded-[8px] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/25 transition-colors cursor-pointer"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-lpm-blue-100 ml-1 font-mono">{counter}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
