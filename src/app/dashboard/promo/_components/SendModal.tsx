"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { toast } from "sonner";

interface SendPromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoCode: string;
}

export default function SendModal({
  isOpen,
  onClose,
  promoCode,
}: SendPromoCodeModalProps) {
  // const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Space Room");
  const [body, setBody] = useState("Text");
  const token = localStorage.getItem("token");

  const handleSend = async () => {
    // if (!email || !subject || !body) {
    //   toast.error("All fields are required.");
    //   return;
    // }

    try {
      toast.loading("Sending promo code...", { id: "sendToast" });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/promo-codes/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({  subject, body, promoCode }),
        }
      );

      if (!res.ok) throw new Error("Failed to send email");

      toast.success("Promo code sent successfully!", { id: "sendToast" });
      onClose();
    } catch (error) {
      toast.error(
        `Failed to send email${
          error instanceof Error ? `: ${error.message}` : ""
        }`
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden rounded-lg bg-white">
        <DialogHeader className="p-4 pb-2">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-medium text-[#FF6B00]">
              Send Promo Code
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 hover:bg-transparent"
            >
              <X className="h-5 w-5 text-[#FF6B00]" />
            </Button>
          </div>
          <div className="w-full h-[1px] bg-[#FF6B00] mt-2"></div>
        </DialogHeader>

        <div className="p-6 space-y-5">
  {/* Promo Code */}
  <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
    <Label className="text-sm font-medium text-black">Promo Code:</Label>
    <Input
      readOnly
      value={promoCode}
      className="bg-gray-50 border-gray-200 w-full"
      placeholder="#####"
    />
  </div>

  {/* Email */}
  {/* <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
    <Label className="text-sm font-medium text-black">Email:</Label>
    <Input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="example@mail.com"
      className="bg-gray-50 border-gray-200 w-full"
    />
  </div> */}

  {/* Subject */}
  <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
    <Label className="text-sm font-medium text-black">Subject:</Label>
    <Input
      value={subject}
      onChange={(e) => setSubject(e.target.value)}
      className="bg-gray-50 border-gray-200 w-full"
    />
  </div>

  {/* Body */}
  <div className="grid grid-cols-[100px_1fr] gap-4">
    <Label className="text-sm font-medium text-black pt-2">Body:</Label>
    <Textarea
      value={body}
      onChange={(e) => setBody(e.target.value)}
      className="bg-gray-50 border-gray-200 min-h-[180px] resize-none w-full"
    />
  </div>
</div>


        {/* Action Buttons */}
        <div className="flex justify-center gap-4 p-4 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 border-0 text-black rounded-md px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            className="bg-[#FF6B00] hover:bg-[#e05f00] text-white rounded-md px-6"
          >
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
