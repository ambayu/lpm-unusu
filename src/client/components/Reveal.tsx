import React from 'react';
import { useReveal } from '../hooks/useReveal';

/**
 * Reveal: pembungkus tipis `useReveal` untuk dipakai langsung di JSX.
 *
 * Dipakai sebagai `<Reveal delay={70}>` tanpa perlu menulis ref & style manual.
 * `as` memungkinkan elemen semantik (mis. `li` di dalam `ol`) tetap dipakai
 * alih-alih selalu `div`.
 */
export const Reveal: React.FC<{
  delay?: number;
  /** `false` untuk seksi yang sudah terlihat saat halaman dibuka. */
  animasiAwal?: boolean;
  className?: string;
  /** Anchor id, dipakai navbar untuk melompat ke seksi. */
  id?: string;
  as?: 'div' | 'li' | 'section' | 'article';
  children: React.ReactNode;
}> = ({ delay = 0, animasiAwal = true, className = '', id, as: Tag = 'div', children }) => {
  const { ref, style } = useReveal<HTMLElement>({ delay, animasiAwal });
  return (
    <Tag ref={ref as never} id={id} style={style} className={className}>
      {children}
    </Tag>
  );
};

export default Reveal;
