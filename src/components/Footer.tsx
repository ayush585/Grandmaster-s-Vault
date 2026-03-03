'use client';

export default function Footer() {
  return (
    <footer
      className="text-center text-[0.75rem] text-text-tertiary py-2 bg-bg-primary border-t border-border"
      aria-label="Application credits"
    >
      © 2026 Ayushman Mukherjee&nbsp;—&nbsp;
      <a
        href="https://www.linkedin.com/in/ayushman-mukherjee-437a49314/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gold hover:underline"
      >
        LinkedIn
      </a>
    </footer>
  );
}
