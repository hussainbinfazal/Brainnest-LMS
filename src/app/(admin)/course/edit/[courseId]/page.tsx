"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RxCross2 } from "react-icons/rx";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Image from "next/image";
import { RxCrossCircled } from "react-icons/rx";
import Tiptap from "@/components/Tiptap";
import { Course, CourseRatingProps, Faq, Lesson, Topic } from "@/types/client";
const EditCoursePage = () => {
  const [selectedLessonVideoNames, setSelectedLessonVideoNames] = useState<string[]>(
    [],
  );
  const [isLessonVideoUploading, setIsLessonVideoUploading] = useState<{ [key: string]: boolean }>({});
  const [topics, setTopics] = useState< { topic: string; description: string }[]>([{ topic: "", description: "" }]);
  const [title, setTitle] = useState< string >("");
  const [lessons, setLessons] = useState< { name: string; description: string; video: string; duration: string }[]>([
    { name: "", description: "", video: "", duration: "" },
  ]);
  const [price, setPrice] = useState< string >("");
  const [coverImage, setCoverImage] = useState< string >("");
  const [category, setCategory] = useState< string >("");
  const [subCategory, setSubCategory] = useState< string>("");
  const [discount, setDiscount] = useState< string >("");
  const [duration, setDuration] = useState< number >(0);
  const [durationInput, setDurationInput] = useState< string >("");
  const [video, setVideo] = useState< string >("");
  const [whatYouWillLearn, setWhatYouWillLearn] = useState< string []>([]);
  const [requirements, setRequirements] = useState< string[] >([]);
  const [certificate, setCertificate] = useState< string | boolean >("");
  const [level, setLevel] = useState< string >("");
  const [language, setLanguage] = useState< string >("");
  const [status, setStatus] = useState< string >("");
  const [faq, setFaq] = useState<  { question: string; answer: string }[]>([{ question: "", answer: "" }]);
  const [tags, setTags] = useState< string[]>([]);
  const [isVideoUploading, setIsVideoUploading] = useState< boolean >(false);
  const [isImageUploading, setIsImageUploading] = useState< boolean >(false);
  const [selectedVideoName, setSelectedVideoName] = useState< string >("");
  const [selectedImageName, setSelectedImageName] = useState< string >("");
  const [course, setCourse] = useState< Course >();
  const [loading, setLoading] = useState< boolean >(false);
  const { courseId } = useParams();
  const authUser = useAuthStore((state) => state.authUser);
  const [addNewImage, setAddNewImage] = useState< boolean >(false);
  const [previewNewCover, setPreviewNewCover] = useState< string >("");
  const [previewLessonVideo, setPreviewLessonVideo] = useState< string[] >([]);
  const [isLoadingCourse, setIsLoadingCourse] = useState< boolean >(true);
  const [description, setDescription] = useState< string >("");
 
  const getCourseFromParams = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axios.get(`/api/admin/course/${courseId}`);
      const courseData = await response.data.course;
      console.log("This is the course Data ", courseData);

      setCourse(courseData);
      setLevel(courseData.level);
      setCategory(courseData.category.name);
      setSubCategory(courseData.category.subCategories[0]);
      setTitle(courseData.title);
      setPrice(courseData.price);
      setCoverImage(courseData.coverImage);
      setLevel(courseData.level);
      setDiscount(courseData.discount);
      setDuration(courseData.duration);
      setWhatYouWillLearn(courseData.whatYouWillLearn);
      setRequirements(courseData.requirements);
      setCertificate(courseData.certificate);
      // setLevel(course.level);
      setLanguage(courseData.language);
      setStatus(courseData.status);
      setTags(courseData.tags);
      setTopics(courseData.topics);
      setLessons(courseData.lessons);
      setFaq(courseData.faq);
      setPreviewNewCover(courseData.coverImage);
      setPreviewLessonVideo(courseData?.lessons?.map((lesson:Lesson) => lesson.video));
      setDescription(courseData.description);
      console.log("THis is the course fetched from the DB ", course);
    } catch (error: any) {
    } finally {
      setIsLoadingCourse(false);
    }
  }, []);
  const handleSetDataInForm = (): void => {
    if (course) {
    }
  };

  
  useEffect(() => {
    const timer = setTimeout(() => {
      getCourseFromParams();
    }, 300); // Small delay to prevent immediate load
    return () => clearTimeout(timer);
  }, [getCourseFromParams]);

  useEffect(() => {
    handleSetDataInForm();
  }, [course]);
  const router = useRouter();
  const handleTopicChange = ({index, field, value}: {index: number, field: keyof Topic, value: Topic[typeof field] }):  void => {
    const newTopics = [...topics];
    newTopics[index][field] = value;
    setTopics(newTopics);
  };

  const handleFaqChange = ({index, field, value}: {index: number, field: keyof Faq, value: Faq[typeof field] }):  void => {
    const newFaq = [...faq];
    newFaq[index][field] = value;
    setFaq(newFaq);
  };

  const handleLessonChange = ({index, field, value}: {index: number, field: keyof Lesson, value: Lesson[typeof field] }): void => {
    const newLessons = [...lessons];
    newLessons[index][field] = value;
    setLessons(newLessons);
  };
  const addTopic = ():  void => {
    setTopics([...topics, { topic: "", description: "" }]);
  };
  const removeTopic = (index :  number): void => {
    const newTopics = [...topics];
    newTopics.splice(index, 1);
    setTopics(newTopics);
  };

  const addLesson = ():  void => {
    setLessons([
      ...lessons,
      { duration: "", description: "", video: "", name: "" },
    ]);
    setIsLessonVideoUploading((prev) => ({
      ...prev,
      [lessons.length]: false, // New lesson at the last index
    }));
  };

  const removeLesson = (index: number):  void => {
    const newLessons = [...lessons];
    newLessons.splice(index, 1);
    setLessons(newLessons);
  };
  const addFaq = () => {
    setFaq([...faq, { question: "", answer: "" }]);
  };
  const removeFaq = (index: number) : void => {
    const newFaq = [...faq];
    newFaq.splice(index, 1);
    setFaq(newFaq);
  };

  const handleManualDurationChange = (e: React.ChangeEvent<HTMLInputElement> ): void => {
    const input = e.target.value;
    setDurationInput(input);

    const parts = input.split(":").map(Number);
    let totalSeconds = 0;

    if (parts.length === 3) {
      totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      totalSeconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      totalSeconds = parts[0];
    }

    setDuration(totalSeconds);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    try {
      setIsVideoUploading(true);
      const target = e.target as HTMLInputElement;
      if (!target.files) return;
      const file = target.files[0];
      setSelectedVideoName(file.name);
      const url = await handleUpload(file);
      setVideo(url);

      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const seconds = Math.floor(video.duration);
        setDuration(seconds);

        // Format back into hh:mm:ss for display
        const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const secs = String(seconds % 60).padStart(2, "0");
        setDurationInput(`${hrs}:${mins}:${secs}`);
      };
      video.src = URL.createObjectURL(file);
    } catch (error: any ) {
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsImageUploading(true);
      const target = e.target as HTMLInputElement;
      if (!target.files) return;
      const file =  target.files[0];
      setSelectedImageName(file.name);
      const url = await handleUpload(file);
      setCoverImage(url);
      setPreviewNewCover(url);
    } catch (error: any) {
      return alert(error.message);
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleUpdateCourse = async () => {
    if (
      !title ||
      title === "" ||
      !coverImage ||
      coverImage === "" ||
      !category ||
      category === "" ||
      !subCategory ||
       subCategory.length === 0||
      !whatYouWillLearn ||
      whatYouWillLearn.length === 0 ||
      !requirements ||
      requirements.length === 0 ||
      !level ||
      level === "" ||
      !language ||
      language === "" ||
      !tags ||
      tags.length === 0 ||
      !price ||
      price === "" ||
      !lessons ||
      lessons.length === 0 ||
      !topics ||
       topics.length === 0||
      !faq ||
      faq.length === 0 ||
      !price ||
      price === ""
    ) {
      // console.log("This is the title", title)
      // console.log("This is the subCategory",subCategory)
      // console.log("This is the coverImage", coverImage)
      // console.log("This is the whatYouWillLearn", whatYouWillLearn)
      // console.log("This is the requirements", requirements)
      // console.log("This is the level", level)
      // console.log("This is the language", language)
      // console.log("This are the tags", tags)
      // console.log("This is the price", price)
      // console.log("This is the video", video)
      // console.log("This is the lessons", lessons)
      // console.log("This is the topics", topics)
      // console.log("This is the faq", faq)

      return alert(
        `
          All fields are required:

          Title: ${title}
          Description: ${description}
          Price: ${price}
          Category: ${category}
          SubCategory: ${subCategory}
          FAQ: ${JSON.stringify(faq)}
          Requirements: ${requirements}
          WhatYouWillLearn: ${whatYouWillLearn}
          Video: ${video}
          Lessons: ${JSON.stringify(lessons)}
          CoverImage: ${coverImage}
          Duration: ${duration}
          Language: ${language}
          Level: ${level}
          Certificate: ${certificate}
          Tags: ${tags.join(", ")}
          Topics: ${JSON.stringify(topics)}`);
    }
    try {
      const plainDescription = description.replace(/<[^>]*>/g, "");

      const courseData = {
        title,
        price,
        coverImage,
        category: {
          name: category,
          subCategories: [subCategory],
        },

        discount: parseFloat(discount) || 0,
        duration: duration,
        video,
        whatYouWillLearn: whatYouWillLearn,
        requirements: requirements,
        level: level.toLowerCase(),
        language,
        status: "draft",
        tags: tags,
        description: plainDescription,
        topics: topics,
        lessons,
        faq,
        certificate: certificate === "true" || certificate === true,
      };
      const response = await axios.put(
        `/api/admin/course/${courseId}`,
        courseData
      );
      toast.success("Course Updated successfully");
      setCourse(response.data.course);
      router.push("/course/manage");
    } catch (error) {}
  };
  const handleLessonVideoUpload = async (index: number, file: File): Promise<void> => {
    setIsLessonVideoUploading((prev) => {
      const newState = { ...prev }; // Create a shallow copy
      newState[index] = true; // Set the specific index to true
      return newState;
    });

    try {
      setSelectedLessonVideoNames((prev) => ({
        ...prev,
        [index]: file.name,
      }));

      const videoElement = document.createElement("video");
      videoElement.preload = "metadata";

      videoElement.onloadedmetadata = async () => {
        window.URL.revokeObjectURL(videoElement.src);

        const seconds = Math.floor(videoElement.duration);

        const updatedLessons = [...lessons];
        const url = await handleUpload(file);
        setIsLessonVideoUploading((prev) => {
          const newState = { ...prev }; // Create a shallow copy
          newState[index] = false; // Set the specific index to false
          return newState;
        });

        updatedLessons[index].video = url;
        const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const secs = String(seconds % 60).padStart(2, "0");
        updatedLessons[index].duration = `${hrs}:${mins}:${secs}`; // store raw seconds

        setLessons(updatedLessons);
        setPreviewLessonVideo(updatedLessons.map((lesson) => lesson.video));
      };

      videoElement.src = URL.createObjectURL(file);
    } catch (error) {
    } finally {
    }
  };
  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/upload", formData);

      return response.data.filePath;
    } catch (error) {
      throw new Error("Upload failed");
    }
  };

  useEffect(() => {
    // Initialize states for each lesson
    const initialUploadingState:Record<number, boolean> = {};
    const initialVideoNames = lessons.map(() => "");

    lessons.forEach((_, index) => {
      initialUploadingState[index] = false;
      
    });

    setIsLessonVideoUploading(initialUploadingState);
    setSelectedLessonVideoNames(initialVideoNames);
  }, []);
  // useEffect(() => {
  // }, [previewLessonVideo]);

  const categories = [
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
  const categoryToSubcategories = {
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
  const handleCategoryChange = (value: string) : void => {
    setCategory(value);
    setSubCategory(""); // reset subcategory on category change
  };
  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center gap-4 mt-6 mb-8">
      <Card className="w-[550px] space-y-4">
        <CardHeader className="">
          <CardTitle className="">Edit project</CardTitle>
          <CardDescription className="">Update Your Project.</CardDescription>
        </CardHeader>
        <CardContent className="">
          <form className="space-y-4">
            <div className="space-y-2 relative">
              <Label className="">Image</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-w-full h-[200px] rounded-md" />
              ) : (
                <>
                  <RxCrossCircled className="absolute top-6 right-1 cursor-pointer text-xl text-red-500 z-70" />
                  <div className="w-full h-[200px] rounded-md overflow-hidden relative">
                    {previewNewCover && (
                      <Image
                        alt=""
                        src={previewNewCover}
                        fill
                        className="object-cover rounded-md"
                      />
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="space-y-2">
              <Label className="">Title</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Input
                  type="text"
                  className=""
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  placeholder="e.g. JavaScript Course"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="">Description</Label>
              <div className="min-h-[150px]">
                <Tiptap description={description} onChange={setDescription} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="">Video Upload</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full md:w-[500px] h-[30px] rounded-md" />
              ) : isVideoUploading ? (
                <Skeleton className="w-[500px] h-[30px] rounded-md" />
              ) : (
                <>
                  <Input
                    className=""
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                  />
                  {selectedVideoName && (
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedVideoName}
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="space-y-2">
              <Label className="">Cover Image Upload</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : isImageUploading ? (
                <Skeleton className="full h-[30px] rounded-md" />
              ) : (
                <>
                  <Input
                   
                    className=""
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  {selectedImageName && (
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedImageName}
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="space-y-2">
              <Label className="">Price</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Input
                  type="number" className=""
                  value={price}
                  onChange={(e : React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
                  placeholder="e.g. ₹ 69.99"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label className="">Discount</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Input
                  type="text"
                  className=""
                  value={discount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscount(e.target.value)}
                  placeholder="e.g. '%' 10,20,40 "
                />
              )}
            </div>
            <div className="space-y-2">
              <Label className="">Category</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Select value={category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={category || "Select a  category"}
                    />
                  </SelectTrigger>
                  <SelectContent className="">
                    {categories.map((cat) => (
                      <SelectItem className="" key={cat} value={cat}>
                        {cat
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label className="">Subcategory</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Select value={subCategory} onValueChange={setSubCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={subCategory || "Select a subcategory"}
                    />
                  </SelectTrigger>
                  <SelectContent className="">
                    {(categoryToSubcategories[category as keyof typeof categoryToSubcategories] || []).map((sub) => (
                      <SelectItem className="" key={sub} value={sub}>
                        {sub
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label className="">Tags</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Input
                  type="text"
                  className=""
                  value={tags.join(", ")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTags(
                      e.target.value.split(",").map((item: string) => item.trim())
                    )
                  }
                  placeholder="e.g. JavaScript Basics, React, Next.js"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label className="">Duration (hh:mm:ss or auto from video)</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Input
                  type="text"
                  className=""
                  value={durationInput}
                  onChange={handleManualDurationChange}
                  placeholder="e.g. 01:30:00"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label className="">Level</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Select
                  value={level.charAt(0).toUpperCase() + level.slice(1)}
                  onValueChange={setLevel}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        level.charAt(0).toUpperCase() + level.slice(1) ||
                        "Select a level"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="">
                    {["Beginner", "Intermediate", "Expert"].map((lvl) => (
                      <SelectItem className="" key={lvl} value={lvl}>
                        {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label className="">What you will learn</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Input
                  type="text"
                  className=""
                  value={whatYouWillLearn.join(", ")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setWhatYouWillLearn(
                      e.target.value.split(",").map((item) => item.trim())
                    )
                  }
                  placeholder="e.g. Variables, loops, functions"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="">Requirements</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Input
                  type="text"
                  className=""
                  value={requirements.join(", ")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRequirements(
                      e.target.value.split(",").map((item: string) => item.trim())
                    )
                  }
                  placeholder="e.g. Html, CSS, JavaScript"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label className="">Language</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={`${
                        language.charAt(0).toUpperCase() + language.slice(1) ||
                        "Select a language"
                      }`}
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {[
                      "English",
                      "Spanish",
                      "French",
                      "German",
                      "Hindi",
                      "Chinese",
                      "Japanese",
                      "Korean",
                      "Portuguese",
                      "Arabic",
                      "Russian",
                      "Bengali",
                      "Urdu",
                      "Tamil",
                      "Telugu",
                      "Gujarati",
                      "Marathi",
                      "Punjabi",
                      "Malayalam",
                      "Dutch",
                      "Italian",
                      "Swedish",
                      "Turkish",
                      "Vietnamese",
                      "Thai",
                      "Hebrew",
                      "Polish",
                      "Ukrainian",
                      "Czech",
                      "Romanian",
                      "Greek",
                      "Hungarian",
                      "Finnish",
                      "Slovak",
                      "Norwegian",
                      "Danish",
                      "Croatian",
                      "Serbian",
                      "Bulgarian",
                      "Estonian",
                      "Latvian",
                      "Lithuanian",
                    ].map((lang) => (
                      <SelectItem className="" key={lang} value={lang.toLowerCase()}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Label className="my-4 mt-6">Topics to be covered</Label>

            {topics?.map((item, index) => (
              <div key={index} className="mb-4 space-y-2 relative">
                {}
                {isLoadingCourse ? (
                  <Skeleton className="w-full h-[30px] rounded-md" />
                ) : (
                  topics.length > 1 &&
                  index !== 0 && (
                    <div
                      className="absolute right-2 -top-0 text-lg cursor-pointer flex items-center"
                      onClick={() => removeTopic(index)}
                    >
                      <RxCross2 />
                    </div>
                  )
                )}
                <div className="space-y-2">
                  <Label className="">Topic</Label>
                  {isLoadingCourse ? (
                    <Skeleton className="w-full rounded-md h-[30px]" />
                  ) : (
                    <Input
                      type="text"
                      className=""
                      value={item.topic}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleTopicChange({index, field:"topic", value:e.target.value})
                      }
                      placeholder="e.g. JavaScript Basics"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="">Description</Label>
                  {isLoadingCourse ? (
                    <Skeleton className="w-full h-[30px] rounded-md" />
                  ) : (
                    <Input
                      className=""
                      type="text"
                      value={item.description}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleTopicChange({index, field:"description", value:e.target.value})
                      }
                      placeholder="e.g. Variables, loops, functions"
                    />
                  )}
                </div>
              </div>
            ))}
            {isLoadingCourse ? (
              <Skeleton className="h-10 px-4 w-[90px] rounded-md" />
            ) : (
              <Button className="" size="" type="button" onClick={addTopic} variant="outline">
                + Add Topics
              </Button>
            )}
            <Label className={"my-4"}>Lessons</Label>
            {lessons?.map((item, index) => (
              <div key={index} className="mb-4 space-y-2 relative">
                {lessons.length > 1 && index !== 0 && (
                  <div
                    className="absolute right-2 -top-0 text-lg cursor-pointer flex items-center"
                    onClick={() => removeLesson(index)}
                  >
                    <RxCross2 />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="">Name</Label>
                  {isLoadingCourse ? (
                    <Skeleton className=" h-[30px] rounded-md w-full" />
                  ) : (
                    <Input
                      type="text"
                      className=""
                      value={item.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleLessonChange({index, field:"name", value:e.target.value})
                      }
                      placeholder="e.g. JavaScript Basics"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="">Description</Label>
                  {isLoadingCourse ? (
                    <Skeleton className="h-[30px] w-full rounded-md" />
                  ) : (
                    <Input
                      type="text"
                      className=""
                      value={item.description}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleLessonChange({index, field:"description", value:e.target.value})
                      }
                      placeholder="e.g. Variables, loops, functions"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  {isLoadingCourse ? (
                    <Skeleton className="h-[500px] w-full rounded-md" />
                  ) : (
                    <video width="600" controls>
                      <source
                        src={previewLessonVideo[index]}
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="">video</Label>
                  {isLoadingCourse ? (
                    <Skeleton className="w-full md:w-[500px] h-[30px] rounded-md" />
                  ) : isLessonVideoUploading[index] === true ? (
                    <Skeleton className="w-full md:w-[500px] h-[30px] rounded-md" />
                  ) : (
                    <>
                      <Input
                        className=""
                        type="file"
                        accept="video/*"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          if (!e.target.files) return;
                          const file = e.target.files[0];
                          if (file) {
                            handleLessonVideoUpload(index, file);
                          }
                        }}
                        placeholder="e.g. video/*"
                      />
                      {selectedLessonVideoNames[index] && (
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedLessonVideoNames[index]}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="">Duration</Label>
                  {isLoadingCourse ? (
                    <Skeleton className="w-full h-[30px] rounded-md" />
                  ) : (
                    <Input
                     className=""
                      type="text"
                      value={item.duration}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleLessonChange({index, field:"duration", value:e.target.value})
                      }
                      placeholder="e.g. Variables, loops, functions"
                    />
                  )}
                </div>
              </div>
            ))}
            {isLoadingCourse ? (
              <Skeleton className="h-10 px-4 w-[90px] rounded-md" />
            ) : (
              <Button className="" size="" type="button" onClick={addLesson} variant="outline">
                + Add Lessons
              </Button>
            )}
            <Label className={"my-4"}>Faqs</Label>

            {faq?.map((item, index) => (
              <div key={index} className="mb-4 space-y-2 relative ">
                {faq.length > 1 && index !== 0 && (
                  <div
                    className="absolute right-2 -top-0 text-lg cursor-pointer flex items-center "
                    onClick={() => removeFaq(index)}
                  >
                    <RxCross2 />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="">Name</Label>
                  {isLoadingCourse ? (
                    <Skeleton className="w-full h-[30px] rounded-md" />
                  ) : (
                    <Input
                      type="text"
                      className=""
                      value={item.question}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFaqChange({index, field:"question", value:e.target.value})
                      }
                      placeholder="e.g. what is async and await ?"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="">Answer</Label>
                  {isLoadingCourse ? (
                    <Skeleton className="w-full h-[30px] rounded-md" />
                  ) : (
                    <Input
                      type=""
                      className=""
                      value={item.answer}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFaqChange({index, field:"answer",value:e.target.value})
                      }
                      placeholder="e.g. async is responsible for executing code asynchronously like promises and await is used to wait for a promise to resolve before executing the next line of code."
                    />
                  )}
                </div>
              </div>
            ))}
            {isLoadingCourse ? (
              <Skeleton className="h-10 px-4 w-[90px] rounded-md" />
            ) : (
              <Button className="" size="" type="button" onClick={addFaq} variant="outline">
                + Add Faqs
              </Button>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          {isLoadingCourse ? (
            <div className="w-full flex justify-between">
              <Skeleton className="h-10 px-4 w-[90px] rounded-md" />
              <Skeleton className="h-10 px-4 w-[90px] rounded-md" />
            </div>
          ) : (
            <>
              <Button className="" size="" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button className="" size="" variant="" onClick={() => handleUpdateCourse()}>Update</Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default EditCoursePage;
