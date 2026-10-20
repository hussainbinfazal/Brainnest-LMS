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

import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/usersStore/useAuthStore";
import Image from "next/image";
import { RxCrossCircled } from "react-icons/rx";
import Tiptap from "@/components/Tiptap/Tiptap";
import { CCourse, CLesson, CSection, } from "@/types/client";
import { CUpdateCourseForm } from "@/types/forms/formValidators";
import { clientLogger } from "@/utils/clientLogger/clientLogger";
import { CreateCourseBody, createCourseSchema, UpdateCourseBody } from "@/utils/fieldsValidation/Client/courseSchemaValidation";
// import { buildCoursePayload } from "@/utils/buildPayload/buildCoursePayload";
import { JSX } from "react/jsx-runtime";
import { cn } from "@/lib/utils";

import { useInstructorCoursesStore } from "@/lib/store/instructorsStore/useInstructorCoursesStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useFieldArray, useForm } from "react-hook-form";
import { useFileUploadField } from "@/hooks/Video/useFileUploadField";
import { categoryToSubcategories, LEVELS, uiLanguages } from "@/locales/locales";
import { getErrorMessage } from "@repo/shared";
import z from "zod";
import { BooleanSelect, CommaListField, Field, FileField, SectionItem } from "../Create-Course/courseFields";
type EditorCourseCompParams = {
  renderedCourse: CCourse,
  renderedCourseSections: CSection[],
  renderedCourseLessons: CLesson[],
  requestCourseId: string,
  className?: string,
}

// default lesson shape in one place (match your schema's field names!)
const EMPTY_LESSON = {
  name: "",
  description: "",
  videoUrl: "",
  previewUrl: "",
  previewPublicId: "",
  durationInSeconds: 0,
  videoPublicId: "",
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

const EditCourseComp = ({ renderedCourse, renderedCourseSections, renderedCourseLessons, requestCourseId, className }: EditorCourseCompParams): JSX.Element => {
  const router = useRouter();
  const [fetchedCourse, setFetchedCourse] = useState<CCourse | null>(renderedCourse)
  const [fetchedSections, setFetchedSections] = useState<CSection[]>(renderedCourseSections)
  const [fetchedLessons, setFetchedLessons] = useState<CLesson[]>(renderedCourseLessons)

  const updateCourse = useInstructorCoursesStore((state) => state.createCourse);
  const isLoading = useInstructorCoursesStore((state) => state.isLoading);
  const form = useForm<
    z.input<typeof createCourseSchema>,
    undefined,
    CreateCourseBody
  >({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: "Test JavaScript Course",
      description: "<p>This is a test course description</p>",
      price: 999,
      discount: 10,
      tags: ["javascript", "react", "nextjs"],
      level: "Beginner",
      whatYouWillLearn: ["Variables", "Functions", "Loops"],
      requirements: ["HTML", "CSS"],
      language: "english",
      dripType: "free",
      topics: [
        {
          name: "JavaScript Basics",
          description: "Introduction to JS fundamentals",
          isActive: true,
        },
      ],
      sections: [
        {
          ...EMPTY_SECTION,
          title: "Introduction Section",
          description: "Getting started",
          lessons: [
            {
              ...EMPTY_LESSON,
              name: "Welcome Lesson",
              description: "Course intro",
            },
          ],
        },
      ],
      faq: [
        {
          question: "What is async/await?",
          answer: "It's for handling promises",
        },
      ],
    },
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
  // const totalDurationInSeconds = (watch("sections") ?? []).reduce(
  //   (sum, section) =>
  //     sum +
  //     section.lessons.reduce<number>(
  //       (acc, lesson) => acc + (lesson.durationInSeconds ?? 0),
  //       0
  //     ),
  //   0
  // );

  const onSubmit = async (data: UpdateCourseBody) => {
    try {
      const totalLessons = data.sections.reduce(
        (acc, section) => acc + section.lessons.length,
        0
      );
      //attach derived totals
      await updateCourse({
        ...data, totalLessons, totalDurationInSeconds: (watch("sections") ?? []).reduce(
          (sum, section) =>
            sum +
            section.lessons.reduce<number>(
              (acc, lesson) => acc + (lesson.durationInSeconds ?? 0),
              0
            ),
          0
        )
      });
      // feedback and redirect
      toast.success("Course Updated successfully");
      router.push("/course/manage");
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to create course");
      toast.error(message);
    }

  };

  const onInvalidSubmit = () => {
    toast.error("Please complete the required fields highlighted in the form.");
  };
  useEffect(() => {
    const dripType = fetchedCourse?.dripType;
    form.reset({
      title: fetchedCourse?.title,
      description: fetchedCourse?.description,
      price: fetchedCourse?.price,
      discount: fetchedCourse?.discount,
      tags: fetchedCourse?.tags,
      level: fetchedCourse?.level === 'expert' ? 'advanced' : fetchedCourse?.level,
      whatYouWillLearn: fetchedCourse?.whatYouWillLearn,
      requirements: fetchedCourse?.requirements,
      language: fetchedCourse?.language,
      dripType: dripType === "free" || dripType === "sequential" || dripType === "drip-by-date" ? dripType : "free",
      topics: fetchedCourse?.topics,
      sections: fetchedSections.map((section) => ({
        ...section,
        lessons: fetchedLessons.filter(
          (lesson) => section._id !== undefined && lesson.sectionId === section._id
        ),
      })),
      faq: fetchedCourse?.faq,
      coverImage: fetchedCourse?.coverImage,

    })
  }, [])


  return (
    <div className={cn("flex flex-col min-h-screen w-full items-center justify-center gap-4 mt-6 mb-8", className)}>
      <FormProvider {...form}>
        <Card className="w-87.5 md:w-137.5 space-y-4">
          <CardHeader className="">
            <CardTitle className="">Edit project</CardTitle>
            <CardDescription className="">Update Your Project.</CardDescription>
          </CardHeader>
          <CardContent className="">
            <form
              id='update-course-form'
              onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
              className="space-y-4 relative">
              <FileField label="Course Cover Image" accept='image/*' {...cover}
                onFile={async (f) => {
                  const result = await cover.upload(f, "thumbnail");
                  if (result) {
                    setValue("coverImage", result.url, { shouldValidate: true });
                    setValue("coverPublicId", result.public_id, { shouldValidate: true });
                    // setPreviewNewCover(result.url);
                  }
                }}
                error={errors.coverImage?.message ?? errors?.coverPublicId?.message} required={true}
                onCancel={cover.cancel}
                isUploading={cover.isUploading}
                progress={cover.progress}
                url={watch("coverImage") ?? ''}
                fileKind='image'
              />
              <Field label="Title" error={errors.title?.message} required={true}>
                <Input
                  {...register("title")}

                />
              </Field>
              <Field label="Description" error={errors.description?.message}>
                <Controller
                  name='description'
                  control={control}
                  render={({ field }) => (
                    <Tiptap
                      description={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
              <FileField
                label="Preview video"
                accept='video/*'
                {...previewVideo}
                onFile={async (f: File) => {
                  const result = await previewVideo.upload(f, "preview-video");
                  if (result) {
                    setValue("previewVideo", result.url, { shouldValidate: true });
                    setValue('previewVideoPublicId', result.public_id, { shouldValidate: true });
                  }
                }}
                onCancel={previewVideo.cancel}
                isUploading={previewVideo.isUploading}
                progress={previewVideo.progress}
                url={watch("previewVideo") ?? ''}
                fileKind={'video'}
                error={
                  errors.previewVideo?.message ?? errors?.previewVideoPublicId?.message
                }
              />
              <Field label='Price' error={errors.price?.message}>
                <Input
                  required={true}
                  type={'number'}
                  step="1"
                  min={0}
                  max={100000}
                  {...register('price', { valueAsNumber: true })}
                  placeholder="e.g. ₹69/$69"
                />

              </Field>
              <Field label="Discount (%)" error={errors.discount?.message}>
                <Input
                  type="number"
                  min={0}
                  {...register('discount', { valueAsNumber: true })}
                  placeholder="e.g. 10,20,40"
                />
              </Field>
              <Field
                required={true}
                label="Category"
                error={errors.category?.name?.message ?? errors.category?.message}

              >
                <Select
                  value={parentCategory}
                  onValueChange={(v) => {
                    setParentCategory(v);
                    setValue('category.name', v, { shouldValidate: true })
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
              <Field label="SubCategory" error={errors.subCategory?.message} required={true}>
                <Controller
                  name='subCategory'
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      disabled={!parentCategory}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a Subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories.map((sub) => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                  )}

                />
              </Field>
              <Field label="Tags" error={errors.tags?.message} required={true}>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <CommaListField
                      inputType='text'
                      value={field.value ?? []}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="e.g. JavaScript Basics, React, Next.js"
                    />
                  )}
                />
              </Field>
              {sections.fields.length > 1 && <Field label="Total duration (seconds)" error={
                errors.totalDurationInSeconds?.message
              } required={true}>
                <Input readOnly value={fetchedCourse?.totalDurationInSeconds} type="number" disabled />
              </Field>
              }
              <Field label="Level" error={errors.level?.message} required={true}>
                <Controller
                  name="level"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
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
              <Field label="What you will learn" error={errors.whatYouWillLearn?.message} required={true}>
                <Controller
                  name="whatYouWillLearn"
                  control={control}
                  render={({ field }) => (
                    <CommaListField
                      inputType="text"
                      value={field.value ?? []}
                      onChange={field.onChange}
                      onBlur={field.onBlur}

                      placeholder="e.g. Variables, loops"
                    />
                  )}
                />
              </Field>
              <Field label="Requirements" error={errors.requirements?.message} required={true}>
                <Controller
                  name="requirements"
                  control={control}
                  render={({ field }) => (
                    <CommaListField
                      inputType="text"
                      value={field.value ?? []}
                      onChange={field.onChange}
                      onBlur={field.onBlur}

                      placeholder="e.g. HTML, CSS"
                    />
                  )}
                />
              </Field>
              <Field label="Language" error={errors.language?.message} required={true}>
                <Controller
                  name="language"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
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
              <Field label="Lesson release schedule" error={errors.dripType?.message} required={true}>
                <Controller
                  name="dripType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a release schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="sequential">Sequential</SelectItem>
                        <SelectItem value="drip-by-date">Drip by date</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Label className="my-4 mt-6">Topics to be covered</Label>

              <h3 className="mt-6 text-sm font-medium">Topics to be covered</h3>
              {/* item.id is the stable key, not the index */}
              {topics.fields.map((item, i) => (
                <div key={item.id} className="relative mb-4 space-y-2">
                  {/* remove button, hidden for the first topic */}
                  {i > 0 && (
                    <Button
                      type="button"
                      className="absolute right-2 top-0 text-lg"
                      onClick={() => topics.remove(i)}
                    >
                      <RxCross2 />
                    </Button>
                  )}
                  {/* topic name */}
                  <Field
                    label="Topic"
                    required={true}
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
                    required={true}
                    error={errors.topics?.[i]?.description?.message}
                  >
                    <Input {...register(`topics.${i}.description`)} />
                  </Field>
                  {/* active flag */}
                  <Field label="IsActive" error={errors.topics?.[i]?.isActive?.message} required={true}>
                    <Controller
                      control={control}
                      name={`topics.${i}.isActive`}
                      render={({ field }) => (
                        <BooleanSelect
                          value={field.value ?? false}
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

                  })
                }
              >
                + Add Topics
              </Button>
              <h3 className="mt-6 text-sm font-medium">Sections</h3>
              {errors.sections?.message && (
                <p className="text-sm text-destructive">
                  {errors.sections.message}
                </p>
              )}
              {/* lessons section */}
              {/* item.id is the stable key */}
              {sections.fields.map((section, sectionIndex) => {
                // Get the nested lessons field array for this specific section
                // const sectionLessons = useFieldArray({
                //   control,
                //   name: `sections.${sectionIndex}.lessons`,
                // });

                return (
                  <div key={section.id} className="relative">
                    <SectionItem
                      // Position of this section
                      sectionIndex={sectionIndex}
                      // First section cannot be removed
                      canRemove={sectionIndex > 0}
                      // Remove this section from the parent array
                      onRemove={() => sections.remove(sectionIndex)}
                    />
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
              <h3 className="mt-6 text-sm font-medium">Faqs</h3>
              {/* faq now uses useFieldArray fields, not form.faq */}
              {faq.fields.map((item, i) => (
                <div key={item.id} className="relative mb-4 space-y-2">
                  {/* remove button */}
                  {i > 0 && (
                    <Button
                      type="button"
                      className="absolute right-2 top-0 text-lg"
                      onClick={() => faq.remove(i)}
                    >
                      <RxCross2 />
                    </Button>
                  )}
                  {/* question: registered, so no manual onChange handler needed */}
                  <Field
                    label="Question"
                    error={errors.faq?.[i]?.question?.message}
                    required={true}
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
                    required={true}
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
              <Label className={"my-4"}>Faqs</Label>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            (

            <Button className="" size="default" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button className="" type="submit" form="edit-course-form" disabled={isSubmitting} size="default" variant="default" >
              {isSubmitting ? "Updating..." : "Update"}
            </Button>

            )
          </CardFooter>
        </Card>
      </FormProvider>
    </div >
  );
}

export default EditCourseComp;
