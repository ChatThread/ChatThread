export default function MessageLoading() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="text-foreground"
      aria-hidden="true"
    >
      <style>{`
        @keyframes msgLoad {
          0% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0); }
        }
      `}</style>

      <circle
        cx="4"
        cy="12"
        r="2"
        fill="currentColor"
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          animation: "msgLoad 0.6s cubic-bezier(.33,.66,.66,1) infinite",
          animationDelay: "0s",
        }}
      />

      <circle
        cx="12"
        cy="12"
        r="2"
        fill="currentColor"
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          animation: "msgLoad 0.6s cubic-bezier(.33,.66,.66,1) infinite",
          animationDelay: "0.1s",
        }}
      />

      <circle
        cx="20"
        cy="12"
        r="2"
        fill="currentColor"
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          animation: "msgLoad 0.6s cubic-bezier(.33,.66,.66,1) infinite",
          animationDelay: "0.2s",
        }}
      />
    </svg>
  );
}
