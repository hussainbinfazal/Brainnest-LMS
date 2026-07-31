import { CCart, CChat } from "@/types/client";
import { serializeDocument } from "./serializeDocument";
import { ICart, IChat } from "@repo/shared";

export function serializeCart(cart: ICart): CCart {
    return serializeDocument(cart) as unknown as CCart;
}
export function serializeCarts(carts: ICart[]): CCart[] {
    return serializeDocument(carts) as unknown as CCart[];
}