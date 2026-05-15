import AdminChatComp from "@/app/components/AdminComp/AdminChatComp/AdminChatComp";
import { JSX } from "react/jsx-runtime";


type MinimalUser = {
  _id: string;
  name: string;
  profileImage: string;
};

export default function AdminChatPage() :JSX.Element {
  return <AdminChatComp />;
}
