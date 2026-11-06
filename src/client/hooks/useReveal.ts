import React from 'react';

/**
 * useReveal: animasi masuk per seksi saat halaman digulir.
 *
 * Cara kerja:
 * 1. Elemen mulai tersembunyi (opasitas 0, geser 24px ke bawah).
 * 2. Saat seksi memasuki viewport, elemen bergeser naik dan memudar masuk
 *    sekali saja, lalu diam.
 * 3. Seksi yang berdampingan dengan hero memakai `animasiAwal={false}`
 *    sehingga langsung tampil tanpa menunggu scroll.
 * 4. `prefers-reduced-motion: reduce` mematikan animasi dan langsung
 *    menampilkan elemen dalam keadaan akhir.
 * 5. Tanpa `IntersectionObserver`, elemen langsung tampil.
 *
 * Satu observer dipakai bersama seluruh elemen halaman agar biayanya konstan,
 * berapa pun jumlah seksi beranimasi.
 */

type Callback = () => void;

const petaCallback = new WeakMap<Element, Callback>();
let observerGlobal: IntersectionObserver | null = null;

function observerBersama(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;

  if (!observerGlobal) {
    observerGlobal = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const cb = petaCallback.get(entry.target);
          if (cb) cb();
          petaCallback.delete(entry.target);
          observerGlobal?.unobserve(entry.target);
        });
      },
      {
        // Picu 80px sebelum elemen menyentuh tepi bawah layar, supaya animasi
        // sudah selesai saat seksi benar-benar terbaca mata.
        rootMargin: '0px 0px -80px 0px',
        // 0 berarti cukup 1 piksel terlihat. Seksi setinggi viewport tetap
        // memicu, berbeda dengan threshold persentase.
        threshold: 0,
      },
    );
  }

  return observerGlobal;
}

/**
 * @param opsi.delay        Jeda tambahan dalam milidetik. Untuk efek berurutan
 *                          dalam satu grid, isi dengan indeks dikali 90.
 * @param opsi.animasiAwal  Bila `false`, elemen ditampilkan tanpa animasi saat
 *                          halaman pertama dibuka. Dipakai untuk seksi yang
 *                          berdampingan dengan hero.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  delay?: number;
  animasiAwal?: boolean;
}) {
  const ref = React.useRef<T | null>(null);
  const [terlihat, setTerlihat] = React.useState(false);
  const delay = options?.delay ?? 0;
  const animasiAwal = options?.animasiAwal ?? true;

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Hormati preferensi pengguna: langsung tampil tanpa animasi.
    const kurangiGerak = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const observer = observerBersama();

    if (kurangiGerak || !observer) {
      setTerlihat(true);
      return;
    }

    // Seksi yang berdampingan dengan hero tampil apa adanya. Penentunya
    // sengaja tidak memakai posisi elemen: seksi tepat di bawah batas layar
    // punya `top` lebih besar dari tinggi viewport, sehingga pengecekan posisi
    // akan gagal dan seksinya tertinggal kosong.
    if (!animasiAwal) {
      setTerlihat(true);
      return;
    }

    petaCallback.set(node, () => setTerlihat(true));

    // Tunggu satu frame sebelum mengamati. Tanpa ini, elemen yang sudah berada
    // di dalam viewport saat mount langsung dianggap terlihat pada frame
    // pertama dan transisinya habis sebelum sempat dilukis browser.
    const raf = requestAnimationFrame(() => observer.observe(node));

    return () => {
      cancelAnimationFrame(raf);
      petaCallback.delete(node);
      observer.unobserve(node);
    };
  }, [animasiAwal]);

  const style: React.CSSProperties = {
    opacity: terlihat ? 1 : 0,
    transform: terlihat ? 'none' : 'translateY(24px)',
    transition: `opacity 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    // Dibuat kondisional supaya compositor tidak menahan lapisan terus-menerus
    // setelah animasi selesai.
    willChange: terlihat ? 'auto' : 'opacity, transform',
  };

  return { ref, style, terlihat };
}
