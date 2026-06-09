import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// Carga la imagen y la recorta en círculo usando un clipPath SVG
export default async function Icon() {
  const imageUrl = "https://agrencia.vercel.app/assets/logo_principal.png";

  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          overflow: "hidden",
          display: "flex",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} width={64} height={64} style={{ objectFit: "cover" }} alt="" />
      </div>
    ),
    {
      width: 64,
      height: 64,
    }
  );
}
