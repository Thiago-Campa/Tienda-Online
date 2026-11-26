/* Íconos dibujados a mano en SVG (trazo 1.7). Heredan el color del texto. */
const Svg = ({ children, size = 20, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    {children}
  </svg>
);

export const IconBag = (p) => (
  <Svg {...p}>
    <path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z" />
    <path d="M9 10V7a3 3 0 0 1 6 0v3" />
  </Svg>
);
export const IconUser = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20.5c1.3-3.6 4.2-5.4 7.5-5.4s6.2 1.8 7.5 5.4" />
  </Svg>
);
export const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Svg>
);
export const IconSun = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </Svg>
);
export const IconMoon = (p) => (
  <Svg {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </Svg>
);
export const IconMenu = (p) => (
  <Svg {...p}>
    <path d="M4 8h16M4 16h10" />
  </Svg>
);
export const IconClose = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
export const IconArrow = (p) => (
  <Svg {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </Svg>
);
export const IconArrowLeft = (p) => (
  <Svg {...p}>
    <path d="M20 12H5M11 6l-6 6 6 6" />
  </Svg>
);
export const IconArrowUpRight = (p) => (
  <Svg {...p}>
    <path d="M7 17 17 7M8 7h9v9" />
  </Svg>
);
export const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const IconMinus = (p) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
);
export const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V4.8c0-.4.4-.8.8-.8h4.4c.4 0 .8.4.8.8V7M6.5 7l.8 12.2a2 2 0 0 0 2 1.8h5.4a2 2 0 0 0 2-1.8L17.5 7" />
  </Svg>
);
export const IconTruck = (p) => (
  <Svg {...p}>
    <path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3.2v2.8h-7" />
    <circle cx="6.5" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </Svg>
);
export const IconShield = (p) => (
  <Svg {...p}>
    <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6L12 3Z" />
    <path d="m8.8 12.2 2.2 2.2 4.3-4.6" />
  </Svg>
);
export const IconRefresh = (p) => (
  <Svg {...p}>
    <path d="M20 11a8 8 0 0 0-14.3-4.6L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.3 4.6l1.7-2.1M20 20v-4.5h-4.5" />
  </Svg>
);
export const IconCard = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M2.5 9.5h19M6.5 15h4" />
  </Svg>
);
export const IconStar = ({ filled, ...p }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
  </Svg>
);
export const IconCheck = (p) => (
  <Svg {...p}>
    <path d="m4.5 12.5 4.8 4.8L19.5 7" />
  </Svg>
);
export const IconPrinter = (p) => (
  <Svg {...p}>
    <path d="M7 8V3.5h10V8M7 17H4.5v-7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7H17" />
    <path d="M7 14h10v6.5H7z" />
  </Svg>
);
export const IconBox = (p) => (
  <Svg {...p}>
    <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z" />
    <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
  </Svg>
);
export const IconChart = (p) => (
  <Svg {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
  </Svg>
);
export const IconUsers = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3.3" />
    <path d="M2.8 19.5c1-3.1 3.4-4.7 6.2-4.7s5.2 1.6 6.2 4.7" />
    <path d="M15.5 5.4a3.3 3.3 0 0 1 0 6.3M17.6 14.9c1.7.6 3 2 3.6 4.6" />
  </Svg>
);
export const IconTag = (p) => (
  <Svg {...p}>
    <path d="M3.5 12.3V4.5a1 1 0 0 1 1-1h7.8l8.2 8.2a1.5 1.5 0 0 1 0 2.1l-6.4 6.4a1.5 1.5 0 0 1-2.1 0l-8.5-7.9Z" />
    <circle cx="8" cy="8" r="1.4" />
  </Svg>
);
export const IconLogout = (p) => (
  <Svg {...p}>
    <path d="M14 4h4.5a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16.5 5.5 12 10 7.5M5.5 12H15" />
  </Svg>
);
export const IconStore = (p) => (
  <Svg {...p}>
    <path d="M4 9.5V20h16V9.5M3 9.5 5 4h14l2 5.5c0 1.5-1.3 2.5-2.8 2.5S15.5 11 15.5 9.5c0 1.5-1.4 2.5-3.5 2.5s-3.5-1-3.5-2.5C8.5 11 7.3 12 5.8 12S3 11 3 9.5Z" />
    <path d="M10 20v-5h4v5" />
  </Svg>
);
export const IconEdit = (p) => (
  <Svg {...p}>
    <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3ZM14.5 7.5l3 3" />
  </Svg>
);
export const IconDownload = (p) => (
  <Svg {...p}>
    <path d="M12 4v11M7 10.5l5 5 5-5M4.5 20h15" />
  </Svg>
);
export const IconInstagram = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="3.8" />
    <circle cx="17.2" cy="6.8" r=".6" fill="currentColor" />
  </Svg>
);
export const IconFacebook = (p) => (
  <Svg {...p}>
    <path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.5L17 11h-3V9a.5.5 0 0 1 .5-.5Z" />
  </Svg>
);
export const IconTiktok = (p) => (
  <Svg {...p}>
    <path d="M14 3.5v11.2a3.8 3.8 0 1 1-3.8-3.8M14 3.5c.4 2.6 2.3 4.5 5 4.8" />
  </Svg>
);
export const IconWhatsapp = (p) => (
  <Svg {...p}>
    <path d="M4 20.5 5.2 16.6A8.5 8.5 0 1 1 8.4 19.5L4 20.5Z" />
    <path d="M9 8.6c.2-.5.6-.6 1-.6l.6 1.5-.6.9c.5 1.1 1.4 2 2.6 2.6l.9-.6 1.5.6c0 .4-.1.8-.6 1-1.8.7-6-2.8-5.4-5.4Z" />
  </Svg>
);
export const IconMail = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
  </Svg>
);
export const IconPin = (p) => (
  <Svg {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </Svg>
);
export const IconClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);
export const IconAlert = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5v5.5M12 16.2v.3" />
  </Svg>
);
export const IconInfo = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.8v.3" />
  </Svg>
);
export const IconCopy = (p) => (
  <Svg {...p}>
    <rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2" />
    <path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5" />
  </Svg>
);
export const IconChevron = (p) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);
export const IconSparkle = (p) => (
  <Svg {...p}>
    <path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z" />
  </Svg>
);
export const IconTrendUp = (p) => (
  <Svg {...p}>
    <path d="m4 16 6-6 4 4 6-6M15 8h5v5" />
  </Svg>
);
export const IconTrendDown = (p) => (
  <Svg {...p}>
    <path d="m4 8 6 6 4-4 6 6M15 16h5v-5" />
  </Svg>
);
export const IconFilter = (p) => (
  <Svg {...p}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </Svg>
);
export const IconEye = (p) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);
export const IconImage = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="m4 17 4.5-4.5 3.5 3.5 2.5-2.5L20 19" />
  </Svg>
);

export const BENEFIT_ICONS = { truck: IconTruck, card: IconCard, refresh: IconRefresh, shield: IconShield };

export const IconGithub = (p) => (
  <Svg fill="currentColor" stroke="none" {...p}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </Svg>
);
