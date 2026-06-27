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
import { CFaq, CLesson, CTopic } from "@/types/client";
import { CCreateCourseForm } from "@/types/forms/formValidators";
import { useUpload } from "@/utils/hooks/Video/useUpload";
import { useVideoParsing } from "@/utils/hooks/Video/useVideoParsing";
import { buildCoursePayload } from "@/utils/buildPayload/buildCoursePayload";
import { createCourseSchema } from "@/utils/fieldsValidation/Client/courseSchemaValidation";



export const CreateCourseComp: React.FC = () => {
  const [form, setForm] = useState<CCreateCourseForm>({
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
    dripType: "",
    status: "",
    faq: [],
    instructorId: "",
    durationInSeconds: 0

  });

  const { uploadFile } = useUpload()
  const { getVideoDuration
  } = useVideoParsing();
  const [selectedLessonVideoNames, setSelectedLessonVideoNames] = useState<string[]>(
    []
  );
  const [isLessonVideoUploading, setIsLessonVideoUploading] = useState<Record<string, boolean>>({});
  const [isVideoUploading, setIsVideoUploading] = useState<boolean>(false);
  const [isImageUploading, setIsImageUploading] = useState<boolean>(false);
  const [selectedVideoName, setSelectedVideoName] = useState<string>("");
  const [selectedImageName, setSelectedImageName] = useState<string>("");
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
  const handleCategoryChange = (value: string): void => {
    updateField("category", value);
    updateField("subCategory", "") // reset subCategories on category change
  };
  const updateField = <K extends keyof CCreateCourseForm>(key: K, value: CCreateCourseForm[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }))
  }
  const router = useRouter();
  const handleTopicChange = (index: number, field: keyof CTopic, value: CTopic[typeof field]): void => {
    const newTopics: CTopic[] = [...form.topics];
    newTopics[index] = { ...newTopics[index], [field]: value ?? "" };
    setForm((prev: CCreateCourseForm) => ({
      ...prev,
      topics: newTopics //// [ CTopic]  
    }));
  };

  const handleFaqChange = (index: number, field: keyof CFaq, value: CFaq[typeof field]): void => {
    const newFaq = [...form.faq];
    newFaq[index][field] = value;
    setForm((prev: CCreateCourseForm) => ({
      ...prev,
      faq: newFaq
    }));
  };

  const handleLessonChange = <K extends keyof CLesson>(index: number, field: K, value: CLesson[K]): void => {
    const newLessons = [...form.lessons];
    newLessons[index][field] = value;
    updateField("lessons", newLessons)
  };
  const addTopic = (): void => {
    setForm((prev: CCreateCourseForm) => ({
      ...prev,
      topics: [...prev.topics, { name: "", description: "", slug: "", isActive: true }]
    }));
  };
  const removeTopic = (index: number): void => {
    const newTopics = [...form.topics];
    newTopics.splice(index, 1);
    setForm((prev: CCreateCourseForm) => ({
      ...prev,
      topics: newTopics
    }));
  };

  const addLesson = (): void => {
    setForm(
      (prev: CCreateCourseForm) => ({
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
    setForm((prev: CCreateCourseForm) => ({
      ...prev,
      lessons: newLessons
    }));
  };
  const addFaq = (): void => {
    updateField("faq", ([...form.faq, { question: "", answer: "" }]));
  };
  const removeFaq = (index: number): void => {
    const newFaq = [...form.faq];
    newFaq.splice(index, 1);
    updateField("faq", newFaq);
  };


  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    try {
      setIsVideoUploading(true);
      const target = e.target as HTMLInputElement;
      if (!target.files) throw new Error("No file selected");
      const file = target.files[0];
      setSelectedVideoName(file.name);

      const url = await uploadFile(file);
      const seconds: number = await getVideoDuration(file);
      updateField("durationInSeconds", Number(seconds));

    } catch (error: any) {
      toast.error(error.message)
      return
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    try {
      setIsImageUploading(true);
      const target = e.target as HTMLInputElement;
      if (!target.files) throw new Error("No file selected");
      const file = target.files[0];
      setSelectedImageName(file.name);
      const url = await uploadFile(file);
      updateField("coverImage", url);
    } catch (error: any) {
      return alert(error.message);
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleCreateCourse: React.FormEventHandler = async (): Promise<void | string | number> => {
    setLoading(true);
    try {
      const payload = buildCoursePayload(form);
      const validation = createCourseSchema.safeParse(payload);
      if (!validation.success) {
        const errorMessage = validation.error.errors.map((error) => error.message).join("\n");
        toast.error(errorMessage);
        setLoading(false)
        return
      }
      const response = await axios.post("/api/admin/course/create", payload);
      toast.success("Course created successfully");
      router.push("/course/manage");
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      return toast.error(error?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };
  const handleLessonVideoUpload = async (index: number, file: File): Promise<void> => {
    setIsLessonVideoUploading((prev) => {
      const newState = { ...prev }; // Create a shallow copy
      newState[index] = true; // Set the specific index to true
      return newState;
    });

    try {
      setSelectedLessonVideoNames((prev) => {
        const updated = [...prev];
        updated[index] = file.name;
        return updated
      });
      const url = await uploadFile(file);
      const duration = await getVideoDuration(file);
      const updatedLessons = [...form.lessons];
      updatedLessons[index].videoUrl = url;
      updatedLessons[index].durationInSeconds = duration;
      setForm((prev: CCreateCourseForm) => ({
        ...prev,
        lessons: updatedLessons
      }));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLessonVideoUploading((prev) => {
        const newState = { ...prev }; // Create a shallow copy
        newState[index] = false; // Set the specific index to false
        return newState;
      });
    }
  };

  useEffect(() => {
    // Initialize states for each lesson
    const initialUploadingState: Record<number, boolean> = {};
    const initialVideoNames = form.lessons.map(() => "");

    form.lessons.forEach((_, index: number) => {
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
                value={form.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("title", e.target.value)}
                placeholder="e.g. JavaScript Course"
              />
            </div>
            <div className="space-y-2">
              <Label className="">Description</Label>
              <div className="min-h-[150px]">
                <Tiptap description={form.description} onChange={(val: string) => updateField("description", val)} />
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
                value={form.price}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("price", Number(e.target.value))}
                placeholder="e.g. ₹ 69.99"
              />
            </div>
            <div className="space-y-2">
              <Label className="">Discount</Label>
              <Input
                className=""
                type="text"
                value={form.discount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("discount", Number(e.target.value))}
                placeholder="e.g. '%' 10,20,40 "
              />
            </div>
            <div className="space-y-2">
              <Label className="">Category</Label>
              <Select value={form.category} onValueChange={handleCategoryChange}>
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
                value={form.subCategory}
                onValueChange={(val: string) => updateField("subCategory", val)}
                disabled={!form.category}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a SubCategory" />
                </SelectTrigger>
                <SelectContent className="">
                  {(categoryToSubcategories[form.category as keyof typeof categoryToSubcategories] || []).map((sub: string) => (
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
                value={form.tags.join(", ")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  // setTags(e.target.value.toString().split(",").join(","))
                  updateField("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))
                }
                placeholder="e.g. JavaScript Basics, React, Next.js"
              />
            </div>
            <div className="space-y-2">
              <Label className="">Duration (in seconds)</Label>
              <Input
                className=""
                type="text"
                value={form.durationInSeconds}
                placeholder="e.g. 3600 for 1 hour"
              />
            </div>
            <div className="space-y-2">
              <Label className="">Level</Label>
              <Select value={form.level} onValueChange={(val: string) => updateField("level", val)}>
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
                value={form.whatYouWillLearn.join(", ")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField("whatYouWillLearn",
                    e.target.value.split(",").map((item: string) => item.trim())
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
                value={form.requirements.join(", ")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("requirements", e.target.value.split(",").map((item: string) => item.trim()))}
                placeholder="e.g. Html, CSS, JavaScript"
              />
            </div>
            <div className="space-y-2">
              <Label className="">Language</Label>
              <Select value={form.language} onValueChange={(val: string) => updateField("language", val)}>
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
                  ].map((lang: string) => (
                    <SelectItem className="" key={lang} value={lang.toLowerCase()}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Label className="my-4 mt-6">Topics to be covered</Label>

            {form.topics.map((item, index: number) => (
              <div key={index} className="mb-4 space-y-2 relative">
                { }
                {form.topics.length > 1 && index !== 0 && (
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
                    value={item.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleTopicChange(index, "name", e.target.value)
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
                <div className="space-y-2">
                  <Label className="">IsActive</Label>
                  <Select value={String(item.isActive)} onValueChange={(val) => handleTopicChange(index, "isActive", val === "true")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
            <Button size="default" className="" type="button" onClick={addTopic} variant="outline">
              + Add Topics
            </Button>
            <Label className={"my-4"}>Lessons</Label>
            {form.lessons.map((item, index) => (
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
                  <Label className="">video Url</Label>
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
                          if (!target.files) return;
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
                    value={item.durationInSeconds}
                    disabled
                    // onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    //   handleLessonChange(index, "duration", e.target.value)
                    // }
                    placeholder="e.g. Variables, loops, functions"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="">IsPreview</Label>
                  <Select value={String(item.isPreview)} onValueChange={(val: string) => handleLessonChange(index, "isPreview", val === "true")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>

                </div>
                <div className="space-y-2">
                  <Label className="">Preview video Url</Label>
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
                          if (!target.files) return;
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
              </div>
            ))}

            <Button size="default" className="" type="button" onClick={addLesson} variant="outline">
              + Add Lessons
            </Button>
            <Label className={"my-4"}>Faqs</Label>

            {form.faq.map((item, index) => (
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
            <Button size="default" className="" type="button" onClick={addFaq} variant="outline">
              + Add Faqs
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button size="default" className="" variant="outline">Cancel</Button>
          <Button variant="default" size="default" className="" onClick={handleCreateCourse}>
            {loading ? "Creating..." : "Create Course"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateCourseComp;
