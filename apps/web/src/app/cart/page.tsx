import {Cart, ICart }from "@repo/shared";
import { JSX } from "react/jsx-runtime";
import CartPageComp from "../components/CartComp/CartComp";
import { auth } from "@/auth";
import { getCached, setCached, CACHE_TTL } from "@repo/shared/config/redisConfig/cache-helper";
import { serializeCart } from "@/utils/serializer/cart.Serializer";
import { CCart } from "@/types/client";
export async function CartPage(): Promise<JSX.Element> {
  const usersSession = await auth();
  if(!usersSession?.user?.id) return <CartPageComp />
  const authenticatedUserId : string = usersSession?.user.id;
  const cachedCoursesCartKey: string = `Cart:${authenticatedUserId}`;
  let usersCart = await getCached<CCart>("Cart", authenticatedUserId);
  
  if (!usersCart) {
    const rawCart = await Cart.findOne({ user: authenticatedUserId }).lean().exec();
    if (rawCart) {
      usersCart = serializeCart(rawCart) as CCart;
      await setCached("Cart", authenticatedUserId, usersCart, CACHE_TTL.MEDIUM);
    }
  }
  
  
  return <CartPageComp />;


};

export default CartPage;
