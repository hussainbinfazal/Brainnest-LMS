import { EnrollmentStatus } from '@repo/shared/models/Course/Enums';
import { Chat, Enrollment, Order, userCourse } from '@repo/shared/server';
import type { OrderDocument } from '@repo/shared/server';

import { ORDER_STATUS, PAYMENT_STATUS } from '../payment.constant';
import type { PaymentHandlers } from '../payment.types';

export const brainnestHandlers: PaymentHandlers = {
  ///Payment on Model
  ///Post Payment Settlement
  Course: {
    fulfill: async ({ payment, session }) => {
      const orderToFulfill: OrderDocument | null = await Order.findOne({
        user: payment.paymentBy,
        razorpayOrderId: payment.razorpayOrderId,
        status: {
          $in: [ORDER_STATUS.PENDING, ORDER_STATUS.FAILED],
        },
      }).session(session);
      if (!orderToFulfill)
        throw new Error(
          `Order for payment ${payment.razorpayOrderId} is not payable`,
        );

      const expectedAmountInPaise = Math.round(payment.amount * 100);
      const orderItem = orderToFulfill.orderItems.find(
        (item) => String(item.course) === String(payment.paymentOf),
      );
      const orderItemsAmountInPaise = orderToFulfill.orderItems.reduce(
        (total, item) => total + Math.round(item.price * 100),
        0,
      );
      if (
        !orderItem ||
        orderToFulfill.orderItems.length !== 1 ||
        Math.round(orderToFulfill.totalPrice * 100) !== expectedAmountInPaise ||
        Math.round(orderItem.price * 100) !== expectedAmountInPaise ||
        orderItemsAmountInPaise !== expectedAmountInPaise
      ) {
        throw new Error(
          `Order details do not match payment ${payment.razorpayOrderId}`,
        );
      }

      // Update Order status and payment details only after the order/payment match.
      const order: OrderDocument | null = await Order.findOneAndUpdate(
        {
          _id: orderToFulfill._id,
          user: payment.paymentBy,
          razorpayOrderId: payment.razorpayOrderId,
          status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.FAILED] },
        },
        {
          $set: {
            status: ORDER_STATUS.COMPLETED,
            isPaid: true,
            paymentMethod: payment.paymentMethod,
            razorpayOrderId: payment.razorpayOrderId,
            paymentResult: {
              id: payment.paymentId,
              status: PAYMENT_STATUS.COMPLETED,
              update_time: new Date().toISOString(),
            },
            paidAt: new Date(),
            totalPrice: payment.amount,
          },
        },
        { returnDocument: 'after', session },
      );
      if (!order)
        throw new Error(
          `Order for payment ${payment.razorpayOrderId} is not payable`,
        );
      const courseIds = order.orderItems.map(
        (item: OrderDocument['orderItems'][number]) => item.course,
      );

      await Enrollment.bulkWrite(
        courseIds.map((courseId) => ({
          updateOne: {
            filter: { user: order.user },
            update: {
              $set: {
                courseId: courseId,
                userId: payment.paymentBy,
                paymentId: payment._id,
                status: EnrollmentStatus.Completed,
                enrolledAt: new Date(),
              },
            },
            upsert: true,
          },
        })),
        { session },
      );

      /// Create user and link to course
      await userCourse.bulkWrite(
        courseIds.map((courseId) => ({
          updateOne: {
            filter: { user: payment.paymentBy, course: courseId },
            update: {
              $set: {
                user: payment.paymentBy,
                isEnrolledAt: true,
              },
            },
            upsert: true,
          },
        })),
        { session },
      );
    },
    // Called by the sweep when a payment is abandoned
    expire: async ({ payment, session }) => {
      await Order.updateOne(
        {
          user: payment.paymentBy,
          razorpayOrderId: payment.razorpayOrderId,
          status: ORDER_STATUS.PENDING,
        },
        {
          $set: {
            status: ORDER_STATUS.FAILED,
            paymentResult: {
              id: payment.paymentId,
              status: PAYMENT_STATUS.FAILED,
              update_time: new Date().toISOString(),
            },
          },
        },
        { session },
      );
    },
  },
  // paymentOnModel === "Chat"
  Chat: {
    // Runs inside the settle transaction
    fulfill: async ({ payment, session }) => {
      // Idempotent set, so no status filter that could wrongly return null on replay
      const chat = await Chat.findOneAndUpdate(
        { _id: payment.paymentOf },
        { $set: { isActive: true } },
        { new: true, session },
      );
      // Throw so the transaction aborts if the chat is missing
      if (!chat) throw new Error(`Chat ${payment.paymentOf} not found`);
    },
  },
};
