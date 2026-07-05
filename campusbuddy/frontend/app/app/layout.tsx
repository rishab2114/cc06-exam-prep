import { StoreProvider } from '../../lib/store';
import { AppNav } from '../../components/AppNav';

// Authenticated app shell. Mobile: centered phone column + bottom tab bar.
// Desktop (lg+): a real sidebar and a full-width content area — each page decides
// its own layout/width (wide dashboards for Home/Explore, comfortable reading
// width for forms and threads), instead of a stretched phone column.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <div className="min-h-screen bg-slate-50">
        <AppNav variant="sidebar" />

        <div className="lg:pl-60">
          {/* Mobile: phone-width, centered, room for the tab bar.
              Desktop: full width with padding; pages self-constrain. */}
          <div className="mx-auto w-full max-w-md pb-20 lg:mx-0 lg:max-w-none lg:px-8 lg:pb-10 lg:pt-2">
            {children}
          </div>
        </div>

        <AppNav variant="tabs" />
      </div>
    </StoreProvider>
  );
}
