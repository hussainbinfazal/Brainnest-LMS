import { JSX } from "react/jsx-runtime";
import { AuthPageComp } from "../components/AuthPage/AuthPage";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";


const AuthPage = async (): Promise<JSX.Element> => {
  const session: Session | null = await auth();

  if (session?.user) {
    redirect("/"); //Explicit redirect the user to the homepage
  };

  return <AuthPageComp />;
};

export default AuthPage;
