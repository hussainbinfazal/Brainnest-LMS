"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
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
  const isAuthChecked = useAuthRedirect({
    redirectIfUnauthenticated: true,
    redirectIfAuthenticated: false,
    redirectIfNotInstructor: true,
    interval: 3000,
  });
  const [price, setPrice] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("");
  const [subCategories, setSubCategories] = useState("");
  const [discount, setDiscount] = useState("");
  const [duration, setDuration] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [video, setVideo] = useState("");
  const [whatYouWillLearn, setWhatYouWillLearn] = useState([]);
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
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
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
    setSubCategories(""); // reset subCategories on category change
  };
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
      return alert(error.message);
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
    } catch (error) {
      return alert(error.message);
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleCreateCourse = async () => {
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
    if (!tags || tags.trim() === "") validationErrors.push("Tags");
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
        tags: tags.split(",").map((tag) => tag.trim()),
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
    } catch (error) {
      setLoading(false);
      return toast.error(error?.response?.data?.message);
    } finally {
      setLoading(false);
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

      // console.log("Uploaded to Cloudinary:", response.data.filePath);

      return response.data.filePath;
    } catch (error) {}
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

  function convertToTotalHours(timeStr) {
    const parts = timeStr.toString().split(":").map(Number);

    let hours = 0;
    if (parts.length === 3) {
      hours = parts[0] + parts[1] / 60 + parts[2] / 3600;
    } else if (parts.length === 2) {
      hours = parts[0] / 60 + parts[1] / 3600;
    } else if (parts.length === 1) {
      hours = parts[0] / 3600;
    }

    return parseFloat(hours.toFixed(2)); // rounded to 2 decimals
  }

  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center gap-4 mt-6 mb-8">
      <Card className="w-[350px] md:w-[550px] space-y-4">
        <CardHeader>
          <CardTitle>Create project</CardTitle>
          <CardDescription>
            Deploy your new course in one-click.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. JavaScript Course"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <div className="min-h-[150px]">
                <Tiptap description={description} onChange={setDescription} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Video Upload</Label>
              {isVideoUploading ? (
                <Skeleton className="w-full md:w-[500px] h-[30px] rounded-md" />
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
              {isImageUploading ? (
                <Skeleton className="w-full md:w-[500px] h-[30px] rounded-md" />
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
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. ₹ 69.99"
              />
            </div>
            <div className="space-y-2">
              <Label>Discount</Label>
              <Input
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="e.g. '%' 10,20,40 "
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
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
            </div>
            <div className="space-y-2">
              <Label>SubCategory</Label>
              <Select
                value={subCategories}
                onValueChange={setSubCategories}
                disabled={!category}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a SubCategory" />
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
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                value={tags}
                onChange={(e) =>
                  setTags(e.target.value.toString().split(",").join(","))
                }
                placeholder="e.g. JavaScript Basics, React, Next.js"
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (hh:mm:ss or auto from video)</Label>
              <Input
                value={durationInput}
                onChange={handleManualDurationChange}
                placeholder="e.g. 01:30:00"
              />
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a level" />
                </SelectTrigger>
                <SelectContent>
                  {["Beginner", "Intermediate", "Expert"].map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>
                      {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>What you will learn</Label>
              <Input
                value={whatYouWillLearn.join(", ")}
                onChange={(e) =>
                  setWhatYouWillLearn(
                    e.target.value.split(",").map((item) => item.trim())
                  )
                }
                placeholder="e.g. Variables, loops, functions"
              />
            </div>

            <div className="space-y-2">
              <Label>Requirements</Label>
              <Input
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="e.g. Html, CSS, JavaScript"
              />
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
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
                    <SelectItem key={lang} value={lang.toLowerCase()}>
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
                  <Label>Topic</Label>
                  <Input
                    value={item.topic}
                    onChange={(e) =>
                      handleTopicChange(index, "topic", e.target.value)
                    }
                    placeholder="e.g. JavaScript Basics"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      handleTopicChange(index, "description", e.target.value)
                    }
                    placeholder="e.g. Variables, loops, functions"
                  />
                </div>
              </div>
            ))}
            <Button type="button" onClick={addTopic} variant="outline">
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
                  <Label>Name</Label>
                  <Input
                    value={item.name}
                    onChange={(e) =>
                      handleLessonChange(index, "name", e.target.value)
                    }
                    placeholder="e.g. JavaScript Basics"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      handleLessonChange(index, "description", e.target.value)
                    }
                    placeholder="e.g. Variables, loops, functions"
                  />
                </div>
                <div className="space-y-2">
                  <Label>video</Label>
                  {isLessonVideoUploading[index] === true ? (
                    <Skeleton className="w-full md:w-[500px] h-[30px] rounded-md" />
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
                  <Input
                    value={item.duration}
                    onChange={(e) =>
                      handleLessonChange(index, "duration", e.target.value)
                    }
                    placeholder="e.g. Variables, loops, functions"
                  />
                </div>
              </div>
            ))}
            <Button type="button" onClick={addLesson} variant="outline">
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
                  <Label>Name</Label>
                  <Input
                    value={item.question}
                    onChange={(e) =>
                      handleFaqChange(index, "question", e.target.value)
                    }
                    placeholder="e.g. what is async and await ?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Answer</Label>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      handleFaqChange(index, "answer", e.target.value)
                    }
                    placeholder="e.g. async is responsible for executing code asynchronously like promises and await is used to wait for a promise to resolve before executing the next line of code."
                  />
                </div>
              </div>
            ))}
            <Button type="button" onClick={addFaq} variant="outline">
              + Add Faqs
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button onClick={() => handleCreateCourse()}>
            {loading ? "Creating..." : "Create Course"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default page;
