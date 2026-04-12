type SiteFooterProps = {
  privacyUrl: string;
  termsUrl: string;
};

export function SiteFooter({ privacyUrl, termsUrl }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span className="footer-wordmark">Brawl Strategy</span>
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
