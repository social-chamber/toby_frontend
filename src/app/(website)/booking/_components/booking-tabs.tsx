"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBookingStore } from "@/store/booking";
import { useEffect, useState } from "react";
import CategorySelection from "./category-selection";
import ConfirmDetails from "./confirm-details";
import RoomSelection from "./room-selection";
import ServiceSelection from "./service-selection";
import TimeSelection from "./time-selection";

export function BookingTabs() {
  const { currentStep, setStep } = useBookingStore();
  const [mounted, setMounted] = useState(false);

  // Hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Tabs
      value={currentStep}
      onValueChange={(value: any) => setStep(value as any)}
      className="w-full  mx-auto"
    >
      {/* <TabsList className="grid grid-cols-5 mb-[80px]">
        <TabsTrigger
          value="category"
          className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-full"
        >
          Category
        </TabsTrigger>
        <TabsTrigger
          value="rooms"
          className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-full"
        >
          Rooms
        </TabsTrigger>
        <TabsTrigger
          value="services"
          className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-full"
        >
          Services
        </TabsTrigger>
        <TabsTrigger
          value="time"
          className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-full"
        >
          Time
        </TabsTrigger>
        <TabsTrigger
          value="confirm"
          className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-full"
        >
          Confirm details
        </TabsTrigger>
      </TabsList> */}


<TabsList className="flex min-h-[50px] sm:grid sm:grid-cols-5 overflow-x-auto whitespace-nowrap gap-4 sm:gap-0 mb-[80px] px-4">
  <TabsTrigger
    value="category"
    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-full min-w-max"
  >
    Category
  </TabsTrigger>
  <TabsTrigger
    value="rooms"
    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-full min-w-max"
  >
    Rooms
  </TabsTrigger>
  <TabsTrigger
    value="services"
    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-full min-w-max"
  >
    Book Now
  </TabsTrigger>
  <TabsTrigger
    value="time"
    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-full min-w-max"
  >
    Time
  </TabsTrigger>
  <TabsTrigger
    value="confirm"
    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-full min-w-max"
  >
    Confirm details
  </TabsTrigger>
</TabsList>



      <TabsContent value="category">
        <CategorySelection />
      </TabsContent>
      <TabsContent value="rooms">
        <RoomSelection />
      </TabsContent>
      <TabsContent value="services">
        <p className="text-center md:text-xl text-base font-medium text-gray-700">You can book any day - any time 24/7h </p>
        <ServiceSelection />
      </TabsContent>
      <TabsContent value="time">
        <TimeSelection />
      </TabsContent>
      <TabsContent value="confirm">
        <ConfirmDetails />
      </TabsContent>
    </Tabs>
  );
}
