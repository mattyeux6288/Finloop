export function ThemeToggle() {
  return (
    <div style={{ fontSize: '0.52rem' }} title="Thème clair / sombre">
      <label htmlFor="finloop-theme" className="theme">
        <span className="theme__toggle-wrap">
          <input
            id="finloop-theme"
            className="theme__toggle"
            type="checkbox"
            role="switch"
            name="theme"
            value="dark"
          />
          <span className="theme__fill" />
          <span className="theme__icon">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="theme__icon-part" />
            ))}
          </span>
        </span>
      </label>
    </div>
  );
}
