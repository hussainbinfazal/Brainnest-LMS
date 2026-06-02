import { MetadataRoute } from "next";

export default function robots():MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Allow main public pages
        allow: "/",
        disallow: [
          "/api/*",
          "/admin/*",
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
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL}/sitemap.xml`,
  };
}