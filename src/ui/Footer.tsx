import { BRAND, LINKS } from '../content'
import { useCopy } from '../store'
import { LangToggle } from './LangToggle'

const HREFS = [LINKS.howItWorks, LINKS.safety, LINKS.garages, LINKS.contact]

export function Footer() {
  const c = useCopy()
  return (
    <footer className="site-footer" id="contact">
      <div className="footer__grid">
        <div style={{ display: 'grid', gap: 18 }}>
          <p className="footer__wordmark">{BRAND.name}</p>
          <p className="footer__disclaimer">{c.footer.disclaimer}</p>
          <p className="mono footer__note">{c.footer.note}</p>
        </div>
        <div style={{ display: 'grid', gap: 22, justifyItems: 'start' }}>
          <nav aria-label={BRAND.name}>
            <ul className="footer__links">
              {c.footer.links.map((label, i) => (
                <li key={label}>
                  <a href={HREFS[i]}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <LangToggle />
        </div>
      </div>
    </footer>
  )
}
