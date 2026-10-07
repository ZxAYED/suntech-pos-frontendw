import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: "#070B28",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0052FF",
          fontWeight: 800,
          borderRadius: 6,
          border: "1px solid rgba(0, 82, 255, 0.4)",
        }}
      >
        S
      </div>
    ),
    {
      ...size,
    },
  );
}
