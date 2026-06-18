import { useToast } from "../context/ToastContext.jsx";

const ICONS = { success: "✅", error: "❌", info: "ℹ️" };

export default function Toast() {
  const { toasts } = useToast();

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`} role="alert">
          <span className="toast-icon">{ICONS[t.type]}</span>
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.message && <div>{t.message}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
