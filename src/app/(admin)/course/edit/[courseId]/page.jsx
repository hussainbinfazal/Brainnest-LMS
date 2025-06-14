"use client";
import React, { useState, useEffect ,useCallback} from "react";
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
import { set } from "mongoose";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Image from "next/image";
import { RxCrossCircled } from "react-icons/rx";
import Tiptap  from "./components/Tiptap.jsx";
import useAuthRedirect from "@/hooks/useAuthRedirect";
const page = () => {
  const [selectedLessonVideoNames, setSelectedLessonVideoNames] = useState(
    new Set()
  );
  const [isLessonVideoUploading, setIsLessonVideoUploading] = useState({});
  const [topics, setTopics] = useState([{ topic: "", description: "" }]);
  const [title, setTitle] = useState("");
  const [lessons, setLessons] = useState([
    { name: "", description: "", video: "", duration: "" },
  ]);
  const [price, setPrice] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState([]);
  const [discount, setDiscount] = useState("");
  const [duration, setDuration] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [video, setVideo] = useState("");
  const [whatYouWillLearn, setWhatYouWillLearn] = useState("");
  const [requirements, setRequirements] = useState("");
  const [certificate, setCertificate] = useState("");
  const [level, setLevel] = useState("");
  const [language, setLanguage] = useState("");
  const [status, setStatus] = useState("");
  const [faq, setFaq] = useState([{ question: "", answer: "" }]);
  const [tags, setTags] = useState([]);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [selectedVideoName, setSelectedVideoName] = useState("");
  const [selectedImageName, setSelectedImageName] = useState("");
  const [course, setCourse] = useState();
  const [loading, setLoading] = useState(false);
  const { courseId } = useParams();
  const authUser = useAuthStore((state) => state.authUser);
  const [addNewImage, setAddNewImage] = useState(false);
  const [previewNewCover, setPreviewNewCover] = useState("");
  const [previewLessonVideo, setPreviewLessonVideo] = useState([]);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [description, setDescription] = useState("");
const isAuthChecked = useAuthRedirect({redirectIfUnauthenticated: true , redirectIfAuthenticated: false, redirectIfNotInstructor: true, interval: 3000,});
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
      setPreviewLessonVideo(courseData?.lessons?.map((lesson) => lesson.video));
      setDescription(courseData.description);
      console.log("THis is the course fetched from the DB ", course);
    } catch (error) {
    } finally {
      setIsLoadingCourse(false);
    }
  },[]);
  const handleSetDataInForm = () => {
    if (course) {
    }
  };

  // useEffect(() => {
  //   if (course) {
  //   }
  // }, [course, category, subCategory, language]);
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
  const handleTopicChange = (index, field, value) => {
    const newTopics = [...topics];
    newTopics[index][field] = value;
    setTopics(newTopics);
  };

  const handleFaqChange = (index, field, value) => {
    const newFaq = [...faq];
    newFaq[index][field] = value;
    setFaq(newFaq);
  };

  const handleLessonChange = (index, field, value) => {
    const newLessons = [...lessons];
    newLessons[index][field] = value;
    setLessons(newLessons);
  };
  const addTopic = () => {
    setTopics([...topics, { topic: "", description: "" }]);
  };
  const removeTopic = (index) => {
    const newTopics = [...topics];
    newTopics.splice(index, 1);
    setTopics(newTopics);
  };

  const addLesson = () => {
    setLessons([
      ...lessons,
      { duration: "", description: "", video: "", name: "" },
    ]);
    setIsLessonVideoUploading((prev) => ({
      ...prev,
      [lessons.length]: false, // New lesson at the last index
    }));
  };

  const removeLesson = (index) => {
    const newLessons = [...lessons];
    newLessons.splice(index, 1);
    setLessons(newLessons);
  };
  const addFaq = () => {
    setFaq([...faq, { question: "", answer: "" }]);
  };
  const removeFaq = (index) => {
    const newFaq = [...faq];
    newFaq.splice(index, 1);
    setFaq(newFaq);
  };

  const handleManualDurationChange = (e) => {
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

  const handleVideoUpload = async (e) => {
    try {
      setIsVideoUploading(true);
      const file = e.target.files[0];
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
    } catch (error) {
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleImageUpload = async (e) => {
    try {
      setIsImageUploading(true);
      const file = e.target.files[0];
      setSelectedImageName(file.name);
      const url = await handleUpload(file);
      setCoverImage(url);
      setPreviewNewCover(url);
    } catch (error) {
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
      subCategory === "" ||
      !whatYouWillLearn ||
      whatYouWillLearn === "" ||
      !requirements ||
      requirements === "" ||
      !level ||
      level === "" ||
      !language ||
      language === "" ||
      !tags ||
      tags === "" ||
      !price ||
      price === "" ||
      
      !lessons ||
      lessons === "" ||
      !topics ||
      topics === "" ||
      !faq ||
      faq === "" ||
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
        "All fields are required",
        title,
        description,
        price,
        category,
        subCategory,
        faq,
        requirements,
        whatYouWillLearn,
        video,
        lessons,
        coverImage,
        
        duration,
        language,
        level,
        certificate,
        tags
      );
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
        duration: parseInt(duration),
        video,
        whatYouWillLearn:
          whatYouWillLearn,
        requirements:
          requirements,
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
    } catch (error) {
    }
  };
  const handleLessonVideoUpload = async (index, file) => {
    
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
  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/upload", formData);


      return response.data.filePath;
    } catch (error) {
    }
  };

  useEffect(() => {
    // Initialize states for each lesson
    const initialUploadingState = {};
    const initialVideoNames = {};

    lessons.forEach((_, index) => {
      initialUploadingState[index] = false;
      initialVideoNames[index] = "";
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
  const handleCategoryChange = (value) => {
    setCategory(value);
    setSubCategory(""); // reset subcategory on category change
  };
  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center gap-4 mt-6 mb-8">
      <Card className="w-[550px] space-y-4">
        <CardHeader>
          <CardTitle>Edit project</CardTitle>
          <CardDescription>Update Your Project.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2 relative">
              <Label>Image</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-w-full h-[200px] rounded-md" />
              ) : (
                <>
                  <RxCrossCircled className="absolute top-6 right-1 cursor-pointer text-xl text-red-500 z-70" />
                  <div className="w-full h-[200px] rounded-md overflow-hidden relative">
                    {previewNewCover && (
                      <Image
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
              <Label>Title</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. JavaScript Course"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <div className="min-h-[150px]">
                <Tiptap description={description} onChange={setDescription} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Video Upload</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : isVideoUploading ? (
                <Skeleton className="w-[500px] h-[30px] rounded-md" />
              ) : (
                <>
                  <Input
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
              <Label>Cover Image Upload</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : isImageUploading ? (
                <Skeleton className="full h-[30px] rounded-md" />
              ) : (
                <>
                  <Input
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
              <Label>Price</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. ₹ 69.99"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Discount</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Input
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="e.g. '%' 10,20,40 "
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Select value={category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={category || "Select a  category"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
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
              <Label>Subcategory</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Select value={subCategory} onValueChange={setSubCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={subCategory || "Select a subcategory"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(categoryToSubcategories[category] || []).map((sub) => (
                      <SelectItem key={sub} value={sub}>
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
              <Label>Tags</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Input
                  value={tags.join(", ")}
                  onChange={(e) =>
                    setTags(e.target.value.split(",").map(item => item.trim()))
                  }
                  placeholder="e.g. JavaScript Basics, React, Next.js"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Duration (hh:mm:ss or auto from video)</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Input
                  value={durationInput}
                  onChange={handleManualDurationChange}
                  placeholder="e.g. 01:30:00"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
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
                  <SelectContent>
                    {["Beginner", "Intermediate", "Expert"].map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>What you will learn</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Input
                  value={whatYouWillLearn.join(", ")}
                  onChange={(e) => setWhatYouWillLearn(e.target.value.split(",").map(item => item.trim()))}
                  placeholder="e.g. Variables, loops, functions"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Requirements</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Input
                  value={requirements.join(", ")}
                  onChange={(e) => setRequirements(e.target.value.split(",").map(item => item.trim()))}
                  placeholder="e.g. Html, CSS, JavaScript"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Select
                  value={language}
                  onValueChange={setLanguage}
                >
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
                      <SelectItem key={lang} value={lang.toLowerCase()}>
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
                  <Label>Topic</Label>
                  {isLoadingCourse ? (
                    <Skeleton className="w-full rounded-md h-[30px]" />
                  ) : (
                    <Input
                      value={item.topic}
                      onChange={(e) =>
                        handleTopicChange(index, "topic", e.target.value)
                      }
                      placeholder="e.g. JavaScript Basics"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  {isLoadingCourse ? (
                    <Skeleton className="w-full h-[30px] rounded-md" />
                  ) : (
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        handleTopicChange(index, "description", e.target.value)
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
              <Button type="button" onClick={addTopic} variant="outline">
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
                  <Label>Name</Label>
                  {isLoadingCourse ? (
                    <Skeleton className=" h-[30px] rounded-md w-full" />
                  ) : (
                    <Input
                      value={item.name}
                      onChange={(e) =>
                        handleLessonChange(index, "name", e.target.value)
                      }
                      placeholder="e.g. JavaScript Basics"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  {isLoadingCourse ? (
                    <Skeleton className="h-[30px] w-full rounded-md" />
                  ) : (
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        handleLessonChange(index, "description", e.target.value)
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
                  <Label>video</Label>
                  {isLoadingCourse ? (
                    <Skeleton className="w-full h-[30px] rounded-md" />
                  ) : isLessonVideoUploading[index] === true ? (
                    <Skeleton className="w-[500px] h-[30px] rounded-md" />
                  ) : (
                    <>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
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
                  <Label>Duration</Label>
                  {isLoadingCourse ? (
                    <Skeleton className="w-full h-[30px] rounded-md" />
                  ) : (
                    <Input
                      value={item.duration}
                      onChange={(e) =>
                        handleLessonChange(index, "duration", e.target.value)
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
              <Button type="button" onClick={addLesson} variant="outline">
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
                  <Label>Name</Label>
                  {isLoadingCourse ? (
                    <Skeleton className="w-full h-[30px] rounded-md" />
                  ) : (
                    <Input
                      value={item.question}
                      onChange={(e) =>
                        handleFaqChange(index, "question", e.target.value)
                      }
                      placeholder="e.g. what is async and await ?"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Answer</Label>
                  {isLoadingCourse ? (
                    <Skeleton className="w-full h-[30px] rounded-md" />
                  ) : (
                    <Input
                      value={item.answer}
                      onChange={(e) =>
                        handleFaqChange(index, "answer", e.target.value)
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
              <Button type="button" onClick={addFaq} variant="outline">
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
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateCourse()}>Update</Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default page;
