import Cart from "@/models/Cart/cartModel";
import { JSX } from "react/jsx-runtime";
import CartPageComp from "../components/CartComp/CartComp";
import { redisClient } from "@/config/redis/redis";
import { ICart } from "@/types/model";
import { auth } from "@/auth";
export async function CartPage(): Promise<JSX.Element> {
  const usersSession = await auth();
  const authenticatedUserId = usersSession?.user.id || "";
  const cachedCoursesCartKey: string = `Cart:${authenticatedUserId}`;
  const cachedCart: ICart | null = await redisClient.get(cachedCoursesCartKey);
  let usersCart: ICart | null = null;
  if (cachedCart) {
    usersCart = cachedCart as ICart;
  } else {
    usersCart = (await Cart.findOne({ user: authenticatedUserId })

      .lean()) as ICart | null;
    if (usersCart) {
      await redisClient.set(cachedCoursesCartKey, JSON.stringify(usersCart) as string, { ex: 600 }); // 10 min
    }
  }
  // const course = await Course.findById(courseId)
  //   .select("title description coverImage rating price category lessons.name lessons.duration instructor reviews")
  //   .populate("instructor", "name profileImage")
  //   .lean();

  return <CartPageComp />;


};

export default CartPage;
