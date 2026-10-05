

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BiBold } from "react-icons/bi";
import { FaItalic } from "react-icons/fa";
import { MdFormatUnderlined } from "react-icons/md";
import { FaListUl } from "react-icons/fa";
import { CgUndo } from "react-icons/cg";
import { FaRedoAlt } from "react-icons/fa";

export type ToolbarItem = {
  //Unique id
  id: string;
  //Accessible label for screen readers
  label: string;
  //What is drawn inside the button
  content: ReactNode;
  //The mark /node name to check with the editor.isActive(undefined = no active state)
  activeName?: string;
  ///The command that runs when the button is clicked
  run: (editor: Editor) => void;
};

export const TOOLBAR_ITEMS: ToolbarItem[] = [
  {
    //id for the bold button
    id: "bold",
    //Screen reader label
    label: "Bold",
    //Bold Icon
    content: <BiBold />,
    //Name used by isActive
    activeName: 'bold',
    ///Toggle bold on the current selection 
    run: (editor) => editor.chain().focus().toggleBold().run()
  }, {
    ///Id for the Italic Button
    id: 'italic',
    label: 'italic',
    content: <FaItalic />,
    activeName: 'italic',
    run: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    id: 'underline',
    label: 'underline',
    content: <MdFormatUnderlined />,
    activeName: 'underline',
    run: (editor) => editor.chain().focus().toggleUnderline().run(),
  }, {
    id: 'bullet-list',
    label: 'Bullet List',
    content: <FaListUl />,
    activeName: "bulletList",
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  }, {
    id: 'orderedList',
    label: "Numbered list",
    content: "1. List",
    activeName: 'orderedList',
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'undo',
    label: "Undo",
    content: <CgUndo />,
    run: (editor) => editor.chain().focus().undo().run(),
  }, {
    id: 'redo',
    label: "Redo",
    content: <FaRedoAlt />,
    run: (editor) => editor.chain().focus().redo().run(),
  }
];