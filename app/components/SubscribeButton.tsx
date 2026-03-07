"use client";

import { useState, useRef, useEffect } from "react";

const BTN =
  "bg-accent-pink border-t-2 border-l-2 border-[#FFD9EB] border-r-2 border-b-2 border-r-[#C8909F] border-b-[#C8909F] px-4 sm:px-6 py-2 sm:py-2.5 text-xs font-mono font-bold uppercase tracking-wide active:border-t-[#C8909F] active:border-l-[#C8909F] active:border-r-[#FFD9EB] active:border-b-[#FFD9EB] shadow-md";

export default function SubscribeButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <button className={BTN + " flex items-center justify-center"} onClick={() => setOpen(true)}>
        {/* Envelope icon on mobile */}
        <svg className="sm:hidden w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="3" width="14" height="10" rx="1" />
          <path d="M1 4l7 5 7-5" />
        </svg>
        <span className="hidden sm:inline">Subscribe</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          onClick={() => { if (status !== "loading") setOpen(false); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Modal */}
          <div
            className="relative bg-[#ECECEC] border-t-[3px] border-l-[3px] border-white border-r-[3px] border-b-[3px] border-r-[#808080] border-b-[#808080] p-3 w-[340px] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-10 w-7 h-7 bg-[#E0E0E0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] flex items-center justify-center text-sm font-bold active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white"
            >
              &times;
            </button>

            {/* Content */}
            <div className="px-5 pt-4 pb-4">
              {status === "success" ? (
                <>
                  <h3 className="text-lg font-display font-bold text-black leading-tight mb-3">
                    Verify subscription
                  </h3>
                  <div className="text-[9px] text-gray-500 font-mono font-bold uppercase tracking-[0.15em] mb-5">
                    Verify your email to follow marty
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="block w-full text-center bg-[#E0E0E0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-wide active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white"
                  >
                    OK &gt;&gt;
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-display font-bold text-black leading-tight mb-3">
                    Subscribe
                  </h3>
                  <div className="text-[9px] text-gray-500 font-mono font-bold uppercase tracking-[0.15em] mb-5">
                    See where Marty is at
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="border-t-[3px] border-l-[3px] border-[#808080] border-r-[3px] border-b-[3px] border-r-white border-b-white">
                      <input
                        ref={inputRef}
                        type="email"
                        required
                        placeholder="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
                        className="bg-white px-3 py-2.5 text-xs outline-none w-full"
                        style={{ fontFamily: 'Tahoma, Verdana, -apple-system, sans-serif' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="block w-full text-center bg-[#E0E0E0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-wide active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white"
                    >
                      {status === "loading" ? "SUBSCRIBING..." : status === "error" ? "RETRY >>" : "SUBSCRIBE >>"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
