import { Cart, CART_BY_USER, ICart, logger } from "@repo/shared";
import { JSX } from "react/jsx-runtime";
import CartPageComp from "../components/CartComp/CartComp";
import { auth } from "@/auth";
import { getCached, setCached, CACHE_TTL } from "@repo/shared/config/redisConfig/cache-helper";
import { serializeCart } from "@/utils/serializer/cart.Serializer";
import { CCart } from "@/types/client";
export async function CartPage(): Promise<JSX.Element> {
  const usersSession = await auth();
  if (!usersSession?.user?.id) return <CartPageComp />
  const authenticatedUserId: string = usersSession?.user.id;
  let usersCart = await getCached<CCart>(CART_BY_USER.namespace, authenticatedUserId);

  if (!usersCart) {
    const rawCart = await Cart.findOne({ user: authenticatedUserId }).lean().exec();
    if (rawCart) {
      usersCart = serializeCart(rawCart) as CCart;
      await setCached(CART_BY_USER.namespace, authenticatedUserId, usersCart, CACHE_TTL.MEDIUM);
    } else {
      logger.info("No cart found for user", { userId: authenticatedUserId });
    }
  }
  return <CartPageComp />;


};

export default CartPage;
