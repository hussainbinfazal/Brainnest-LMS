"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";

import { FaRedoAlt } from "react-icons/fa";
import { TOOLBAR_ITEMS, ToolbarItem } from "./TipTap.Tools";

// Classes applied directly to the contenteditable div (.ProseMirror)
const EDITOR_CLASSES = [
  // Make the whole box clickable and give it a minimum height
  "min-h-[150px] p-3",
  // Use the Inter font, a readable size, and comfortable line spacing
  "font-sans text-base leading-relaxed",
  // Remove the browser's default focus outline (the wrapper shows focus instead)
  "focus:outline-none",
  // Restore bullet styles that Tailwind preflight removes
  "[&_ul]:list-disc [&_ul]:pl-6",
  // Restore numbered list styles that Tailwind preflight removes
  "[&_ol]:list-decimal [&_ol]:pl-6",
].join(" ");


const Tiptap = ({ description, onChange }: { description: string; onChange: (html: string) => void }) => {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: description || "",
    immediatelyRender: false, //// // Wait for the browser before creating the editor, this removes the SSR mismatch
    editorProps: {
      attributes: {
        class: EDITOR_CLASSES,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },

  });

  useEffect(() => {
    if (!editor) return;
    //Never overwrite when the user is typing(don't jump the cursor)
    if (editor.isFocused) return;
    ///Normalized the incoming value so undefined and "" behave the same
    const incoming = description || ""
    ///An empty editor returns "<p></p>, so treat it as "" before comparison"
    const current = editor.isEmpty ? "" : editor.getHTML();
    //Only touch the editor if the content is really different
    if (incoming !== current) {
      //Replace the editor with the new value
      editor.commands.setContent(incoming);
    };
  }, [description, editor]);

  if (!editor) return null;

  return (
    <div className="space-y-2 border rounded-md p-2 focus-within:ring-1 focus-within:ring-ring">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 mb-2 pl-1">
        {TOOLBAR_ITEMS.map((item: ToolbarItem) => (
          // Button for this toolbar item
          <Button
            // Unique key for React's list diffing
            key={item.id}
            // Prevent accidental form submission
            type="button"
            // Small button size
            size="sm"
            // Highlight when the mark is active, otherwise outline style
            variant={
              item.activeName && editor.isActive(item.activeName)
                ? "default"
                : "outline"
            }
            // Accessible name, since most buttons are icon-only
            aria-label={item.label}
            // Run this item's command
            onClick={() => item.run(editor)}
          >
            {/* Icon or text for this button */}
            {item.content}
          </Button>
        ))}

      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
      // className="min-h-37.5 border rounded-md p-3 "
      />
    </div>
  );
};

export default Tiptap;
