"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBookingStore } from "@/store/booking";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useSession } from "next-auth/react";
import { calculateBookingPrice, formatPrice } from "@/lib/pricingUtils";

const bookingSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Required"),
  specialRequirements: z.string().optional(),
  numberOfPeople: z.number().min(1, "At least one person"),
  promoCode: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function ConfirmDetails() {
  const {
    categoryId,
    room,
    service,
    selectedTimeSlot,
    selectedDate,
    setStep,
    selectedCategoryName,
  } = useBookingStore();

  const { mutate: paymentIntent, isPending: isPaymentIntentLoading } =
    useMutation({
      mutationKey: ["payment-intent"],
      mutationFn: (bookingId: string) =>
        fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/payment/payment-intent`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              booking: bookingId,
            }),
          }
        ).then((res) => res.json()),
      onSuccess: (data) => {
        if (!data.status) {
          toast.error(data.message);
          return;
        }

        // handle success
        // console.log("Payment Intent Success:", data.data);

        window.location.href = data.data.url;
      },
    });

  const { data: session } = useSession();
  const token = (session?.user as { accessToken: string })?.accessToken;

  // bokking
  // const { isPending, mutate } = useMutation({
  //   mutationKey: ["booking"],
  //   mutationFn: (body: any) =>
  //     fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/booking`, {
  //       method: "POST",
  //       headers: {
  //         "content-type": "application/json",
  //       },
  //       body: JSON.stringify(body),
  //     }).then((res) => res.json()),
  //   onSuccess: (data) => {
  //     if (!data.status) {
  //       toast.error(data.message);
  //       return;
  //     }
  //     // call with booking id
  //     paymentIntent(data.data._id);
  //   },
  //   onError: (err) => {
  //     toast.error(err.message);
  //   },
  // });

  // manual booking

  const { isPending, mutate } = useMutation({
    mutationKey: ["booking"],
    mutationFn: async (body: any) => {
      const headers: HeadersInit = {
        "content-type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      console.log("Sending request to:", `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/booking`);
      console.log("Request headers:", headers);
      console.log("Request body:", body);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/booking`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        }
      );
      
      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let responseText = "";
        
        try {
          responseText = await response.text();
          console.error("Raw response text:", responseText);
          
          if (responseText.trim()) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
            console.error("Backend Error Details:", errorData);
          } else {
            console.error("Empty response body");
            errorMessage = `Server returned empty response (${response.status})`;
          }
        } catch (parseError) {
          console.error("Could not parse error response:", parseError);
          console.error("Response text was:", responseText);
          errorMessage = `Server error (${response.status}): ${responseText || 'Empty response'}`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    // onSuccess callback
    onSuccess: (data) => {
      if (!data.status) {
        toast.error(data.message);
        return;
      }

      form.reset(); // Reset the form after successful booking

      // Conditional logic based on token
      if (!token) {
        paymentIntent(data.data._id); // Guests go to payment
      } else {
        toast.success("Manual booking completed successfully");
        // setStep("success"); // Show success to admin
      }
    },
    onError: (err: any) => {
      console.error("Booking Error:", err);
      console.error("Error Response:", err.response);
      console.error("Error Data:", err.data);
      toast.error(err.message || "Booking failed. Please try again.");
    },
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      specialRequirements: "",
      numberOfPeople: 1,
      promoCode: "",
    },
  });

  // for price update show - use consistent pricing calculation
  const numberOfPeople = form.watch("numberOfPeople"); // live watch
  const pricingCalculation = calculateBookingPrice(
    service?.pricePerSlot ?? 0,
    selectedTimeSlot?.length ?? 0,
    numberOfPeople
  );
  const totalPrice = pricingCalculation.totalPrice;

  const roomId = room?._id;
  const mockData = {
    category: { id: "1", name: selectedCategoryName },
    room: { id: "1", name: room?.title },
    service: {
      id: "1",
      name: service?.name,
      price: service?.pricePerSlot ?? 0,
    },
  };

  if (!categoryId || !roomId || !service || !selectedTimeSlot) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-medium">
          Please complete all previous steps first
        </p>
        <Button
          onClick={() => setStep("category")}
          className="mt-4 bg-orange-500 hover:bg-orange-600"
        >
          Start Booking
        </Button>
      </div>
    );
  }

  const handleSubmit = async (data: BookingFormData) => {
    // Validate required fields
    if (!selectedTimeSlot || selectedTimeSlot.length === 0) {
      toast.error("Please select a time slot");
      return;
    }

    if (!service?._id) {
      toast.error("Service not selected");
      return;
    }

    if (!room?._id) {
      toast.error("Room not selected");
      return;
    }
    
    // Validate ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(service._id)) {
      toast.error("Invalid service ID format");
      return;
    }
    
    if (!objectIdRegex.test(room._id)) {
      toast.error("Invalid room ID format");
      return;
    }

    if (!selectedDate) {
      toast.error("Date not selected");
      return;
    }

    // Ensure time slots are in the correct format
    const validatedTimeSlots = selectedTimeSlot.map((slot) => ({
      start: slot.start,
      end: slot.end,
    }));
    
    console.log("Validated time slots:", validatedTimeSlots);
    
    // Validate time slot format
    for (const slot of validatedTimeSlots) {
      if (!slot.start || !slot.end) {
        toast.error("Invalid time slot format");
        return;
      }
      
      // Check if time format is HH:MM
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(slot.start) || !timeRegex.test(slot.end)) {
        toast.error("Invalid time format. Expected HH:MM");
        return;
      }
    }

    const payload = {
      user: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      },
             date: format(selectedDate!, "yyyy-MM-dd"),
      timeSlots: validatedTimeSlots,
      service: service._id,
      room: room._id,
      promoCode: data.promoCode,
      numberOfPeople: data.numberOfPeople,
    };

    console.log("Booking Payload:", payload);
    console.log("Selected Time Slot:", selectedTimeSlot);
    console.log("Service:", service);
    console.log("Room:", room);
    console.log("Category:", selectedCategoryName);
    
    // Validate payload structure
    if (!payload.user.firstName || !payload.user.lastName || !payload.user.email || !payload.user.phone) {
      toast.error("Please fill in all required user information");
      return;
    }
    
    if (!payload.date) {
      toast.error("Date is required");
      return;
    }
    
    if (!payload.timeSlots || payload.timeSlots.length === 0) {
      toast.error("Time slots are required");
      return;
    }
    
    if (!payload.service || !payload.room) {
      toast.error("Service and room are required");
      return;
    }

    mutate(payload);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Your Information</h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-orange-500">
                      First Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="User First Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-orange-500">Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="User Last Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-orange-500">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="User Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-orange-500">Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="User Phone Number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="specialRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-orange-500">
                    Special Requirements
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Details" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormField
                control={form.control}
                name="numberOfPeople"
                render={({ field }) => (
                  <FormItem className="w-fit">
                    <FormLabel className="text-orange-500">
                      Number of People
                    </FormLabel>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        disabled={field.value <= 1}
                        onClick={() => field.onChange(field.value - 1)}
                      >
                        -
                      </Button>

                      <Button
                        disabled={true}
                        variant="outline"
                        className="disabled:opacity-100"
                      >
                        {field.value}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        disabled={field.value >= 5}
                        onClick={() => field.onChange(field.value + 1)}
                      >
                        +
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="promoCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-orange-500">Promo Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Use promo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Menual Booking */}
            {token ? (
              <div>
                {/* <input className="my-5" type="checkbox" />  */}
                <p className="font-bold text-orange-500 my-2">
                  {" "}
                  Menual Booking ( Only For Admin)
                </p>
              </div>
            ) : (
              <p></p>
            )}

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={isPending || isPaymentIntentLoading}
            >
              {isPending
                ? "Processing..."
                : isPaymentIntentLoading
                  ? "Generating your payment..."
                  : "Book Now"}
            </Button>
          </form>
        </Form>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-medium text-center mb-6">
          {mockData.service.name}
        </h2>

        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium">
              {selectedTimeSlot
                ? format(selectedDate!, "MM-dd-yyyy")
                : "Not selected"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Category:</span>
            <span className="font-medium">{mockData.category.name}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Room:</span>
            <span className="font-medium">{mockData.room.name}</span>
          </div>

          <div className="border-t pt-4 mt-6 flex justify-between items-center">
            <span className="font-medium">Total for booking:</span>
            <span className="text-xl font-bold">
              {formatPrice(totalPrice)}
            </span>
          </div>
          
          {/* Pricing breakdown for transparency */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="text-gray-600 mb-2">Price breakdown:</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Base price per slot:</span>
                <span>{formatPrice(pricingCalculation.servicePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform fee per slot:</span>
                <span>{formatPrice(1)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total per slot:</span>
                <span>{formatPrice(pricingCalculation.adjustedPricePerSlot)}</span>
              </div>
              <div className="flex justify-between">
                <span>Slots × People:</span>
                <span>{pricingCalculation.numberOfSlots} × {pricingCalculation.numberOfPeople}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

{
  /*
  
  {
    "user": {
        "firstName": "Monir Hossain",
        "lastName": "Rabby",
        "email": "monir.bdcalling@gmail.com",
        "phone": "01956306002"
    },
    "date": "2025-05-21T18:00:00.000Z",
    "timeSlots": [
        {
            "start": "09:00",
            "end": "10:00"
        }
    ],
    "service": "6829bc2a8f11fa6517869230",
    "room": "68296b5cfb46dd41e61a6024",
    "promoCode": "",
    "numberOfPeople": 3
}
  */
}
