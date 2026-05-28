import { MetadataRoute } from "next";


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages with high priority
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/courses`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  // User pages (usually require authentication - optional to include)
  const userPages: MetadataRoute.Sitemap = [
    {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/verifyemail`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/mycourses`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/myprofile`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/myprofile/mycertificates`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/chat`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/courses/liked-courses`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Dynamic pages - require database queries
  let dynamicPages: MetadataRoute.Sitemap = [];

  try {
    // TODO: Implement database queries for dynamic routes
    // Example pattern for fetching courses:
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    
    if (response.ok) {
      const courses = await response.json();
      
      courses.forEach((course: any) => {
        // Add course page
        dynamicPages.push({
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/courses/${course._id}`,
          lastModified: course.updatedAt ? new Date(course.updatedAt) : new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
        
        // Add lesson pages within each course
        course.sections?.forEach((section: any) => {
          section.lessons?.forEach((lesson: any) => {
            dynamicPages.push({
              url: `${process.env.NEXT_PUBLIC_BASE_URL}/courses/${course._id}/${lesson._id}`,
              lastModified: lesson.updatedAt ? new Date(lesson.updatedAt) : new Date(),
              changeFrequency: "weekly",
              priority: 0.7,
            });
          });
        });
      });
    }
    
    // TODO: Fetch chat routes if needed:
    // const chatsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chats`, {
    //   next: { revalidate: 3600 },
    // });
    // if (chatsResponse.ok) {
    //   const chats = await chatsResponse.json();
    //   chats.forEach((chat: any) => {
    //     dynamicPages.push({
    //       url: `${process.env.NEXT_PUBLIC_BASE_URL}/chat/${chat._id}`,
    //       lastModified: chat.updatedAt ? new Date(chat.updatedAt) : new Date(),
    //       changeFrequency: "weekly",
    //       priority: 0.6,
    //     });
    //   });
    // }
  } catch (error) {
    console.error("Error fetching dynamic routes for sitemap:", error);
  }

  // Combine all sitemap entries
  return [...staticPages, ...userPages, ...dynamicPages];
}

