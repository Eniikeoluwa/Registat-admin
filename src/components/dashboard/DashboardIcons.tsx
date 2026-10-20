import Image from "next/image";

type IconProps = { className?: string };

export function Icon({ name, className = "" }: IconProps & { name: string }) {
  const common = {
    className: `h-5 w-5 shrink-0 ${className}`,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  const paths: Record<string, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path d="M9 21v-6h6v6" /></>,
    applications: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M3 9h18M8 4v5M16 4v5M8 15h.01M12 15h.01M16 15h.01" /></>,
    building: <><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h3M8 11h3M8 15h3M12 21v-3h2v3" /></>,
    document: <><path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M8 12h6M8 16h5" /></>,
    compliance: <><rect x="4" y="3" width="16" height="18" rx="3" /><path d="m8 13 2 2 5-5M8 8h7M8 18h3" /></>,
    billing: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>,
    addons: <><path d="M9 3H6a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h3v3a3 3 0 0 0 3 3h3a3 3 0 0 0 3-3v-3h3a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3h-3a3 3 0 0 0-3 3v3H9V6a3 3 0 0 0-3-3" /></>,
    settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.3a2 2 0 1 1-4 0v-.3a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 1.7 12a2 2 0 0 1 2-2H4a2 2 0 0 0 1.4-3.4l-.1-.1A2 2 0 1 1 8.1 3.7l.1.1A2 2 0 0 0 11.6 2H12a2 2 0 1 1 4 0v.3a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A2 2 0 0 0 20.8 10h.3a2 2 0 1 1 0 4h-.3a2 2 0 0 0-1.4 1Z" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    upload: <><path d="M12 16V4M8 8l4-4 4 4M5 14v5h14v-5" /></>,
    download: <><path d="M12 4v12M8 12l4 4 4-4M5 20h14" /></>,
    filter: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
    sparkle: <><path d="m12 3 1.3 5.7L19 10l-5.7 1.3L12 17l-1.3-5.7L5 10l5.7-1.3L12 3ZM19 16l.6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></>,
  };

  return <svg {...common}>{paths[name] ?? paths.document}</svg>;
}

export function Logo() {
  return <div className="flex items-center gap-1.5 text-[25px] font-extrabold tracking-[-0.08em] text-[#273b3b]"><Image src="/yellow.svg" alt="" width={27} height={27} priority /><span>registat</span></div>;
}
