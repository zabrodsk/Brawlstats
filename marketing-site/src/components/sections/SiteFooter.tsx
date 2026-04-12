type SiteFooterProps = {
  privacyUrl: string;
  termsUrl: string;
};

export function SiteFooter({ privacyUrl, termsUrl }: SiteFooterProps) {
  return (
    <footer className="border-t border-[var(--brand-border)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <p className="text-sm text-[var(--text-muted)]">
          Brawl Strategy - map planning and tier lists for Brawl Stars players.
        </p>
        <nav className="flex items-center gap-5 text-sm">
          <a href={privacyUrl} className="footer-link">
            Privacy
          </a>
          <a href={termsUrl} className="footer-link">
            Terms
          </a>
        </nav>
      </div>
    </footer>
  );
}
