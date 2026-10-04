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
import { CCategory, CFaq, CLesson, CTopic } from "@/types/client";
import { CCreateCourseForm } from "@/types/forms/formValidators";
import { useUpload } from "@/utils/hooks/Video/useUpload";
import { useVideoParsing } from "@/hooks/Video/useVideoParsing";
import { buildCoursePayload } from "@/utils/buildPayload/buildCoursePayload";
import { CCreateCourse, zodCourseSchema } from "@/utils/fieldsValidation/Client/courseSchemaValidation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { categoryToSubcategories, uiCategories, uiLanguages } from "@/locales/locales";



export const CreateCourseComp: React.FC<{ className?: string }> = ({ className }) => {
  const form = useForm<CCreateCourse>({
    resolver: zodResolver(zodCourseSchema),
    defaultValues: {
      title: "",
      topic: "",
      instructorId: "",
      price: 0,
      totalLessons: 0,
      description: "",
      discount: 0,
      coverImage: "",
      category: "",
      level: "",
      language: "",
      tags: [],
      sections: [],
      lessons: [],
      topics: [],
      whatYouWillLearn: [],
      requirements: [],
      previewVideo: "",
      dripType: "",
      status: "",
      faq: [],
      totalDurationInSeconds: 0,
      totalEnrolledCount: 0
    }
  })
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

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
  const [selectedParentId, setSelectedParentId] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false);
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "topics",
  });
  const { fields: lessonsFields, append: appendLessons, remove: removeLessons } = useFieldArray({ control, name: "lessons" });
  const { fields: sectionsFields, append: appendSections, remove: removeSections } = useFieldArray({ control, name: "sections" });
  const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({ control, name: "faq" });
  const handleCategoryChange = (value: string): void => {
    setSelectedParentId(value);
    updateField("category", "");
  };
  // const updateField = <K extends keyof CCreateCourseForm>(key: K, value: CCreateCourseForm[K]) => {
  //   setForm((prev) => ({
  //     ...prev,
  //     [key]: value
  //   }))
  // }
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

    // const removeFaq = (index: number): void => {
    const newFaq = [...form.faq];
    newFaq.splice(index, 1);
    updateField("faq", newFaq);
  }


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

    } catch (error: unknown) {
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

  const handleCreateCourse: React.FormEventHandler = async (data: CCreateCourse): Promise<void | string | number> => {
    setLoading(true);
    try {
      const payload = buildCoursePayload(data);
      const validation = zodCourseSchema.safeParse(payload);
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
    <div className={cn("flex flex-col min-h-screen w-full items-center justify-center gap-4 mt-6 mb-8", className)}>
      <Card className="w-87.5 md:w-137.5 space-y-4">
        <CardHeader className="">
          <CardTitle className="">Create project</CardTitle>
          <CardDescription className="">
            Deploy your new course in one-click.
          </CardDescription>
        </CardHeader>
        <CardContent className="">
          <form id="create-course-form" className="space-y-4" onSubmit={handleSubmit(handleCreateCourse)}>
            <div className="space-y-2">
              <Label className="">Title</Label>
              <Input
                type="text"
                className=""
                {...register("title")}
                placeholder="e.g. JavaScript Course"
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="">Description</Label>
              <div className="min-h-[150px]">
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Tiptap
                      description={field.value}
                      onChange={(val: string) => field.onChange(val)}
                    />
                  )}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
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
                {...register("price", { valueAsNumber: true })}

                placeholder="e.g. ₹ 69.99"
              />
            </div>
            <div className="space-y-2">
              <Label className="">Discount</Label>
              <Input
                className=""
                type="text"
                {...register("discount", { valueAsNumber: true })}
                placeholder="e.g. '%' 10,20,40 "
              />
            </div>
            <div className="space-y-2">
              <Label className="">Category</Label>
              <Select value={selectedParentId} onValueChange={(val: string) => handleCategoryChange(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="">
                  {Object.entries(categoryToSubcategories).map(([cat, sub]) => (
                    <SelectItem className="" key={cat} value={cat}>
                      {cat
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="">SubCategory</Label>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!selectedParentId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a SubCategory" />
                    </SelectTrigger>
                    <SelectContent className="">
                      {Object.entries(categoryToSubcategories).map(([cat, sub]) => (
                        cat === selectedParentId && sub.map((sub) => (
                          <SelectItem className="" key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.category && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="">Tags</Label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <Input
                    className=""
                    type="text"
                    value={field.value.join(", ") ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      // setTags(e.target.value.toString().split(",").join(","))
                      field.onChange(
                        e.target.value.split(",").map((t) => t.trim()).filter(Boolean)
                      )
                    }
                    placeholder="e.g. JavaScript Basics, React, Next.js"
                  />
                )}

              />

            </div>
            <div className="space-y-2">
              <Label className="">Duration (in seconds)</Label>
              <Input
                className=""
                type="text"
                value={form.totaldurationInSeconds}
                placeholder="e.g. 3600 for 1 hour"
              />
            </div>
            <div className="space-y-2">
              <Label className="">Level</Label>
              <Controller
                name="level"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                )}
              />


            </div>
            <div className="space-y-2">
              <Label className="">What you will learn</Label>
              <Controller
                name="whatYouWillLearn"
                control={control}
                render={({ field }) => (
                  <Input
                    type="text"
                    className=""
                    value={field.value?.join(", ") ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      field.onChange(e.target.value.split(",").map((item) => item.trim()))
                    }
                    placeholder="e.g. Variables, loops, functions"
                  />
                )}
              />

            </div>

            <div className="space-y-2">
              <Label className="">Requirements</Label>
              <Controller
                name="requirements"
                control={control}
                render={({ field }) => (
                  <Input
                    className=""
                    type="text"
                    value={field.value.join(", ") ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value.split(",").map((item) => item.trim()))}
                    placeholder="e.g. Html, CSS, JavaScript"
                  />
                )}
              />

            </div>
            <div className="space-y-2">
              <Label className="">Language</Label>
              <Controller
                name='language'
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {uiLanguages.map((lang: string) => (
                        <SelectItem className="" key={lang} value={lang.toLowerCase()}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

            </div>

            <Label className="my-4 mt-6">Topics to be covered</Label>
            {fields.map((item, index: number) => (
              <div key={item.id} className="mb-4 space-y-2 relative">
                { }
                {fields.length > 1 && index !== 0 && (
                  <div
                    className="absolute right-2 -top-0 text-lg cursor-pointer flex items-center"
                    onClick={() => remove(index)}
                  >
                    <RxCross2 />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="">Topic</Label>
                  <Input
                    type="text"
                    {...form.register(`topics.${index}.name`)}
                    placeholder="e.g. JavaScript Basics"
                  />
                  {form.formState.errors.topics?.[index]?.name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.topics[index]?.name?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="">Description</Label>
                  <Input
                    type="text"
                    className=""
                    {...form.register(`topics.${index}.description`)}
                    placeholder="e.g. Variables, loops, functions"
                  />
                  {form.formState.errors.topics?.[index]?.description && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.topics[index]?.description?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="">IsActive</Label>
                  <Controller
                    control={form.control}
                    name={`topics.${index}.isActive`}
                    render={({ field: controllerField }) => (
                      <Select value={String(controllerField.value)} onValueChange={(val: string) => controllerField.onChange(val === "true")}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">True</SelectItem>
                          <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                      </Select>)}

                  />
                </div>
              </div>
            ))}
            <Button size="default" variant="outline" type="button" onClick={() => append({ name: "", description: "", isActive: true })} >
              + Add Topics
            </Button>
            <Label className={"my-4"}>Lessons</Label>
            {lessonsFields.map((item, index) => (
              <div key={index} className="mb-4 space-y-2 relative">
                {lessonsFields.length > 1 && index !== 0 && (
                  <div
                    className="absolute right-2 -top-0 text-lg cursor-pointer flex items-center"
                    onClick={() => removeLessons(index)}
                  >
                    <RxCross2 />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="">Name</Label>
                  <Input
                    type="text"
                    {...form.register(`lessons.${index}.name`)}
                    placeholder="e.g. JavaScript Basics"
                  />
                  {form.formState.errors.lessons?.[index]?.name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.lessons[index]?.name?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="">Description</Label>
                  <Input
                    type="text"
                    className=""
                    {...form.register(`lessons.${index}.description`)}
                    placeholder="e.g. Variables, loops, functions"
                  />
                  {
                    form.formState.errors.lessons?.[index]?.description && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.lessons[index]?.description?.message}
                      </p>
                    )
                  }
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
                  {form.formState.errors.lessons?.[index]?.videoUrl && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.lessons[index]?.videoUrl?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Duration (seconds)</Label>
                  <Input
                    type="number"
                    {...form.register(`lessons.${index}.durationInSeconds`, { valueAsNumber: true })}
                    placeholder="300"
                    disabled
                  />
                  {form.formState.errors.lessons?.[index]?.durationInSeconds && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.lessons[index]?.durationInSeconds?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Order</Label>
                  <Input
                    type="number"
                    {...form.register(`lessons.${index}.order`, { valueAsNumber: true })}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="">IsPreview</Label>
                  <Controller
                    name={`lessons.${index}.isPreview`}
                    control={form.control}
                    render={({ field: controllerField }) => (
                      <>
                        <Select value={String(controllerField.value)} onValueChange={(val: string) => controllerField.onChange(val === "true")}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    )}

                  />

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
                  {form.formState.errors.lessons?.[index]?.previewVideoUrl && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.lessons[index]?.previewVideoUrl?.message}
                    </p>
                  )}
                </div>
              </div>
            ))}

            <Button size="default" className="" type="button" onClick={appendLessons} variant="outline">
              + Add Lessons
            </Button>
            <Label className={"my-4"}>Faqs</Label>

            {form.faq.map((item: CFaq, index: number) => (
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
