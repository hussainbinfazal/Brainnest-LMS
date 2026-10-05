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
import { CCategory, CFaq, CLesson, CSection, CTopic } from "@/types/client";
import { CCreateCourseForm } from "@/types/forms/formValidators";
import { buildCoursePayload } from "@/utils/buildPayload/buildCoursePayload";
import {
  CCreateCourse,
  zodCourseSchema,
} from "@/utils/fieldsValidation/Client/courseSchemaValidation";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import {
  categoryToSubcategories,
  uiCategories,
  uiLanguages,
} from "@/locales/locales";
import { useFileUploadField } from "@/hooks/Video/useFileUploadField";
import { getErrorMessage } from "@repo/shared";
import {
  BooleanSelect,
  CommaListField,
  Field,
  FileField,
  LessonItem,
} from "./courseFields";
import { useInstructorCourse } from "@/lib/store/instructorsStore/useInstructorCourse";

const LEVELS: string[] = ["Beginner", "Intermediate", "Expert"];

// default lesson shape in one place (match your schema's field names!)
const EMPTY_LESSON: CLesson = {
  name: "",
  description: "",
  videoUrl: "",
  previewUrl: "",
  durationInSeconds: 0,
  sectionId: "",
  previewDurationInSeconds: 0,
  order: 0,
  isPreview: false,
};
const EMPTY_SECTION: CSection = {
  _id: "",
  courseId: "",
  title: "",
  description: "",
  order: 0,
  lessons: [EMPTY_LESSON],
  createdAt: "",
  updatedAt: "",
};

export const CreateCourseComp: React.FC<{ className?: string }> = ({
  className,
}) => {
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const isLoading = useInstructorCourse((state) => state.isLoading);
  const createCourse = useInstructorCourse((state) => state.createCourse);
  const form = useForm<CCreateCourseForm>({
    resolver: zodResolver(zodCourseSchema),
  });
  const {
    register,
    control,
    setValue,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  // const lessons = useFieldArray({ control, name: "lessons" });
  const router = useRouter();
  const faq = useFieldArray({ control, name: "faq" });
  const sections = useFieldArray({ control, name: "sections" });
  const topics = useFieldArray({ control, name: "topics" });
  const cover = useFileUploadField();
  const previewVideo = useFileUploadField();
  // parent category is UI-only state, not part of the payload
  const [parentCategory, setParentCategory] = useState<string>("");
  // derive subcategories instead of nested map + &&
  const subcategories: string[] = categoryToSubcategories[parentCategory] ?? [];
  // total duration is derived, never typed by hand
  const totalSeconds = (watch("sections") ?? []).reduce(
    (sum: number, section: CSection) =>
      sum +
      section.lessons.reduce(
        (acc: number, lesson: CLesson) => acc + lesson.durationInSeconds,
        0
      ),
    0
  );

  const onSubmit = async (data: CCreateCourse) => {
    try {
      const totalLessons = data.sections.reduce(
        (acc, section) => acc + section.lessons.length,
        0
      );
      //attach derived totals
      const payload = buildCoursePayload({
        ...data,
        totalLessons: totalLessons,
        totalDurationInSeconds: totalSeconds,
      });
      await createCourse(payload);
      // feedback and redirect
      toast.success("Course created successfully");
      router.push("/course/manage");
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to create course");
      toast.error(message);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col min-h-screen w-full items-center justify-center gap-4 mt-6 mb-8",
        className
      )}
    >
      <FormProvider {...form}>
        <Card className="w-87.5 md:w-137.5 space-y-4">
          <CardHeader className="">
            <CardTitle className="">Create Course</CardTitle>
            <CardDescription className="">
              Deploy your new course in one-click.
            </CardDescription>
          </CardHeader>
          <CardContent className="">
            <form
              id="create-course-form"
              className="space-y-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              {/* <div className="space-y-2">
              <Label className="">Title</Label>
              <Input
                type="text"
                className=""
                {...register("title")}
                placeholder="e.g. JavaScript Course"
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div> */}
              {/* {Title} */}
              <Field label="Title" error={errors.title?.message}>
                <Input
                  {...register("title")}
                  placeholder="e.g. JavaScript Course"
                />
              </Field>
              {/* <div className="space-y-2">
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
            </div> */}
              {/* {Description} */}
              <Field label="Description" error={errors.description?.message}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Tiptap
                      description={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
              {/* <div className="space-y-2">
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
              )} */}
              {/* </div> */}
              {/* course preview video: only stores the url (duration is derived from lessons) */}
              <FileField
                label="Preview video"
                accept="video/*"
                {...previewVideo}
                onFile={async (f: File) => {
                  const result = await previewVideo.upload(f, "preview-video");
                  if (result) setValue("previewVideo", result.url);
                }}
              />
              {/* cover image */}
              {/* <div className="space-y-2">
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
              </div> */}
              {/* cover image */}
              <FileField
                label="Cover image"
                accept="image/*"
                {...cover}
                onFile={async (f) => {
                  const result = await cover.upload(f, "thumbnail");
                  if (result)
                    setValue("coverImage", result.url, {
                      shouldValidate: true,
                    });
                }}
              />

              {/* <div className="space-y-2">
                <Label className="">Price</Label>
                <Input
                  className=""
                  type="text"
                  {...register("price", { valueAsNumber: true })}

                  placeholder="e.g. ₹ 69.99"
                />
              </div> */}
              <Field label="Price" error={errors.price?.message}>
                <Input
                  type="number"
                  step="0.01"
                  {...register("price", { valueAsNumber: true })}
                  placeholder="e.g. 69.99"
                />
              </Field>
              {/* <div className="space-y-2">
                <Label className="">Discount</Label>
                <Input
                  className=""
                  type="text"
                  {...register("discount", { valueAsNumber: true })}
                  placeholder="e.g. '%' 10,20,40 "
                />
              </div> */}
              {/* discount percent */}
              <Field label="Discount (%)" error={errors.discount?.message}>
                <Input
                  type="number"
                  {...register("discount", { valueAsNumber: true })}
                  placeholder="e.g. 10"
                />
              </Field>
              {/* <div className="space-y-2">
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
              </div> */}
              {/* parent category: resets the subcategory on change */}
              <Field label="Category">
                <Select
                  value={parentCategory}
                  onValueChange={(v) => {
                    setParentCategory(v);
                    setValue("category", "");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(categoryToSubcategories).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {/* subcategory: the value actually stored in the form */}
              <Field label="SubCategory" error={errors.category?.message}>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!parentCategory}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a SubCategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              {/* <div className="space-y-2">
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

              </div> */}
              {/* tags */}
              <Field label="Tags">
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <CommaListField
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="e.g. React, Next.js"
                    />
                  )}
                />
              </Field>
              {/* <div className="space-y-2">
                <Label className="">Duration (in seconds)</Label>
                <Input
                  className=""
                  type="text"
                  value={form.totaldurationInSeconds}
                  placeholder="e.g. 3600 for 1 hour"
                />
              </div> */}
              {/* derived total duration, read-only */}
              <Field label="Total duration (seconds)">
                <Input readOnly value={totalSeconds} />
              </Field>
              {/* <div className="space-y-2">
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


              </div> */}
              {/* level */}
              <Field label="Level" error={errors.level?.message}>
                <Controller
                  name="level"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a level" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEVELS.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              {/* <div className="space-y-2">
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

              </div> */}
              {/* what you will learn */}
              <Field label="What you will learn">
                <Controller
                  name="whatYouWillLearn"
                  control={control}
                  render={({ field }) => (
                    <CommaListField
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}

                      placeholder="e.g. Variables, loops"
                    />
                  )}
                />
              </Field>

              {/* <div className="space-y-2">
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

              </div> */}
              {/* requirements */}
              <Field label="Requirements">
                <Controller
                  name="requirements"
                  control={control}
                  render={({ field }) => (
                    <CommaListField
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}

                      placeholder="e.g. HTML, CSS"
                    />
                  )}
                />
              </Field>
              {/* <div className="space-y-2">
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

              </div> */}
              {/* language */}
              <Field label="Language" error={errors.language?.message}>
                <Controller
                  name="language"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                      <SelectContent className="max-h-75 overflow-y-auto">
                        {uiLanguages.map((l: string) => (
                          <SelectItem key={l} value={l.toLowerCase()}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              {/* <Label className="my-4 mt-6">Topics to be covered</Label>
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
              ))} */}
              {/* topics section */}
              <h3 className="mt-6 text-sm font-medium">Topics to be covered</h3>
              {/* item.id is the stable key, not the index */}
              {topics.fields.map((item, i) => (
                <div key={item.id} className="relative mb-4 space-y-2">
                  {/* remove button, hidden for the first topic */}
                  {i > 0 && (
                    <button
                      type="button"
                      className="absolute right-2 top-0 text-lg"
                      onClick={() => topics.remove(i)}
                    >
                      <RxCross2 />
                    </button>
                  )}
                  {/* topic name */}
                  <Field
                    label="Topic"
                    error={errors.topics?.[i]?.name?.message}
                  >
                    <Input
                      {...register(`topics.${i}.name`)}
                      placeholder="e.g. JavaScript Basics"
                    />
                  </Field>
                  {/* topic description */}
                  <Field
                    label="Description"
                    error={errors.topics?.[i]?.description?.message}
                  >
                    <Input {...register(`topics.${i}.description`)} />
                  </Field>
                  <Field label="Slug" error={errors.topics?.[i]?.slug?.message}>
                    <Input {...register(`topics.${i}.slug`)} />
                  </Field>
                  {/* active flag */}
                  <Field label="IsActive">
                    <Controller
                      control={control}
                      name={`topics.${i}.isActive`}
                      render={({ field }) => (
                        <BooleanSelect
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </Field>
                </div>
              ))}
              {/* add topic: pass a real object, not the click event */}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  topics.append({
                    name: "",
                    description: "",
                    isActive: true,
                    slug: "",
                  })
                }
              >
                + Add Topics
              </Button>
              {/* sections block, same pattern as topics */}
              <h3 className="mt-6 text-sm font-medium">Sections</h3>
              {/* lessons section */}
              {/* item.id is the stable key */}
              {sections.fields.map((section, sectionIndex) => {
                // Get the nested lessons field array for this specific section
                const sectionLessons = useFieldArray({
                  control,
                  name: `sections.${sectionIndex}.lessons`,
                });

                return (
                  <div key={section.id} className="relative mb-4 space-y-2">
                    {/* remove button, hidden for the first section */}
                    {sectionIndex > 0 && (
                      <button
                        type="button"
                        className="absolute right-2 top-0 text-lg"
                        onClick={() => sections.remove(sectionIndex)}
                      >
                        <RxCross2 />
                      </button>
                    )}

                    {/* section title */}
                    <Field
                      label="Title"
                      error={errors.sections?.[sectionIndex]?.title?.message}
                    >
                      <Input
                        {...register(`sections.${sectionIndex}.title`)}
                        placeholder="e.g. Getting started"
                      />
                    </Field>

                    {/* section description */}
                    <Field
                      label="Description"
                      error={
                        errors.sections?.[sectionIndex]?.description?.message
                      }
                    >
                      <Input
                        {...register(`sections.${sectionIndex}.description`)}
                      />
                    </Field>

                    <h3 className="mt-6 text-sm font-medium">Lessons</h3>

                    {/* Lessons for THIS section */}
                    {sectionLessons.fields.map((lesson, lessonIndex) => (
                      <LessonItem
                        key={lesson.id}
                        sectionIndex={sectionIndex}
                        lessonIndex={lessonIndex}
                        canRemove={lessonIndex > 0}
                        onRemove={() => sectionLessons.remove(lessonIndex)}
                      />
                    ))}

                    {/* add lesson to THIS section */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => sectionLessons.append(EMPTY_LESSON)}
                    >
                      + Add Lesson
                    </Button>
                  </div>
                );
              })}
              {/* add section with a real object, not the click event */}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  sections.append({
                    ...EMPTY_SECTION,
                    lessons: [EMPTY_LESSON], // Start with one empty lesson
                  })
                }
              >
                + Add Section
              </Button>

              {/* {lessonsFields.map((item, index) => (
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
            ))} */}

              {/* <Button size="default" className="" type="button" onClick={appendLessons} variant="outline">
              + Add Lessons
            </Button> */}
              <Label className={"my-4"}>Faqs</Label>

              {/* {form.faq.map((item: CFaq, index: number) => (
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
            </Button> */}
              {/* faq section */}
              <h3 className="mt-6 text-sm font-medium">Faqs</h3>
              {/* faq now uses useFieldArray fields, not form.faq */}
              {faq.fields.map((item, i) => (
                <div key={item.id} className="relative mb-4 space-y-2">
                  {/* remove button */}
                  {i > 0 && (
                    <button
                      type="button"
                      className="absolute right-2 top-0 text-lg"
                      onClick={() => faq.remove(i)}
                    >
                      <RxCross2 />
                    </button>
                  )}
                  {/* question: registered, so no manual onChange handler needed */}
                  <Field
                    label="Question"
                    error={errors.faq?.[i]?.question?.message}
                  >
                    <Input
                      {...register(`faq.${i}.question`)}
                      placeholder="e.g. What is async/await?"
                    />
                  </Field>
                  {/* answer */}
                  <Field
                    label="Answer"
                    error={errors.faq?.[i]?.answer?.message}
                  >
                    <Input {...register(`faq.${i}.answer`)} />
                  </Field>
                </div>
              ))}
              {/* add faq */}
              <Button
                type="button"
                variant="outline"
                onClick={() => faq.append({ question: "", answer: "" })}
              >
                + Add Faqs
              </Button>
            </form>
          </CardContent>
          {/* <CardFooter className="flex justify-between">
            <Button size="default" className="" variant="outline">Cancel</Button>
            <Button variant="default" size="default" className="" onClick={handleCreateCourse}>
              {loading ? "Creating..." : "Create Course"}
            </Button>
          </CardFooter> */}
          {/* footer actions */}
          <CardFooter className="flex justify-between">
            {/* cancel actually navigates now */}
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            {/* type=submit + form=id replaces onClick, so handleSubmit runs */}
            <Button
              type="submit"
              form="create-course-form"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Course"}
            </Button>
          </CardFooter>
        </Card>
      </FormProvider>
    </div>
  );
};

export default CreateCourseComp;
