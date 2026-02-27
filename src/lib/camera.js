export function resizeImage(base64, maxWidth = 1200) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const resized = canvas.toDataURL("image/jpeg", 0.85);
      // Strip the data:image/jpeg;base64, prefix
      resolve(resized.split(",")[1]);
    };
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
    img.src = base64.startsWith("data:") ? base64 : `data:image/jpeg;base64,${base64}`;
  });
}
