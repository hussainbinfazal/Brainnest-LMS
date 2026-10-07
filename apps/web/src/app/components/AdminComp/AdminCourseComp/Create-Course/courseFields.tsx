// small reusable pieces that kill the repeated JSX

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import RHF context hook and controller
import { Controller, useFormContext } from "react-hook-form";
// import ui pieces
import { RxCross2 } from "react-icons/rx";
// import shared field pieces

// import hooks and types
import { useFileUploadField } from "@/hooks/Video/useFileUploadField";
import { CCreateCourse } from "@/utils/fieldsValidation/Client/courseSchemaValidation";
import { ProgressScroller } from "@/app/components/Scroller";
import { Button } from "@/components/ui/button";

////Course --------------------------------------------
///Label + input slot + error.message used by every field
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    // vertical spacing wrapper
    <div className="space-y-2">
      {/* field label */}
      <Label>{label}</Label>
      {/* the actual input */}
      {children}
      {/* error text only when present */}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
const getFileKind = (file: File): "image" | "video" | "other" => {
  // Any MIME type starting with "video/" is a video
  if (file.type.startsWith("video/")) return "video";
  // Any MIME type starting with "image/" is an image
  if (file.type.startsWith("image/")) return "image";
  // Anything else (pdf, zip, etc.)
  return "other";
};
///File input with skeleton while uploading
export function FileField(props: {
  label: string;
  accept: string;
  isUploading: boolean;
  fileName: string;
  fileKind: "image" | "video" | "other";
  url: string;
  onFile: (file: File) => void;
  error?: string;
  onCancel?: () => void;
  onClear?: () => void;
  progress: number;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    //reuse field for label + error
    <Field label={props.label} error={props.error}>
      {props.isUploading ? (<>
        <Skeleton className="h-10 w-full skeleton-shimmer" />
        <ProgressScroller progress={props.progress} className={"mt-2"} />
        <Button
          type="button"
          className="absolute right-2 top-0 text-lg"
          onClick={props.onCancel}
        >
          <RxCross2 />
        </Button>
      </>) : (
        <>
          {/* Keep the native picker hidden; the button below opens it. */}
          <Input
            ref={fileInputRef}
            type="file"
            accept={props.accept}
            className="hidden"
            onChange={(e) => {
              const file: File | undefined = e.target.files?.[0];
              e.currentTarget.value = "";
              if (file) props.onFile(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}

          >
            {props.fileName || props.url ? "Choose another file" : "Choose file"}
          </Button>
          {/* show chosen file name */}
          {props.fileName && (
            <p className="mt-1 text-sm text-gray-500">{props.fileName}</p>
          )}
          {/* Show a preview only when a URL exists */}
          {props.url &&
            // Video gets a player, image gets an <img>, anything else gets a plain link
            (props.fileKind === "video" ? (
              <video
                // Where the video file lives
                src={props.url}
                // Show play, pause, and seek controls
                controls
                // Load only metadata (duration, first frame), not the whole file
                preload="metadata"
                // Responsive width, limited height, black bars around odd aspect ratios
                className="mt-2 max-h-64 w-full rounded-md bg-black"
              />
            ) : props.fileKind === "image" ? (
              <img
                // Where the image file lives
                src={props.url}
                // Describe the image for screen readers
                alt={props.fileName ?? "Uploaded file"}
                // Responsive width, limited height, keep the full image visible
                className="mt-2 max-h-64 w-full rounded-md object-contain"
              />
            ) : (
              <a
                // Where the file lives
                href={props.url}
                // Open in a new tab
                target="_blank"
                // Security: stop the new tab from accessing this page
                rel="noopener noreferrer"
                // Link styling
                className="mt-2 inline-block text-sm text-blue-600 underline"
              >
                {/* Link text */}
                Open file
              </a>
            ))}
        </>
      )}
    </Field>
  );
}
// Stable empty array, so the default does not change identity on every render
const EMPTY: string[] = [];
// Turn "a, b,, c" into ["a", "b", "c"]
const parse = (raw: string): string[] => raw.split(',').map((s) => s.trim()).filter(Boolean)

export function CommaListField(props: {
  value: string[];
  onChange: (v: string[]) => void;
  onBlur?: () => void
  placeholder?: string;
}) {
  // Fall back to the stable empty array
  const value: string[] = props.value ?? EMPTY
  //raw text lives here, not in the form
  const [text, setText] = useState(value.join(", "));
  /// Resync only when the form value really differs from what the user sees
  useEffect(() => {
    // Parse the text as currently typed
    const current = parse(text);
    // A reset or async load changes the value; normal typing does not, so commas survive
    //does what's in the input already mean the same thing as the form's array
    //user>raw>parsed>form
    if (JSON.stringify(current) !== JSON.stringify(value)) setText(value.join(", "));
    // text is intentionally omitted, this must run when the form value changes, not on each keystroke
  }, [props.value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Input
      value={text}
      placeholder={props.placeholder}
      onChange={(e) => {
        setText(e.target.value);
        // Push the parsed array into the form immediately
        props.onChange(parse(e.target.value));
      }}
      // parse and commit when the user leaves the field
      onBlur={() => {
        // props.onChange(parse(text).join(', '));
        // normalise what the user sees
        setText(parse(text).join(", "));
        props.onBlur?.();
      }}
    />
  );
}

// true/false select that maps to a real boolean
export function BooleanSelect(props: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    //convert between string and boolean at the boundary
    <Select
      value={String(props.value)}
      onValueChange={(v) => props.onChange(v === "true")}
    >
      {/* trigger */}
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      {/* options */}
      <SelectContent>
        <SelectItem value="true">True</SelectItem>
        <SelectItem value="false">False</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function LessonItem({
  sectionIndex,
  lessonIndex,
  canRemove,
  onRemove,
}: {
  sectionIndex: number;
  lessonIndex: number;
  canRemove: boolean;
  onRemove: () => void;
}) {
  // read form helpers from the provider, no prop drilling
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<CCreateCourse>();
  // separate upload state for the main video
  const video = useFileUploadField();
  // separate upload state for the preview video
  const preview = useFileUploadField();
  // shortcut to this lesson's errors
  const err = errors.sections?.[sectionIndex]?.lessons?.[lessonIndex];
  ///main video: upload, the store the url and duration
  const handleVideo = async (file: File) => {
    //uplaod and get url
    const result = await video.upload(file, "lecture-video");
    const { url, duration } = result!;
    if (!url || !duration) return;
    setValue(`sections.${sectionIndex}.lessons.${lessonIndex}.videoUrl`, url, { shouldValidate: true });
    setValue(`sections.${sectionIndex}.lessons.${lessonIndex}.durationInSeconds`, Number(duration));
  };
  ///preview video: upload, the store the url and duration
  const handlePreview = async (file: File) => {
    //uplaod and get url
    const result = await preview.upload(file, "preview-video");
    const { url, duration } = result!;
    if (!url || !duration) return;
    ///Field in schema, value and validation
    setValue(`sections.${sectionIndex}.lessons.${lessonIndex}.previewUrl`, url, { shouldValidate: true });
    setValue(`sections.${sectionIndex}.lessons.${lessonIndex}.previewDurationInSeconds`, Number(duration));
  };
  return (
    <div className="relative mb-4 space-y-2">
      {/* remove button, hidden for the first lesson */}
      {canRemove && (
        <button
          type="button"
          className="absolute right-2 top-0 text-lg"
          onClick={onRemove}
        >
          <RxCross2 />
        </button>
      )}
      {/* lesson name */}
      <Field label="Name" error={err?.name?.message}>
        <Input
          {...register(`sections.${sectionIndex}.lessons.${lessonIndex}.name`)}
          placeholder="e.g. JavaScript Basics"
        />
      </Field>
      {/* lesson description */}
      <Field label="Description" error={err?.description?.message}>
        <Input
          {...register(`sections.${sectionIndex}.lessons.${lessonIndex}.description`)}
          placeholder="e.g. Variables, loops, functions"
        />
      </Field>
      {/* main video upload */}
      <FileField
        label="Video"
        accept="video/*"
        {...video}
        onFile={handleVideo}
        url={watch(`sections.${sectionIndex}.lessons.${lessonIndex}.videoUrl`) ?? ""}
        fileKind={"video"}
        error={err?.videoUrl?.message}
      />
      {/* readOnly, NOT disabled: disabled inputs submit undefined in RHF */}
      <Field label="Duration (seconds)" error={err?.durationInSeconds?.message}>
        <Input
          type="number"
          readOnly
          {...register(`sections.${sectionIndex}.lessons.${lessonIndex}.durationInSeconds`, {
            valueAsNumber: true,
          })}
        />
      </Field>
      {/* lesson order */}
      <Field label="Order">
        <Input
          type="number"
          {...register(`sections.${sectionIndex}.lessons.${lessonIndex}.order`, { valueAsNumber: true })}
        />
      </Field>
      {/* is this lesson a free preview */}
      <Field label="IsPreview">
        <Controller
          control={control}
          name={`sections.${sectionIndex}.lessons.${lessonIndex}.isPreview`}
          render={({ field }) => (
            <BooleanSelect value={field.value} onChange={field.onChange} />
          )}
        />
      </Field>
      {/* preview video upload */}
      <FileField
        label="Preview video"
        accept="video/*"
        {...preview}
        onFile={handlePreview}
        url={watch(`sections.${sectionIndex}.lessons.${lessonIndex}.previewUrl`) ?? ""}
        fileKind="video"
        error={err?.previewUrl?.message}
      />
    </div>
  );
}
