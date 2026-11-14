import { CaretLeft, Eye, FolderSimple, PlusCircle } from '@phosphor-icons/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Link, useLocation } from 'react-router';

/** The iOS shell of the patient side (MIN-4587). Links to routes that exist; nothing here changes a route. */
const TABS = [
  { to: '/patient', label: 'Your record', Icon: FolderSimple, active: (p: string) => p === '/patient' || p.startsWith('/patient/exams') },
  { to: '/patient/diary', label: 'Add symptom', Icon: PlusCircle, active: (p: string) => p === '/patient/diary' },
  { to: '/patient/access', label: 'Who had access', Icon: Eye, active: (p: string) => p === '/patient/access' },
];

/** The floating glass tab bar. Three tabs, each the exact title of its screen. The fade keeps content clear of the home indicator. */
export function TabBar() {
  const { pathname } = useLocation();
  return (
    <>
      <div className="tab-fade" aria-hidden="true" />
      <nav className="tabbar" aria-label="Patient">
        {TABS.map(({ to, label, Icon, active }) => (
          <Link key={to} to={to} aria-current={active(pathname) ? 'page' : undefined}>
            <Icon size={22} weight="bold" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}

/** The navigation bar of a pushed screen: one 44 x 44 back control. The screen's h1 stays in the page under it. */
export function NavBar({ to, label = 'Back to your record' }: { to: string; label?: string }) {
  return (
    <header className="navbar">
      <Link to={to} className="nav-back" aria-label={label}>
        <CaretLeft size={22} weight="bold" aria-hidden="true" />
      </Link>
    </header>
  );
}

interface ScreenProps extends Omit<HTMLAttributes<HTMLElement>, 'className'> {
  children: ReactNode;
  /** A pushed screen gets the navigation bar and a back target. */
  back?: string;
  className?: string;
}

/** A patient screen: optional navigation bar, the page, and the tab bar. Attributes such as `data-testid` land on the `main`;
 *  they are written at the call site so the test ids stay greppable. */
export function PatientScreen({ children, back, className = '', ...rest }: ScreenProps) {
  return (
    <>
      {back && <NavBar to={back} />}
      <main className={`page tabbed${back ? ' pushed' : ''}${className ? ` ${className}` : ''}`} {...rest}>
        {children}
      </main>
      <TabBar />
    </>
  );
}
