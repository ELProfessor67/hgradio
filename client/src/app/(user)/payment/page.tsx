"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaCreditCard, FaLock, FaShieldAlt } from "react-icons/fa";
import { toast } from "sonner";
import { useData } from "@/context/Context";

interface AlbumType {
  _id: string;
  title: string;
  price: number;
  coverImg: string;
}

const PaymentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData } = useData();
  const [album, setAlbum] = useState<AlbumType | null>(null);
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState(""); // MM/YY or MM/YYYY
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");

  useEffect(() => {
    const id = searchParams.get("albumId");

    if (!userData?.token) {
      router.push("/login");
      return;
    }

    if (!id) {
      router.push("/albums");
      return;
    }

    setAlbumId(id);

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/album/${id}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load album");
        setAlbum(data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load album";
        toast.error(msg, { duration: 4000 });
        router.push("/albums");
      }
    })();
  }, [searchParams, router]);

  const handlePayment = async () => {
    setLoading(true);

    try {
      if (!userData?.token) {
        toast.error("Please login first.", { duration: 3000 });
        router.push("/login");
        return;
      }

      if (!albumId) {
        toast.error("Missing album id.", { duration: 3000 });
        return;
      }

      const exp = expiry.trim();
      const [mmRaw, yyRaw] = exp.split("/");
      const expiryMonth = (mmRaw || "").trim();
      let expiryYear = (yyRaw || "").trim();
      if (expiryYear.length === 2) expiryYear = `20${expiryYear}`;

      if (!cardNumber.trim() || !expiryMonth || !expiryYear || !cvv.trim()) {
        toast.error("Please fill card number, expiry, and CVV.", {
          duration: 3000,
        });
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/albums/${albumId}/purchase`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userData.token}`,
          },
          body: JSON.stringify({
            cardNumber: cardNumber.replace(/\s+/g, ""),
            expiryMonth,
            expiryYear,
            cvv,
            cardholderName,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        toast.error(result?.message || "Payment failed", { duration: 4000 });
        return;
      }

      toast.success("Payment successful! Album unlocked.", { duration: 4000 });
      router.push(`/albums/${albumId}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Payment failed";
      toast.error(msg, { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  if (!album) {
    return (
      <div className="min-h-screen bg-[#071022] flex items-center justify-center">
        <div className="text-white text-xl">Loading payment details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071022] text-white py-10 pt-32">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#66FCF1] mb-2">
            Complete Your Purchase
          </h1>
          <p className="text-gray-300">
            Secure payment powered by HGC Radio
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#0B1834] rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FaCreditCard className="text-[#66FCF1]" />
                Payment Information
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-[#28344C] border border-gray-600 rounded focus:outline-none focus:border-[#66FCF1]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full px-3 py-2 bg-[#28344C] border border-gray-600 rounded focus:outline-none focus:border-[#66FCF1]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full px-3 py-2 bg-[#28344C] border border-gray-600 rounded focus:outline-none focus:border-[#66FCF1]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#28344C] border border-gray-600 rounded focus:outline-none focus:border-[#66FCF1]"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-[#66FCF1] text-black py-3 rounded-lg font-semibold hover:bg-[#53e6da] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaLock />
                      Pay Now - ${album.price}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-[#0B1834] rounded-lg p-6">
              <div className="flex items-start gap-3">
                <FaShieldAlt className="text-[#66FCF1] text-xl mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Secure Payment</h3>
                  <p className="text-gray-300 text-sm">
                    Your payment information is encrypted and secure. We use industry-standard 
                    SSL encryption to protect your data. This is a demo payment page for 
                    demonstration purposes only.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#0B1834] rounded-lg p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-600">
                  <span className="text-gray-300">Album:</span>
                  <span className="font-medium">{album.title}</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-600">
                  <span className="text-gray-300">Price:</span>
                  <span className="font-medium">${album.price}</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-600">
                  <span className="text-gray-300">Tax:</span>
                  <span className="font-medium">$0.00</span>
                </div>
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-[#66FCF1]">${album.price}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-[#28344C] rounded">
                <h4 className="font-medium mb-2">Logged in as</h4>
                <div className="text-sm text-gray-300">
                  <p>{String(userData?.name || "")}</p>
                  <p>{String(userData?.email || "")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
