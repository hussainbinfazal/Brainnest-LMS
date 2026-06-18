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