import { useRef } from "react";
import { resizeImage } from "../../lib/camera";

export default function BatchCamera({ images, onImagesChange }) {
  const fileRef = useRef(null);

  async function handleCapture(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const resized = await resizeImage(reader.result);
        onImagesChange([...images, resized]);
      } catch {
        // Silently skip unreadable images
      }
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function removeImage(index) {
    onImagesChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          {images.map((img, i) => (
            <div key={i} className="relative flex-shrink-0">
              <img
                src={`data:image/jpeg;base64,${img}`}
                alt={`Zettel ${i + 1}`}
                className="w-15 h-15 rounded-lg object-cover border border-zinc-700"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-800 border border-zinc-600 rounded-full flex items-center justify-center text-xs text-zinc-300"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Capture button */}
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full h-14 rounded-xl font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        style={{ backgroundColor: "#60A5FA" }}
      >
        <span className="text-lg">{"\u{1F4F7}"}</span>
        {images.length === 0 ? "Zettel fotografieren" : "Weiteren Zettel fotografieren"}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />

      {images.length > 0 && (
        <p className="text-zinc-400 text-sm text-center mt-2">
          {images.length} {images.length === 1 ? "Zettel" : "Zettel"} aufgenommen
        </p>
      )}
    </div>
  );
}
