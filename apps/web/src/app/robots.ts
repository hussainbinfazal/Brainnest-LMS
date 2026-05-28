const BASE_URL = "https://brainnest-lms-fzqv.vercel.app";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        // Allow main public pages
        allow: "/",
        disallow: [
          "/api/*",
          "/(admin)/*",
          "/course/manage*",
          "/course/create*",
          "/course/edit*",
          "/checkout",
          "/cart",
          "/myprofile*",
          "/mycourses*",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}