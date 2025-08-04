"use client";


import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
export default function Checkout({ course, user }) {
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const createOrder = async () => {
    try {
      const response = await axios.post('/api/payment/create-order', {
        courseId: course?._id,
        userId: user?._id,
        amount: course?.price
      });
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const verifyPayment = async (paymentData) => {
    try {
      const response = await axios.post('/api/payment/verify', {
        orderId: paymentData.razorpay_order_id,
        paymentId: paymentData.razorpay_payment_id,
        signature: paymentData.razorpay_signature,
        courseId: course?._id,
        userId: user?._id
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Create order in backend
      const order = await createOrder();
      setOrderData(order);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: course?.price * 100, // Amount in paisa
        currency: 'INR',
        name: 'Brainnest LMS',
        description: `Purchase: ${course.title}`,
        order_id: order.razorpayOrderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verification = await verifyPayment(response);
            
            if (verification.success) {
              alert('Payment successful! You now have access to the course.');
              // Redirect to course page or dashboard
              router.push(`/courses/${course?._id}`);
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone || ''
        },
        theme: {
          color: '#3399cc',
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razor = new window.Razorpay(options);
      razor.open();
    } catch (error) {
      console.error('Payment initiation failed:', error);
      alert('Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Complete Your Purchase</h2>
        
        {/* Course Details */}
        <div className="border rounded-lg p-4 mb-4">
          <img 
            src={course?.coverImage || '/api/placeholder/300/200'} 
            alt={course?.title}
            className="w-full h-32 object-cover rounded mb-3"
          />
          <h3 className="font-semibold text-lg">{course?.title}</h3>
          <p className="text-gray-600 text-sm mb-2">{course?.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-blue-600">₹{course?.price}</span>
            <span className="text-sm text-gray-500">Lifetime Access</span>
          </div>
        </div>

        {/* User Details */}
        <div className="border rounded-lg p-4 mb-4">
          <h4 className="font-semibold mb-2">Billing Details</h4>
          <p className="text-sm text-gray-600">Name: {user?.name}</p>
          <p className="text-sm text-gray-600">Email: {user?.email}</p>
          {user?.phone && <p className="text-sm text-gray-600">Phone: {user?.phone}</p>}
        </div>

        {/* Payment Button */}
        <button 
          onClick={handlePayment} 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : `Pay ₹${course?.price}`}
        </button>

        <p className="text-xs text-gray-500 mt-2 text-center">
          Secure payment powered by Razorpay
        </p>
      </div>
    </div>
  );
}

