// handles course + order + enrollment
async function reconcileCoursePayment({ payment, session }) {
  const order = await Order.findOne({
    _id: payment.paymentOf,
    status: 'pending'
  }).session(session);

  if (!order) return;

  const courseIds = order.orderItems.map(item => item.course);

  await Promise.all([
    payment.save({ session }),

    Order.findOneAndUpdate(
      { _id: order._id, status: 'pending' },
      { status: 'completed', isPaid: true, paidAt: new Date() }
    ).session(session),

    Enrollment.bulkWrite(
      courseIds.map(courseId => ({
        updateOne: {
          filter: { paymentId: payment.paymentId, courseId, status: 'Pending' },
          update: { $set: { status: 'Completed', enrolledAt: new Date() } }
        }
      })),
      { session }
    ),

    userCourse.bulkWrite(
      courseIds.map(courseId => ({
        updateOne: {
          filter: { userId: order.userId, courseId },
          update: { $set: { isEnrolled: true, enrolledAt: new Date() } },
          upsert: true
        }
      })),
      { session }
    )
  ]);
}

// handles chat payment
async function reconcileChatPayment({ payment, session }) {
  const chat = await Chat.findOne({
    _id: payment.paymentOf,
    status: 'pending'       // 👈 whatever your chat pending state is
  }).session(session);

  if (!chat) return;

  await Promise.all([
    payment.save({ session }),

    Chat.findOneAndUpdate(
      { _id: chat._id },
      { status: 'active' }  // 👈 whatever activated state is
    ).session(session),

    // any other chat-specific updates
  ]);
}