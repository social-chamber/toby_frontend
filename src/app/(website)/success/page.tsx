"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

const SuccessPage = () => {
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    // Try to get booking ID from sessionStorage (set during payment process)
    const storedBookingId = sessionStorage.getItem("pendingBookingId");
    if (storedBookingId) {
      setBookingId(storedBookingId);
      // Clear the session storage after retrieving
      sessionStorage.removeItem("pendingBookingId");
    }
  }, []);

  // Fetch booking details if we have a booking ID
  const { data: bookingData, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/payment/booking/${bookingId}`
      );
      if (!res.ok) throw new Error("Failed to fetch booking");
      return res.json();
    },
    enabled: !!bookingId,
  });

  const booking = bookingData?.data;

  return (
    <div className="my-32">
      <Card className="w-full max-w-md mx-auto shadow-md">
        <CardContent className="pt-6 px-6 pb-0">
          <div className="flex flex-col items-center mb-6">
            <div className="rounded-full bg-green-500 p-2 mb-2">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-center">
              Payment Successful!
            </h2>
            <p className="text-center text-sm text-green-600 mt-1">
              Your payment has been processed successfully. Your booking is now
              confirmed!
            </p>
          </div>

          <h1 className="text-2xl font-bold mb-4">Thank You!</h1>

          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-gray-600">Loading booking details...</p>
            </div>
          ) : booking ? (
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Status:</span>
                <span className="text-green-600 font-semibold">Confirmed</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Booking ID:</span>
                <span className="text-gray-600">{booking._id}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Name:</span>
                <span className="text-gray-600">
                  {booking?.user?.firstName} {booking?.user?.lastName}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Email:</span>
                <span className="text-gray-600">{booking?.user?.email}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Phone:</span>
                <span className="text-gray-600">{booking?.user?.phone}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Category:</span>
                <span className="text-gray-600">
                  {booking?.service?.category?.name}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Room:</span>
                <span className="text-gray-600">{booking?.room?.title}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Service:</span>
                <span className="text-gray-600">{booking?.service?.name}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Date:</span>
                <span className="text-gray-600">
                  {new Date(booking?.date).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Time:</span>
                <span className="text-gray-600">
                  {booking?.timeSlots
                    ?.map(
                      (slot: { start: string; end: string }) =>
                        `${slot.start} - ${slot.end}`
                    )
                    .join(", ")}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Status:</span>
                <span className="text-green-600 font-semibold">Confirmed</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Next Steps:</span>
                <span className="text-gray-600">Check your email</span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="px-6 py-4 flex flex-col items-center gap-4">
          <p className="text-sm text-gray-600 text-center">
            📬 Please check your email for the confirmation message and booking
            details. If you don&apos;t see it, make sure to check your spam or
            junk folder as well.
          </p>
          <div className="flex gap-2 w-full">
            <Link href={"/"} className="flex-1">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                Go to Home
              </Button>
            </Link>
            {bookingId && (
              <Link href={`/success/${bookingId}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </Link>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SuccessPage;
