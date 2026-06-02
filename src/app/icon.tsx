import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://mvt-agricola-celsov2.vercel.app/assets/logo_principal.png"
          width={32}
          height={32}
          style={{ objectFit: "cover", borderRadius: "50%" }}
          alt=""
        />
      </div>
    ),
    { ...size }
  );
}
