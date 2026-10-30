import React, { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

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
    image: "/assets/hero/lpm-hero-1.png",
    imageMobile: "/assets/hero/lpm-hero-1.png",
    title: "Auditor Mutu Internal UNUSU",
    badge: "Siklus PPEPP Nasional",
    headline: "Standar Penjaminan Mutu Internal",
    subheadline: "Mengawal mutu tata kelola tridharma perguruan tinggi menuju akreditasi institusi Unggul.",
  },
  {
    id: 2,
    image: "/assets/hero/lpm-hero-2.png",
    imageMobile: "/assets/hero/lpm-hero-2.png",
    title: "Evaluasi Kurikulum & Capaian Akademik",
    badge: "Outcome-Based Education",
    headline: "Capaian Pembelajaran Terstandarisasi",
    subheadline: "Penyelarasan kurikulum 14 Program Studi S1 berbasis KKNI level 6 dan nilai Aswaja An-Nahdliyah.",
  },
  {
    id: 3,
    image: "/assets/hero/lpm-hero-3.png",
    imageMobile: "/assets/hero/lpm-hero-3.png",
    title: "Kampus Terpadu UNUSU Medan",
    badge: "Audit AMI Real-Time",
    headline: "Audit Mutu Internal Berkelanjutan",
    subheadline: "Pencatatan kesenjangan mutu (KTS Mayor & Minor) dan rekomendasi tindak lanjut (RTL) terintegrasi.",
  },
  {
    id: 4,
    image: "/assets/hero/lpm-hero-4.png",
    imageMobile: "/assets/hero/lpm-hero-4.png",
    title: "Pusat Dokumentasi & Akreditasi",
    badge: "Bank Dokumen Legal",
    headline: "Arsip Kebijakan, Manual & SOP",
    subheadline: "Dokumentasi digital resmi pedoman mutu universitas terverifikasi SK Rektor.",
  },
];

export const FullHeroSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % defaultHeroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () =>
    setCurrentSlide((prev) => (prev === 0 ? defaultHeroSlides.length - 1 : prev - 1));
  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % defaultHeroSlides.length);

  return (
    <section
      aria-label="Hero Banner Slider"
      className="relative isolate w-full overflow-hidden bg-slate-950 text-white md:flex md:h-[calc(100vh-5rem)] md:min-h-[560px] md:flex-col md:justify-end"
    >
      {/* 
        Mobile: Aspek 1:1 memakai aset khusus mobile agar visual utuh.
        Desktop: Full-bleed menutupi seluruh hero 16:9.
      */}
      <div className="relative aspect-square w-full overflow-hidden md:absolute md:inset-0 md:aspect-auto md:h-full">
        {defaultHeroSlides.map((item, index) => (
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
                className="h-full w-full object-cover object-center"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </picture>

            {/* Gradient Scrim Tipis agar teks terbaca kontras & elegan */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent md:from-slate-950/85 md:via-slate-950/20" />
          </div>
        ))}
      </div>

      {/* Konten Kata-Kata Dikit Elegan di Bagian Bawah Hero */}
      <div className="relative z-20 px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl mx-auto w-full">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
            <span>{defaultHeroSlides[currentSlide].badge}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white tracking-normal leading-tight drop-shadow-md">
            {defaultHeroSlides[currentSlide].headline}
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl drop-shadow-xs font-normal">
            {defaultHeroSlides[currentSlide].subheadline}
          </p>
        </div>

        {/* Bar Navigasi Slider & Dots */}
        <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {defaultHeroSlides.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Slide ${idx + 1}: ${item.title}`}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentSlide ? "w-8 bg-amber-400" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Slide Sebelumnya"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
            >
              <ChevronLeftIcon className="w-4 h-4 text-amber-300" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Slide Berikutnya"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
            >
              <ChevronRightIcon className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
