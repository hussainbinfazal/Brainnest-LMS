"use client";

import React, { useState, useEffect } from "react";
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
import Tiptap from "@/components/Tiptap";
import { Faq, Lesson, Topic } from "@/types/client";



const CreateCoursePage: React.FC = () => {
  const [selectedLessonVideoNames, setSelectedLessonVideoNames] = useState<string[]>(
    [],
  );
  const [isLessonVideoUploading, setIsLessonVideoUploading] = useState< Record<string, boolean>>({});
  const [topics, setTopics] = useState<{ topic: string; description: string }[]>([{ topic: "", description: "" }]);
  const [title, setTitle] = useState<string>("");
  const [lessons, setLessons] = useState< { name: string; description: string; video: string; duration: string }[]>([
    { name: "", description: "", video: "", duration: "" },
  ]);
  
  const [price, setPrice] = useState<string>("");
  const [coverImage, setCoverImage] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [subCategories, setSubCategories] = useState<string>("");
  const [discount, setDiscount] = useState<string>("");
  const [duration, setDuration] = useState<string |  number>("");
  const [durationInput, setDurationInput] = useState<string | null>("");
  const [video, setVideo] = useState<string>("");
  const [whatYouWillLearn, setWhatYouWillLearn] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string>("");
  const [certificate, setCertificate] = useState<string | boolean>("");
  const [level, setLevel] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [faq, setFaq] = useState< { question: string; answer: string }[]>([{ question: "", answer: "" }]);
  const [tags, setTags] = useState<string[]>([]);
  const [isVideoUploading, setIsVideoUploading] = useState<boolean>(false);
  const [isImageUploading, setIsImageUploading] = useState<boolean>(false);
  const [selectedVideoName, setSelectedVideoName] = useState<string>("");
  const [selectedImageName, setSelectedImageName] = useState<string>("");
  const [description, setDescription] = useState< string>("");
  const [loading, setLoading] = useState<boolean>(false);
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
  type CategoryKeys = keyof typeof categoryToSubcategories;
  const handleCategoryChange = (value: string) : void => {
    setCategory(value);
    setSubCategories(""); // reset subCategories on category change
  };
  const router = useRouter();
  const handleTopicChange = (index: number, field: keyof Topic, value:Topic[typeof field] ): void => {
    const newTopics = [...topics];
    newTopics[index][field] = value;
    setTopics(newTopics);
  };

  const handleFaqChange = (index: number, field: keyof Faq, value: Faq[typeof field]) : void => {
    const newFaq = [...faq];
    newFaq[index][field] = value;
    setFaq(newFaq);
  };

  const handleLessonChange = (index: number, field: keyof Lesson, value: Lesson[typeof field]) : void => {
    const newLessons = [...lessons];
    newLessons[index][field] = value;
    setLessons(newLessons);
  };
  const addTopic = (): void => {
    setTopics([...topics, { topic: "", description: "" }]);
  };
  const removeTopic = (index: number): void => {
    const newTopics = [...topics];
    newTopics.splice(index, 1);
    setTopics(newTopics);
  };

  const addLesson = (): void => {
    setLessons([
      ...lessons,
      { duration: "", description: "", video: "", name: "" },
    ]);
    setIsLessonVideoUploading((prev) => ({
      ...prev,
      [lessons.length]: false, // New lesson at the last index
    }));
  };

  const removeLesson = (index: number): void => {
    const newLessons = [...lessons];
    newLessons.splice(index, 1);
    setLessons(newLessons);
  };
  const addFaq = (): void => {
    setFaq([...faq, { question: "", answer: "" }]);
  };
  const removeFaq = (index: number): void => {
    const newFaq = [...faq];
    newFaq.splice(index, 1);
    setFaq(newFaq);
  };

  const handleManualDurationChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const input = e.target.value;
    setDurationInput(input);

    const parts = input.split(":").map(Number);
    let totalSeconds: number | string = 0;

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
      if(!target.files) throw new Error("No file selected");
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
    } catch (error: any) {
      return alert(error.message);
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleImageUpload = async (e : React.ChangeEvent<HTMLInputElement>) : Promise<void> => {
    try {
      setIsImageUploading(true);
      const target  = e.target as HTMLInputElement;
      if(!target.files) throw new Error("No file selected");
      const file = target.files[0];
      setSelectedImageName(file.name);
      const url = await handleUpload(file);
      setCoverImage(url);
    } catch (error: any) {
      return alert(error.message);
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleCreateCourse: React.FormEventHandler = async () : Promise<void | string | number> => {
    setLoading(true);
    const validationErrors = [];

    if (!title || title.trim() === "") validationErrors.push("Title");
    if (!description || description.trim() === "")
      validationErrors.push("Description");
    if (!coverImage || coverImage.trim() === "")
      validationErrors.push("Cover Image");
    if (!category || category.trim() === "") validationErrors.push("Category");
    if (!subCategories || subCategories.trim() === "")
      validationErrors.push("Sub Categories");
    if (
      !whatYouWillLearn ||
      whatYouWillLearn.length === 0 ||
      whatYouWillLearn.every((item) => !item.trim())
    )
      validationErrors.push("What You Will Learn");
    if (!requirements || requirements.trim() === "")
      validationErrors.push("Requirements");
    if (!level || level.trim() === "") validationErrors.push("Level");
    if (!language || language.trim() === "") validationErrors.push("Language");
    // if (!tags || tags.trim() === "") validationErrors.push("Tags");
    if (!tags || tags.length === 0 || tags.every(tag => !tag.trim())) {
    validationErrors.push("Tags");
    }
    if (!price || price.trim() === "") validationErrors.push("Price");
    if (!video || video.trim() === "") validationErrors.push("Video");
    if (!duration || duration === "") validationErrors.push("Duration");

    // Validate topics array
    if (
      !topics ||
      topics.length === 0 ||
      topics.some((topic) => !topic.topic.trim() || !topic.description.trim())
    ) {
      validationErrors.push(
        "Topics (all topics must have title and description)"
      );
    }

    // Validate lessons array
    if (
      !lessons ||
      lessons.length === 0 ||
      lessons.some(
        (lesson) =>
          !lesson.name.trim() ||
          !lesson.description.trim() ||
          !lesson.video.trim()
      )
    ) {
      validationErrors.push(
        "Lessons (all lessons must have name, description, and video)"
      );
    }

    // Validate FAQ array
    if (
      !faq ||
      faq.length === 0 ||
      faq.some((item) => !item.question.trim() || !item.answer.trim())
    ) {
      validationErrors.push("FAQ (all FAQs must have question and answer)");
    }

    if (validationErrors.length > 0) {
      setLoading(false);
      return alert(
        `Please fill in the following required fields:\n• ${validationErrors.join(
          "\n• "
        )}`
      );
    }

    try {
      const plainDescription = description.replace(/<[^>]*>/g, "");
      const formattedTopics = topics.map((topic) => ({
        topicTitle: topic.topic,
        topicDescription: topic.description,
      }));
      const courseData = {
        title,
        price,
        coverImage,
        category: {
          name: category,
          subCategories: [subCategories],
        },
        subCategories,
        discount: parseFloat(discount) || 0,
        duration: convertToTotalHours(duration),
        video,
        whatYouWillLearn: whatYouWillLearn,

        requirements: requirements
          .split(",")
          .map((requirement) => requirement.trim()),
        level: level.toLowerCase(),
        language,
        status: "draft",
        tags: tags.map((tag) => tag.trim()),
        description: plainDescription,
        topics,
        lessons,
        faq,
        certificate: certificate === "true" || certificate === true,
      };
      const response = await axios.post("/api/admin/course/create", courseData);
      toast.success("Course created successfully");
      router.push("/course/manage");
      setLoading(false);
    } catch (error : any) {
      setLoading(false);
      return toast.error(error?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };
  const handleLessonVideoUpload = async (index : number, file : File)  : Promise<void> => {
    setIsLessonVideoUploading((prev) => {
      const newState = { ...prev }; // Create a shallow copy
      newState[index] = true; // Set the specific index to true
      return newState;
    });

    try {
      setSelectedLessonVideoNames((prev) => {
        const updated =  [...prev];
        updated[index] = file.name;
        return updated
      });

      const videoElement = document.createElement("video");
      videoElement.preload = "metadata";

      videoElement.onloadedmetadata = async () : Promise<void> => {
        window.URL.revokeObjectURL(videoElement.src);

        const seconds = Math.floor(videoElement.duration);

        const updatedLessons = [...lessons];
        const url = await handleUpload(file);
        setIsLessonVideoUploading((prev) => {
          const newState = { ...prev }; 
          newState[index] = false; // Set the specific index to false
          return newState;
        });

        updatedLessons[index].video = url;
        const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const secs = String(seconds % 60).padStart(2, "0");
        updatedLessons[index].duration = `${hrs}:${mins}:${secs}`; // store raw seconds

        setLessons(updatedLessons);
      };

      videoElement.src = URL.createObjectURL(file);
    } catch (error : any) {
    } finally {
    }
  };
  const handleUpload = async (file : File) : Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/upload", formData);

      // console.log("Uploaded to Cloudinary:", response.data.filePath);

      return response.data.filePath;
    } catch (error: any) {
      console.error("Error uploading to Cloudinary:", error);
      throw new Error("Upload failed");
    }
  };

  useEffect(() => {
    // Initialize states for each lesson
    const initialUploadingState: Record<number, boolean> = {};
    const initialVideoNames = lessons.map(() => "");

    lessons.forEach((_, index) => {
      initialUploadingState[index] = false;
    });

    setIsLessonVideoUploading(initialUploadingState);
    setSelectedLessonVideoNames(initialVideoNames);
  }, []);

  

  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center gap-4 mt-6 mb-8">
      <Card className="w-[350px] md:w-[550px] space-y-4">
        <CardHeader className="">
          <CardTitle className="">Create project</CardTitle>
          <CardDescription className="">
            Deploy your new course in one-click.
          </CardDescription>
        </CardHeader>
        <CardContent className="">
          <form className="space-y-4">
            <div className="space-y-2">
              <Label className="">Title</Label>
              <Input
                type="text"
                className=""
                value={title}
                onChange={(e : React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder="e.g. JavaScript Course"
              />
            </div>
            <div className="space-y-2">
              <Label className="">Description</Label>
              <div className="min-h-[150px]">
                <Tiptap description={description} onChange={setDescription} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="">Video Upload</Label>
              {isVideoUploading ? (
                <Skeleton className="w-full md:w-[500px] h-[30px] rounded-md" />
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
              {isImageUploading ? (
                <Skeleton className="w-full md:w-[500px] h-[30px] rounded-md" />
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
              <Input
                className=""
                type="text"
                value={price}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
                placeholder="e.g. ₹ 69.99"
              />
            </div>
            <div className="space-y-2">
              <Label className="">Discount</Label>
              <Input
              className=""
                type="text"
                value={discount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscount(e.target.value)}
                placeholder="e.g. '%' 10,20,40 "
              />
            </div>
            <div className="space-y-2">
              <Label className="">Category</Label>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
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
            </div>
            <div className="space-y-2">
              <Label className="">SubCategory</Label>
              <Select
                value={subCategories}
                onValueChange={setSubCategories}
                disabled={!category}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a SubCategory" />
                </SelectTrigger>
                <SelectContent className="">
                  {(categoryToSubcategories[category as keyof typeof categoryToSubcategories] || []).map((sub: string) => (
                    <SelectItem className="" key={sub} value={sub}>
                      {sub
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="">Tags</Label>
              <Input
              className=""
                type="text"
                value={tags.join(", ")}
                onChange={(e : React.ChangeEvent<HTMLInputElement>) =>
                  // setTags(e.target.value.toString().split(",").join(","))
                  setTags(e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))
                }
                placeholder="e.g. JavaScript Basics, React, Next.js"
              />
            </div>
            <div className="space-y-2">
              <Label className="">Duration (hh:mm:ss or auto from video)</Label>
              <Input
                className=""
                type="text"
                value={durationInput}
                onChange={handleManualDurationChange}
                placeholder="e.g. 01:30:00"
              />
            </div>
            <div className="space-y-2">
              <Label className="">Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a level" />
                </SelectTrigger>
                <SelectContent className="">
                  {["Beginner", "Intermediate", "Expert"].map((lvl) => (
                    <SelectItem className="" key={lvl} value={lvl}>
                      {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="">What you will learn</Label>
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
            </div>

            <div className="space-y-2">
              <Label className="">Requirements</Label>
              <Input
                className=""
                type="text"
                value={requirements}
                onChange={(e : React.ChangeEvent<HTMLInputElement>) => setRequirements(e.target.value)}
                placeholder="e.g. Html, CSS, JavaScript"
              />
            </div>
            <div className="space-y-2">
              <Label className="">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a language" />
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
            </div>

            <Label className="my-4 mt-6">Topics to be covered</Label>

            {topics.map((item, index) => (
              <div key={index} className="mb-4 space-y-2 relative">
                {}
                {topics.length > 1 && index !== 0 && (
                  <div
                    className="absolute right-2 -top-0 text-lg cursor-pointer flex items-center"
                    onClick={() => removeTopic(index)}
                  >
                    <RxCross2 />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="">Topic</Label>
                  <Input
                    type="text"
                    className=""
                    value={item.topic}
                    onChange={(e : React.ChangeEvent<HTMLInputElement>) =>
                      handleTopicChange(index, "topic", e.target.value)
                    }
                    placeholder="e.g. JavaScript Basics"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="">Description</Label>
                  <Input
                    type="text"
                    className=""
                    value={item.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleTopicChange(index, "description", e.target.value)
                    }
                    placeholder="e.g. Variables, loops, functions"
                  />
                </div>
              </div>
            ))}
            <Button size="" className="" type="button" onClick={addTopic} variant="outline">
              + Add Topics
            </Button>
            <Label className={"my-4"}>Lessons</Label>
            {lessons.map((item, index) => (
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
                  <Input
                    type="text"
                    className=""
                    value={item.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleLessonChange(index, "name", e.target.value)
                    }
                    placeholder="e.g. JavaScript Basics"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="">Description</Label>
                  <Input
                    type="text"
                    className=""
                    value={item.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleLessonChange(index, "description", e.target.value)
                    }
                    placeholder="e.g. Variables, loops, functions"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="">video</Label>
                  {isLessonVideoUploading[index] === true ? (
                    <Skeleton className="w-full md:w-[500px] h-[30px] rounded-md" />
                  ) : (
                    <>
                      <Input
                        className=""
                        type="file"
                        accept="video/*"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const target = e.target as HTMLInputElement;
                          if(!target.files) return;
                          const file = target.files[0];
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
                  <Input
                    type="text"
                    className=""
                    value={item.duration}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleLessonChange(index, "duration", e.target.value)
                    }
                    placeholder="e.g. Variables, loops, functions"
                  />
                </div>
              </div>
            ))}
            <Button size="" className="" type="button" onClick={addLesson} variant="outline">
              + Add Lessons
            </Button>
            <Label className={"my-4"}>Faqs</Label>

            {faq.map((item, index) => (
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
                  <Input
                    type="text"
                    className=""
                    value={item.question}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleFaqChange(index, "question", e.target.value)
                    }
                    placeholder="e.g. what is async and await ?"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="">Answer</Label>
                  <Input
                    type="text"
                    className=""
                    value={item.answer}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleFaqChange(index, "answer", e.target.value)
                    }
                    placeholder="e.g. async is responsible for executing code asynchronously like promises and await is used to wait for a promise to resolve before executing the next line of code."
                  />
                </div>
              </div>
            ))}
            <Button size="" className="" type="button" onClick={addFaq} variant="outline">
              + Add Faqs
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button size="" className="" variant="outline">Cancel</Button>
          <Button variant=""  size="" className="" onClick={handleCreateCourse}>
            {loading ? "Creating..." : "Create Course"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateCoursePage;
