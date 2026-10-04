  export const uiCategories: string[] = [
    "academics",
    "business",
    "design",
    "development",
    "finance",
    "fitness",
    "lifestyle",
    "marketing",
    "music",
    "personal-development",
    "photography",
    "productivity",
    "technology",
  ];
  ///This will be seeded by the admin(At current stage)
  export const categoryToSubcategories: Record<string, string[]> = {
    academics: ["math", "science", "history"],
    business: ["entrepreneurship", "management", "sales"],
    design: ["ui", "ux", "graphic-design"],
    development: ["web", "mobile", "game"],
    finance: ["investing", "accounting", "crypto"],
    fitness: ["yoga", "cardio", "strength"],
    lifestyle: ["travel", "food", "productivity"],
    marketing: ["seo", "content", "ads"],
    music: ["production", "instrument", "theory"],
    "personal-development": ["mindfulness", "habits", "communication"],
    photography: ["editing", "gear", "composition"],
    productivity: ["time-management", "tools", "automation"],
    technology: ["ai", "cloud", "iot"],
  };
  export const uiLanguages: string[] = [
    "English", "Spanish", "French", "German", "Hindi", "Chinese", "Japanese",
    "Korean", "Portuguese", "Arabic", "Russian", "Bengali", "Urdu", "Tamil",
    "Telugu", "Gujarati", "Marathi", "Punjabi", "Malayalam", "Dutch", "Italian",
    "Swedish", "Turkish", "Vietnamese", "Thai", "Hebrew", "Polish", "Ukrainian",
    "Czech", "Romanian", "Greek", "Hungarian", "Finnish", "Slovak", "Norwegian",
    "Danish", "Croatian", "Serbian", "Bulgarian", "Estonian", "Latvian", "Lithuanian",
  ];