import { useNavigate } from "react-router-dom";

export default function BackButton({ to, label = "Back", fallback = "/", style }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
      return;
    }
    // Go back in history if there's somewhere to go back to (i.e. this app
    // wasn't loaded directly on this page), otherwise fall back to a sane route.
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button type="button" className="back-link" onClick={handleClick} style={style}>
      ← {label}
    </button>
  );
}
