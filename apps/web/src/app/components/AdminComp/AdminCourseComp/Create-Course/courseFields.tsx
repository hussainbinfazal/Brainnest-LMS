// small reusable pieces that kill the repeated JSX

import { useState, type ReactNode } from "react";

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

///File input with skeleton while uploading
export function FileField(props: {
  label: string;
  accept: string;
  isUploading: boolean;
  fileName: string;
  onFile: (file: File) => void;
  error?: string;
}) {
  return (
    //reuse field for label + error
    <Field label={props.label} error={props.error}>
      {props.isUploading ? (
        <Skeleton className="h-10 w-full skeleton-shimmer" />
      ) : (
        <>
          {/* file picker, hand the first file to the parent */}
          <Input
            type="file"
            accept={props.accept}
            onChange={(e) => {
              // optional chaining avoids crash when selection is cancelled
              const file: File | undefined = e.target.files?.[0];
              // only call parent when a file exists
              if (file) props.onFile(file);
            }}
          />
          {/* show chosen file name */}
          {props.fileName && (
            <p className="mt-1 text-sm text-gray-500">{props.fileName}</p>
          )}
        </>
      )}
    </Field>
  );
}
export function CommaListField(props: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  //raw text lives here, not in the form
  const [text, setText] = useState(props.value.join(", "));
  return (
    <Input
      value={text}
      placeholder={props.placeholder}
      onChange={(e) => {
        setText(e.target.value);
      }}
      // parse and commit when the user leaves the field
      onBlur={(e) => {
        const items = text
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        props.onChange(items);
        // normalise what the user sees
        setText(items.join(", "));
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
  index,
  canRemove,
  onRemove,
}: {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
}) {
  // read form helpers from the provider, no prop drilling
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<CCreateCourse>();
  // separate upload state for the main video
  const video = useFileUploadField();
  // separate upload state for the preview video
  const preview = useFileUploadField();
  // shortcut to this lesson's errors
  const err = errors.lessons?.[index];
  ///main video: upload, the store the url and duration
  const handleVideo = async (file: File) => {
    //uplaod and get url
    const result = await video.upload(file, "lecture-video");
    const { url, duration } = result!;
    if (!url || !duration) return;
    setValue(`lessons.${index}.videoUrl`, url, { shouldValidate: true });
    setValue(`lessons.${index}.durationInSeconds`, Number(duration));
  };
  ///preview video: upload, the store the url and duration
  const handlePreview = async (file: File) => {
    //uplaod and get url
    const result = await preview.upload(file, "preview-video");
    const { url, duration } = result!;
    if (!url || !duration) return;
    ///Field in schema, value and validation
    setValue(`lessons.${index}.previewUrl`, url, { shouldValidate: true });
    setValue(`lessons.${index}.previewDurationInSeconds`, Number(duration));
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
          {...register(`lessons.${index}.name`)}
          placeholder="e.g. JavaScript Basics"
        />
      </Field>
      {/* lesson description */}
      <Field label="Description" error={err?.description?.message}>
        <Input
          {...register(`lessons.${index}.description`)}
          placeholder="e.g. Variables, loops, functions"
        />
      </Field>
      {/* main video upload */}
      <FileField
        label="Video"
        accept="video/*"
        {...video}
        onFile={handleVideo}
        error={err?.videoUrl?.message}
      />
      {/* readOnly, NOT disabled: disabled inputs submit undefined in RHF */}
      <Field label="Duration (seconds)" error={err?.durationInSeconds?.message}>
        <Input
          type="number"
          readOnly
          {...register(`lessons.${index}.durationInSeconds`, {
            valueAsNumber: true,
          })}
        />
      </Field>
      {/* lesson order */}
      <Field label="Order">
        <Input
          type="number"
          {...register(`lessons.${index}.order`, { valueAsNumber: true })}
        />
      </Field>
      {/* is this lesson a free preview */}
      <Field label="IsPreview">
        <Controller
          control={control}
          name={`lessons.${index}.isPreview`}
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
        error={err?.previewUrl?.message}
      />
    </div>
  );
}
