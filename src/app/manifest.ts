import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "사계절 메추리 프로젝트",
    short_name: "메추리",
    description: "특수교육 대상 학생들을 위한 계절별 메추리 생태 관찰 PWA",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ec4899",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
