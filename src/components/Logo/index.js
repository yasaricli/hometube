import Link from "next/link";

// Styles
import Styles from "./styles.module.scss";

// The mark: a house with a play button in it — videos that live at home.
export const LogoMark = ({ size = 30 }) => (
  <svg viewBox="0 0 30 26" width={size} height={(size * 26) / 30} aria-hidden="true">
    <path
      d="M15 2 28 11.6c.6.5 1 1.2 1 2V22c0 1.7-1.3 3-3 3H4c-1.7 0-3-1.3-3-3v-8.4c0-.8.4-1.5 1-2z"
      fill="var(--brand)"
      stroke="var(--brand)"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M12.2 12.2 19 16l-6.8 3.8z" fill="#fff" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

const Logo = () => (
  <Link href="/" className={Styles.logo} aria-label="HomeTube home">
    <LogoMark />
    <span className={Styles.word}>
      Home<b>Tube</b>
    </span>
  </Link>
);

export default Logo;
