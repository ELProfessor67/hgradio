"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaCreditCard, FaLock, FaShieldAlt } from "react-icons/fa";
import { toast } from "sonner";

interface PaymentData {
  albumTitle: string;
  albumPrice: number;
  userData: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    consentForm: {
      artistName: string;
      songName: string;
      album: string;
      genre: string;
      independentLabel: string;
      initials: Record<string, string>;
      copyrightOwnerName: string;
      copyrightOwnerSignature: string;
      copyrightOwnerDate: string;
      labelRepresentativeName: string;
      labelRepresentativeSignature: string;
      labelRepresentativeDate: string;
      agreedToTerms: boolean;
    };
  };
}

const PaymentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get data from URL params (in a real app, this would come from a secure session)
    const albumTitle = searchParams.get("albumTitle");
    const albumPrice = searchParams.get("albumPrice");
    const userData = searchParams.get("userData");

    if (albumTitle && albumPrice && userData) {
      try {
        setPaymentData({
          albumTitle,
          albumPrice: parseFloat(albumPrice),
          userData: JSON.parse(decodeURIComponent(userData)),
        });
      } catch (error) {
        console.error("Error parsing payment data:", error);
        router.push("/albums");
      }
    } else {
      router.push("/albums");
    }
  }, [searchParams, router]);

  const handlePayment = async () => {
    setLoading(true);
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setLoading(false);
    
    // Show success toast
    toast.success("Payment successful! Your album is ready for download.", {
      duration: 4000,
    });

    // Navigate back to main page after a short delay
    setTimeout(() => {
      router.push("/");
    }, 2000);
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-[#071022] flex items-center justify-center">
        <div className="text-white text-xl">Loading payment details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071022] text-white py-10">
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
                      Pay Now - ${paymentData.albumPrice}
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
                  <span className="font-medium">{paymentData.albumTitle}</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-600">
                  <span className="text-gray-300">Price:</span>
                  <span className="font-medium">${paymentData.albumPrice}</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-600">
                  <span className="text-gray-300">Tax:</span>
                  <span className="font-medium">$0.00</span>
                </div>
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-[#66FCF1]">${paymentData.albumPrice}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-[#28344C] rounded">
                <h4 className="font-medium mb-2">Billing Address</h4>
                <div className="text-sm text-gray-300">
                  <p>{paymentData.userData.fullName}</p>
                  <p>{paymentData.userData.address}</p>
                  <p>{paymentData.userData.city}, {paymentData.userData.state} {paymentData.userData.zipCode}</p>
                  <p>{paymentData.userData.country}</p>
                </div>
              </div>

              {/* Consent Form Summary */}
              <div className="mt-4 p-4 bg-[#28344C] rounded">
                <h4 className="font-medium mb-2 text-[#66FCF1]">Consent Form Summary</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <p><span className="font-medium">Artist:</span> {paymentData.userData.consentForm.artistName}</p>
                  <p><span className="font-medium">Song:</span> {paymentData.userData.consentForm.songName}</p>
                  <p><span className="font-medium">Album:</span> {paymentData.userData.consentForm.album}</p>
                  <p><span className="font-medium">Genre:</span> {paymentData.userData.consentForm.genre}</p>
                  {paymentData.userData.consentForm.independentLabel && (
                    <p><span className="font-medium">Label:</span> {paymentData.userData.consentForm.independentLabel}</p>
                  )}
                  <p><span className="font-medium">Copyright Owner:</span> {paymentData.userData.consentForm.copyrightOwnerName}</p>
                  <p><span className="font-medium">Date Signed:</span> {paymentData.userData.consentForm.copyrightOwnerDate}</p>
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
