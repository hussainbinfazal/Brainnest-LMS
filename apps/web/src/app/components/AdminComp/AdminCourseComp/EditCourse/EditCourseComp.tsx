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
import { CCourse, CLesson, } from "@/types/client";
import { CUpdateCourseForm } from "@/types/forms/formValidators";
import { useUpload } from "@/utils/hooks/Video/useUpload";
import { useVideoParsing } from "@/utils/hooks/Video/useVideoParsing";
import { clientLogger } from "@/utils/logger/clientLogger";
import { createCourseSchema } from "@/utils/fieldsValidation/Client/courseSchemaValidation";
import { buildCoursePayload } from "@/utils/buildPayload/buildCoursePayload";
import { JSX } from "react/jsx-runtime";

const EditCourseComp = (): JSX.Element => {
  const [form, setForm] = useState<CUpdateCourseForm>({
    title: "",
    description: "",
    price: 0,
    discount: 0,
    coverImage: "",
    category: "",
    subCategory: "",
    level: "",
    language: "",
    tags: [],
    whatYouWillLearn: [],
    requirements: [],
    previewVideo: "",
    sections: [],
    lessons: [],
    topics: [],
    faq: [],
    dripType: "",
    status: "",
    instructorId: "",
    durationInSeconds: 0

  });
  const { uploadFile } = useUpload();
  const { getVideoDuration } = useVideoParsing();

  const [selectedLessonVideoNames, setSelectedLessonVideoNames] = useState<string[]>(
    [],
  );
  const [isLessonVideoUploading, setIsLessonVideoUploading] = useState<{ [key: string]: boolean }>({});

  const [isVideoUploading, setIsVideoUploading] = useState<boolean>(false);
  const [isImageUploading, setIsImageUploading] = useState<boolean>(false);
  const [selectedVideoName, setSelectedVideoName] = useState<string>("");
  const [selectedImageName, setSelectedImageName] = useState<string>("");
  const [course, setCourse] = useState<CCourse>();
  const [loading, setLoading] = useState<boolean>(false);
  const { courseId } = useParams();
  const authUser = useAuthStore((state) => state.authUser);
  const [addNewImage, setAddNewImage] = useState<boolean>(false);
  const [previewNewCover, setPreviewNewCover] = useState<string>("");
  const [previewLessonVideo, setPreviewLessonVideo] = useState<string[]>([]);
  const [isLoadingCourse, setIsLoadingCourse] = useState<boolean>(true);
  const [description, setDescription] = useState<string>("");

  const getCourseFromParams = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const response = await axios.get(`/api/admin/course/${courseId}`);
      const courseData = await response.data.course;
      // console.log("This is the course Data ", courseData);

      setCourse(courseData);
      setForm((prev: CUpdateCourseForm) => ({
        ...prev,
        title: courseData.title,
        description: courseData.description,
        coverImage: courseData.coverImage,
        category: courseData.category.name,
        subCategory: courseData.subCategory,
        level: courseData.level,
        language: courseData.language,
        tags: courseData.tags,
        whatYouWillLearn: courseData.whatYouWillLearn,
        requirements: courseData.requirements,
        previewVideo: courseData.previewVideo,
        sections: courseData.sections,
        lessons: courseData.lessons,
        topics: courseData.topics,
        faq: courseData.faq,
        dripType: courseData.dripType,
        status: courseData.status,
        instructorId: courseData.instructorId
      }))
      setPreviewNewCover(courseData.coverImage);
      setPreviewLessonVideo(courseData?.lessons?.map((lesson: CLesson) => lesson.videoUrl));
      // console.log("THis is the course fetched from the DB ", course);
      clientLogger.info("This is the course fetched from the DB ", courseData);
    } catch (error: any) {
      toast.error(error.response.data.message);
      clientLogger.error("Course Fetch failed ", error);

    } finally {
      setIsLoadingCourse(false);

    }
  }, []);



  useEffect(() => {
    const timer: NodeJS.Timeout = setTimeout((): void => {
      getCourseFromParams();
    }, 300); // Small delay to prevent immediate load
    return (): void => clearTimeout(timer);
  }, [getCourseFromParams]);
  const router = useRouter();
  const updateField = <K extends keyof CUpdateCourseForm>(key: K, value: CUpdateCourseForm[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }))
  }
  const handleTopicChange = (index: number, field: string, value: string): void => {
    const newTopics = [...form.topics];
    (newTopics[index] as any)[field] = value;
    setForm((prev: CUpdateCourseForm) => ({
      ...prev,
      topics: newTopics
    }))
  };

  const handleFaqChange = (index: number, field: string, value: string): void => {
    const newFaq = [...form.faq];
    (newFaq[index] as any)[field] = value;
    setForm((prev: CUpdateCourseForm) => ({
      ...prev,
      faq: newFaq
    }))
  };

  const handleLessonChange = (index: number, field: string, value: string): void => {
    const newLessons = [...form.lessons];
    (newLessons[index] as any)[field] = value;
    setForm((prev: CUpdateCourseForm) => ({
      ...prev,
      lessons: newLessons
    }))
  };
  const addTopic = (): void => {
    setForm((prev: CUpdateCourseForm) => ({
      ...prev,
      topics: [...prev.topics, { name: "", description: "", slug: "", isActive: true }]
    }))

  };
  const removeTopic = (index: number): void => {
    const newTopics = [...form.topics];
    newTopics.splice(index, 1);
    setForm((prev: CUpdateCourseForm) => ({
      ...prev,
      topics: newTopics
    }))
  };

  const addLesson = (): void => {
    setForm(
      (prev: CUpdateCourseForm) => ({
        ...prev,
        lessons: [
          ...prev.lessons,
          { isPreviewVideo: "", isPreview: false, durationInSeconds: 0, description: "", videoUrl: "", name: "", order: 0 },
        ],
      })
    )
    setIsLessonVideoUploading((prev) => ({
      ...prev,
      [form.lessons.length]: false, // New lesson at the last index
    }));
  };

  const removeLesson = (index: number): void => {
    const newLessons = [...form.lessons];
    newLessons.splice(index, 1);
    setForm((prev: CUpdateCourseForm) => ({
      ...prev,
      lessons: newLessons
    }))
  };
  const addFaq = () => {
    setForm((prev: CUpdateCourseForm) => ({
      ...prev,
      faq: [...prev.faq, { question: "", answer: "" }]
    }))
  };
  const removeFaq = (index: number): void => {
    const newFaq = [...form.faq];
    newFaq.splice(index, 1);
    setForm((prev: CUpdateCourseForm) => ({
      ...prev,
      faq: newFaq
    }))
  };



  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    try {
      setIsVideoUploading(true);
      setIsVideoUploading(true);
      const target = e.target as HTMLInputElement;
      if (!target.files) throw new Error("No file selected");
      const file = target.files[0];
      setSelectedVideoName(file.name);
      const url = await uploadFile(file);
      const seconds: number = await getVideoDuration(file);
      updateField("durationInSeconds", Number(seconds));
      clientLogger.info("Video uploaded succesfully")
    } catch (error: any) {
      clientLogger.error("Video upload failed")
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsImageUploading(true);
      const target = e.target as HTMLInputElement;
      if (!target.files) throw new Error("No file selected");
      const file = target.files[0];
      setSelectedImageName(file.name);
      const url = await uploadFile(file);
      updateField("coverImage", url);
      setPreviewNewCover(url);
      clientLogger.info("Image uploaded successfully")
    } catch (error: any) {
      clientLogger.error("Image upload failed", error?.response?.data?.message)
      return alert(error.message);
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleUpdateCourse: React.FormEventHandler = async (): Promise<void | string | number> => {

    try {

      const payload = buildCoursePayload(form);
      const validation = createCourseSchema.safeParse(payload);
      if (!validation.success) {
        const errorMessage = validation.error.errors.map((error: any) => error.message).join("\n");
        toast.error(errorMessage);
        setLoading(false)
        return
      }
      const response = await axios.put(
        `/api/admin/course/${courseId}`,
        payload
      );
      toast.success("Course Updated successfully");
      setCourse(response.data.course);
      router.push("/course/manage");
      clientLogger.info("Course updated successfully")
    } catch (error: any) {
      clientLogger.error("Course update failed", error?.response?.data?.message)
      return toast.error(error?.response?.data?.message);
    }

  }

  const handleLessonVideoUpload = async (index: number, file: File): Promise<void> => {
    setIsLessonVideoUploading((prev: { [key: number]: boolean }) => {
      const newState = { ...prev }; // Create a shallow copy
      newState[index] = true; // Set the specific index to true
      return newState;
    });

    try {
      setSelectedLessonVideoNames((prev: string[]): string[] => {
        const updated = [...prev];
        updated[index] = file.name;
        return updated
      });

      const url = await uploadFile(file);
      clientLogger.info("Video uploaded successfully")
      const duration = await getVideoDuration(file);
      clientLogger.info("Duration Parsed successfully")
      const updatedLessons = [...form.lessons];
      updatedLessons[index].videoUrl = url;
      updatedLessons[index].durationInSeconds = duration;
      setForm((prev: CUpdateCourseForm) => ({
        ...prev,
        lessons: updatedLessons
      }));
      setPreviewLessonVideo(updatedLessons.map((lesson) => lesson.videoUrl));
    } catch (error: any) {
      clientLogger.error("Video upload failed", error?.response?.data?.message)
      toast.error(error?.response?.data?.message)
      return 
    } finally {
      setIsLessonVideoUploading((prev: { [key: number]: boolean }) => {
        const newState = { ...prev }; // Create a shallow copy
        newState[index] = false; // Set the specific index to false
        return newState;
      });
    };
    
  }
  useEffect(() => {
    // Initialize states for each lesson
    const initialUploadingState: Record<number, boolean> = {};
    const initialVideoNames = form.lessons.map(() => "");

    form.lessons.forEach((_, index) => {
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
  const handleCategoryChange = (value: string): void => {
    setForm((prev) => {
      return {
        ...prev,
        category: value,
        subCategory: ""
      }

    });
    // reset subcategory on category change
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
                  value={form.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, title: e.target.value }))}
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
                  value={form.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setForm((prev) => ({ ...prev, price: Number(e.target.value) })) }}
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
                  value={form.discount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(() => ({ ...form, discount: Number(e.target.value) }))}
                  placeholder="e.g. '%' 10,20,40 "
                />
              )}
            </div>
            <div className="space-y-2">
              <Label className="">Category</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Select value={form.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={form.category || "Select a  category"}
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
                <Select value={form.subCategory} onValueChange={(value: string) => {
                  setForm((prev) => ({ ...prev, subCategory: value }))
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={form.subCategory || "Select a subcategory"}
                    />
                  </SelectTrigger>
                  <SelectContent className="">
                    {(categoryToSubcategories[form.category as keyof typeof categoryToSubcategories] || []).map((sub) => (
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
                  value={form.tags.join(", ")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((prev) => ({ ...prev, tags: e.target.value.split(",").map((item: string) => item.trim()) }))

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
                  value={form.durationInSeconds}
                  disabled
                  placeholder="e.g. seconds"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label className="">Level</Label>
              {isLoadingCourse ? (
                <Skeleton className="w-full h-[30px] rounded-md" />
              ) : (
                <Select
                  value={form.level.charAt(0).toUpperCase() + form.level.slice(1)}
                  onValueChange={(value: string) => {
                    setForm((prev) => ({ ...prev, level: value.toLowerCase() }))
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        form.level.charAt(0).toUpperCase() + form.level.slice(1) ||
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
                  value={form.whatYouWillLearn.join(", ")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((prev) => ({ ...prev, whatYouWillLearn: e.target.value.split(",").map((item: string) => item.trim()) }))

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
                  value={form.requirements.join(", ")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((prev) => ({ ...prev, requirements: e.target.value.split(",").map((item: string) => item.trim()) }))

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
                <Select value={form.language} onValueChange={(value: string)=>{
                  setForm((prev) => ({ ...prev, language: value }))
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={`${form.language.charAt(0).toUpperCase() + form.language.slice(1) ||
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

            {form.topics?.map((item, index) => (
              <div key={index} className="mb-4 space-y-2 relative">
                { }
                {isLoadingCourse ? (
                  <Skeleton className="w-full h-[30px] rounded-md" />
                ) : (
                  form.topics.length > 1 &&
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
                      value={item.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleTopicChange(index, "topic", e.target.value)
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
              <Button className="" size="default" type="button" onClick={addTopic} variant="outline">
                + Add Topics
              </Button>
            )}
            <Label className={"my-4"}>Lessons</Label>
            {form.lessons?.map((item, index) => (
              <div key={index} className="mb-4 space-y-2 relative">
                {form.lessons.length > 1 && index !== 0 && (
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
                        handleLessonChange(index, "name", e.target.value)
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
                      value={item.durationInSeconds}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
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
              <Button className="" size="default" type="button" onClick={addLesson} variant="outline">
                + Add Lessons
              </Button>
            )}
            <Label className={"my-4"}>Faqs</Label>

            {form.faq?.map((item, index) => (
              <div key={index} className="mb-4 space-y-2 relative ">
                {form.faq.length > 1 && index !== 0 && (
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
                        handleFaqChange(index, "question", e.target.value)
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
              <Button className="" size="default" type="button" onClick={addFaq} variant="outline">
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
              <Button className="" size="default" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button className="" size="default" variant="default" onClick={(e) => handleUpdateCourse(e)}>Update</Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default EditCourseComp;
