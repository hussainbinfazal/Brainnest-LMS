"use client"

import { useCallback, useRef, useState } from "react";

import axios from 'axios'
import { clientLogger } from "@/utils/clientLogger/clientLogger";
import { getErrorMessage } from "@repo/shared";


declare global {
    interface Window {
        Razorpay: any;
    }
};


export type CCheckoutStatus = "idle" | 'creating' | 'awaiting_payment' | 'verifying' | 'confirming' | 'success' | 'failed';
export enum CheckoutStatus {
    idle = 'idle',
    creating = 'creating',
    awaiting = 'awaiting_payment',
    verifying = 'verifying',
    confirming = 'confirming',
    success = 'success',
    failed = 'failed'
}


interface CreateOrderResponse {
    ///razory pay order Id
    razorpayOrderId: string;
    amount: number;
    currency: string
}

export interface UseRazorpayCheckoutOptions {
    createOrderUrl: string;
    verifyUrl: string;
    statusUrl: string;
    brandName?: string;
    themeColor?: string;
    onSuccess?: () => void;
    onError?: (messge: string) => void
}

export interface CheckoutInput {
    payload: Record<string, unknown>;
    description?: string;
    prefill?: { name?: string; email?: string; contact?: string };
}


const SCRIPT_SRC = process.env.NEXT_PUBLIC_RAZORPAY_SCRIPT
// Shared promise so the script is added once, even with several hook instances
let scriptPromise: Promise<boolean> | null = null;

// Loads checkout.js on demand
function loadRazorpayScript(): Promise<boolean> {
    if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve(true)
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise<boolean>((resolve) => {
        const script: HTMLScriptElement = document.createElement('script');
        script.src = SCRIPT_SRC!;
        script.async = true;
        script.onload = () => {
            resolve(true);
        }
        script.onerror = () => {
            scriptPromise = null;
            resolve(false);
        }
        document.body.appendChild(script);
    })
    return scriptPromise;
}


async function pollOrderStatus(url: string, razorpayOrderId: string): Promise<boolean> {
    // 10 tries x 3s = 30s total
    for (let attempt = 0; attempt < 10; attempt++) {
        ///Resolve promise after 3s
        await new Promise((resolve) => setTimeout(resolve, 3000));
        try {
            const { data } = await axios.get(url, { params: { razorpayOrderId } })

            //If Done
            if (data.status === 'Completed') return true;
        } catch {

        }
    }
    ///Still not done after 30 sec
    return false;
}


////The main hook
export function useRazorpayCheckout(options: UseRazorpayCheckoutOptions) {
    const [status, setStatus] = useState<CCheckoutStatus>(CheckoutStatus.idle);
    ///Last Error Message 
    const [error, setError] = useState<string | null>(null);
    ///Mirror of status readable inside razorpay callbacks
    const statusRef = useRef<CCheckoutStatus>(CheckoutStatus.idle);
    ///block double click
    const busy = useRef(false)
    ///Always hold the latest option, so callbacks below stay stable
    const optionRef = useRef(options);
    ///Refresh on every render
    optionRef.current = options;

    ///Status update
    const update = useCallback((next: CCheckoutStatus) => {
        // Ref first so callbacks see it immediately
        statusRef.current = next

        ///Then local state for rendering
        setStatus(next)
    }, [])


    //Terminal Failure Path
    const fail = useCallback((message: string) => {
        ///store the message first
        setError(message);
        ///Then update status to failed
        update(CheckoutStatus.failed);
        ///Allow another attempt
        busy.current = false;
        ///Store the message to show as a toast
        optionRef.current.onError?.(message);
    }, [update]) ///Only re render when status updates

    //Terminal Success Path
    const succeed = useCallback(() => {
        ///Move to success
        update(CheckoutStatus.success)
        ///Allow future purchase
        busy.current = false;
        ///Show success toast
        optionRef.current.onSuccess?.()
    }, [[update]])



    ///The check out call

    const checkout = useCallback(
        async (input: CheckoutInput) => {
            ///Block double click
            if (busy.current) return;
            ///Lock UI
            busy.current = true
            ///Clear the previous error
            setError(null);

            try {
                update(CheckoutStatus.creating);
                ///Load script First
                const scriptLoaded = await loadRazorpayScript();
                if (!scriptLoaded) return fail("Could not load the payment window. Check your connection.");

                ///server creates Order, Payment and Razorpay Order from the item Id
                const { data: createdPayment } = await axios.post<CreateOrderResponse>(
                    ///Create Order API Url
                    optionRef.current.createOrderUrl,
                    ///Data required by create route in the object form
                    input.payload
                )
                ///update status to awaiting payment
                update(CheckoutStatus.awaiting);

                ///Checkout Instance

                const razorpay = new window.Razorpay({
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
                    key_secret: process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET!,
                    order_id: createdPayment.razorpayOrderId,
                    // Amount from our server,
                    amount: createdPayment.amount,
                    currency: createdPayment.currency,
                    name: optionRef.current.brandName,
                    description: input.description,
                    prefill: input.prefill,
                    theme: {
                        color: optionRef.current.themeColor
                    },
                    // Runs when the user finishes paying; may NEVER run if the tab dies, and that is fine
                    handler: async (response: {
                        razorpay_payment_id: string;
                        razorpay_order_id: string;
                        razorpay_signature: string;
                    }) => {
                        update(CheckoutStatus.verifying);

                        try {//Send only the three values returned by Checkout; the server fetches payment details.
                            await axios.post(
                                optionRef.current.verifyUrl, {
                                orderId: response.razorpay_order_id,
                                paymentId: response.razorpay_payment_id,
                                signature: response.razorpay_signature,
                            })
                            ///Verified and Settled
                            succeed()
                            ///Verify and settle the payment}
                        } catch (verifyError) {
                            if (axios.isAxiosError(verifyError) &&
                                verifyError.response &&
                                verifyError.response.status < 500
                            ) {
                                clientLogger.error("Payment Verify Error", verifyError)
                                return fail(getErrorMessage(verifyError, "Payment verification failed."));
                            }
                            //Could be network error or 500: the money may already captured by the server
                            update(CheckoutStatus.confirming);
                            const confirmed = await pollOrderStatus(
                                optionRef.current.statusUrl,
                                response.razorpay_order_id
                            )
                            if (confirmed) return succeed();/// Payment settled by webhook
                            fail("We are still confirming your payment. if money was deducted, access will appear shortly.");
                        }


                    },
                    ///User closed the window
                    modal: {
                        ///Fires when the window is dismissed
                        ondismiss: () => {
                            // Only reset if they had not paid yet; after paying, the handler owns the state
                            if (statusRef.current === CheckoutStatus.awaiting) {
                                //Back to idle not failed: they changed their mind
                                update(CheckoutStatus.idle);
                                // Unlock
                                busy.current = false
                            }
                        }
                    }
                })
                ///Open the razorpay checkout window
                razorpay.open()
            } catch (createError) {
                ///Creating the order failed (not logged in, item missing, server down)
                fail(getErrorMessage(createError, "Could not start the payment. Please try again."));

            }

        }, [fail, succeed, update],
    )
    return {
        //Start purchase with checkout
        checkout,
        //Current State
        status,
        //Last Error, if any
        error,
        //True while any step is in flight (for disabling buttons)
        isBusy: status !== CheckoutStatus.idle && status !== CheckoutStatus.failed && status !== CheckoutStatus.success
    };
};