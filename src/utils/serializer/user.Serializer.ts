import { IUser } from "@/types/model";
import { serializeDocument } from "./serializeDocument";
import { CAuthUser } from "@/types/client";

export function serializeUser(user: IUser): CAuthUser {
    return serializeDocument(user) as unknown as CAuthUser;
}