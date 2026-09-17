import { useEffect, useRef, useState } from "react";
import { FaCropAlt, FaTimes, FaUndo } from "react-icons/fa";
import useScrollLock from "../utils/useScrollLock";

/**
 * Square image crop modal — pure React + canvas (no libraries).
 *
 * Props:
 *   src        — image source (data URL or blob URL)
 *   onCancel   — close without saving
 *   onConfirm  — (croppedDataUrl) => void
 */
function ImageCropModal({ src, onCancel, onConfirm }) {
  useScrollLock(!!src);
  const OUT = 512; // output square size

  const [img, setImg] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [box, setBox] = useState(300); // preview square size

  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const boxRef = useRef(300);
  const imgRef = useRef(null);

  // Track the preview square's rendered size (re-computes cover zoom if
  // the image loaded before the first measurement arrived)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) {
        const wasDefault = boxRef.current === 300 && imgRef.current;
        boxRef.current = w;
        setBox(w);
        if (wasDefault) {
          setScale(w / Math.min(imgRef.current.width, imgRef.current.height));
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Load image + set an initial "cover" zoom
  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      imgRef.current = image;
      setImg(image);
      const cover = boxRef.current / Math.min(image.width, image.height);
      setScale(cover);
      setOffset({ x: 0, y: 0 });
    };
    image.src = src;
  }, [src]);

  // ── drag to pan ────────────────────────────────────────────────
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.ox + (e.clientX - dragRef.current.startX),
      y: dragRef.current.oy + (e.clientY - dragRef.current.startY),
    });
  };
  const onPointerUp = () => { dragRef.current = null; };

  const reset = () => {
    const C = boxRef.current || 300;
    setScale(img ? C / Math.min(img.width, img.height) : 1);
    setOffset({ x: 0, y: 0 });
  };

  // ── apply crop → canvas → dataURL ──────────────────────────────
  const apply = () => {
    if (!img) return;
    const C = boxRef.current || 300;

    const scaledW = img.width * scale;
    const scaledH = img.height * scale;
    const baseX = (C - scaledW) / 2 + offset.x;
    const baseY = (C - scaledH) / 2 + offset.y;

    // Source rect in image pixel coords
    let sx = -baseX / scale;
    let sy = -baseY / scale;
    let sw = C / scale;
    let sh = C / scale;

    // Clamp to image bounds
    sx = Math.min(Math.max(sx, 0), Math.max(img.width - sw, 0));
    sy = Math.min(Math.max(sy, 0), Math.max(img.height - sh, 0));
    sw = Math.min(sw, img.width - sx);
    sh = Math.min(sh, img.height - sy);

    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUT, OUT);
    onConfirm(canvas.toDataURL("image/jpeg", 0.92));
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-700/18 backdrop-blur-[6px]"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_-18px_rgba(15,23,42,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl
              bg-linear-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-200">
              <FaCropAlt size={15} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800">Crop Image</h2>
              <p className="text-xs text-slate-400">Drag to position · zoom to fit</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400
              hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
          >
            <FaTimes />
          </button>
        </div>

        {/* Preview */}
        <div className="p-6">
          <div
            ref={containerRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="relative mx-auto aspect-square w-full touch-none select-none overflow-hidden
              rounded-2xl border-2 border-sky-200 bg-slate-100 shadow-inner"
          >
            {img ? (
              <img
                src={src}
                alt="Crop preview"
                draggable={false}
                className="absolute left-0 top-0 max-w-none cursor-grab active:cursor-grabbing"
                style={{
                  width: img.width * scale,
                  height: img.height * scale,
                  transform: `translate(${(img.width * scale - box) / 2 + offset.x}px, ${(img.height * scale - box) / 2 + offset.y}px)`,
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading…</div>
            )}

            {/* Soft corners overlay */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-4 ring-inset ring-white/40" />
          </div>

          {/* Zoom */}
          <div className="mt-5 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">ZOOM</span>
            <input
              type="range"
              min="30"
              max="300"
              value={Math.round(scale * 100)}
              onChange={(e) => setScale(Number(e.target.value) / 100)}
              className="h-1.5 flex-1 cursor-pointer accent-sky-500"
            />
            <button
              onClick={reset}
              title="Reset zoom & position"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400
                hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
            >
              <FaUndo size={13} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-xl px-5 py-2 text-sm font-semibold text-slate-600
              hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={apply}
            className="relative overflow-hidden isolate after:content-[''] after:absolute after:top-0 after:-left-[130%] after:w-[55%] after:h-full after:bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] after:-skew-x-[20deg] after:transition-[left] after:duration-[650ms] after:ease-out after:z-10 after:pointer-events-none hover:after:left-[150%] rounded-xl bg-linear-to-r from-sky-500 to-blue-600 px-6 py-2 text-sm
              font-bold text-white shadow-lg shadow-sky-200 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropModal;
