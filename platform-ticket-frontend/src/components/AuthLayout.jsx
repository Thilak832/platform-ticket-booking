import { LogoMark } from "./icons";

export default function AuthLayout({ children }) {
  return (
    <div className="auth-split">
      <div className="auth-split-visual">
        <div className="auth-split-brand">
          <LogoMark size={30} />
          <span>{import.meta.env.VITE_APP_NAME}</span>
        </div>

        <div className="auth-split-graphic">
          <div className="auth-split-ticket">
            <div className="auth-split-ticket-qr" />
            <div className="auth-split-ticket-lines">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <div>
          <h2 className="auth-split-title">Book. Verify. Go.</h2>
          <p className="auth-split-text">
            Skip the counter. Get a QR-code platform ticket for any of Chennai's suburban
            stations in under a minute.
          </p>
        </div>
      </div>

      <div className="auth-split-form">{children}</div>
    </div>
  );
}
