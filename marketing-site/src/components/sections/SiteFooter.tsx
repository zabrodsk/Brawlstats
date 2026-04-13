type SiteFooterProps = {
  privacyUrl: string;
  termsUrl: string;
};

export function SiteFooter({ privacyUrl, termsUrl }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-wordmark">Brawl Strategy</span>
          <span className="footer-subword">built for Brawl Stars players</span>
        </div>
        <nav className="footer-links" aria-label="Footer">
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
