"use client";

export function OpenCeoConsole() {
  function openConsole() {
    const width = Math.min(1280, window.screen.availWidth - 40);
    const height = Math.min(900, window.screen.availHeight - 40);
    const left = Math.max(0, (window.screen.availWidth - width) / 2);
    const top = Math.max(0, (window.screen.availHeight - height) / 2);

    window.open(
      "/ceo",
      "rodzedu-ceo-console",
      `popup=yes,width=${width},height=${height},left=${left},top=${top},noopener,noreferrer`,
    );
  }

  return (
    <button type="button" onClick={openConsole} className="btn btn-primary">
      Open CEO Console Window
    </button>
  );
}
