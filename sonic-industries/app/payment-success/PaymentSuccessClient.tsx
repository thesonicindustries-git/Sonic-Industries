"use client";



import React, { useState } from "react";

import { CheckCircle, Home, Download } from "lucide-react";

import axios from "axios";

import { useRouter, useSearchParams } from "next/navigation";

import { toast } from "sonner";



const PaymentSuccessClient: React.FC = () => {

  const searchParams = useSearchParams();

  const razorpayOrderId = searchParams.get("order_id");
  const codOrderId = searchParams.get("cod_order_id");

  const router = useRouter();

  const handleGoHome = () => {

    router.push("/");

  };



  const rewards = [

    "Perfume",

    "Smartwatch",

    "Earbuds",

    "Neckband",

    "Headphones",

  ];



  const COLORS = ["#16a085", "#2980b9", "#34495e", "#f39c12", "#d35400"];



  const IMAGE = [

    "/perfume.avif",

    "/smartwatch.avif",

    "/earbuds.webp",

    "/neckband.webp",

    "/headphones.jpg",

  ];



  const [rotation, setRotation] = useState(0);

  const [spinning, setSpinning] = useState(false);

  const [selectedReward, setSelectedReward] = useState<string | null>(null);



  const spinWheel = async () => {

    if (spinning) return;



    setSpinning(true);

    setSelectedReward(null);



    try {

      // 1️⃣ Call backend

      const res = await axios.post(

        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/spin-reward`,

        {

          razorpayOrderId: razorpayOrderId,

        },

      );

      const data = res.data; // { reward: "Smartwatch" }



      const rewardFromBackend = data.reward;



      // 2️⃣ Find slice index

      const rewardIndex = rewards.findIndex((r) => r === rewardFromBackend);



      if (rewardIndex === -1) {

        throw new Error("Invalid reward from backend");

      }



      // 3️⃣ Calculate exact stopping angle

      const sliceAngle = 360 / rewards.length;

      const targetSliceCenter = rewardIndex * sliceAngle + sliceAngle / 2 + 90;



      const targetAngle = 90 - targetSliceCenter;

      const extraSpins = 5 * 360;



      const currentRotation = rotation % 360;

      let finalRotation = targetAngle + extraSpins;



      while (finalRotation - currentRotation < 360) {

        finalRotation += 360;

      }



      // 4️⃣ Stop at correct reward

      setRotation(rotation + (finalRotation - currentRotation));



      setTimeout(() => {

        setSelectedReward(rewardFromBackend);

        setSpinning(false);

      }, 8000); // match transition duration

    } catch (err) {

      console.error(err);

      setSpinning(false);

    }

  };



  const handleDownloadReceipt = async () => {

    try {

      const res = await axios.post(

        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/invoice`,

        {

          identifier: razorpayOrderId || codOrderId,

        },

        {

          responseType: "blob",

        },

      );



      // Create blob URL

      const blob = new Blob([res.data], { type: "application/pdf" });

      const url = window.URL.createObjectURL(blob);



      // Create temporary link

      const link = document.createElement("a");

      link.href = url;

      link.download = `Invoice-${razorpayOrderId || codOrderId}.pdf`;



      document.body.appendChild(link);

      link.click();



      // Cleanup

      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (error) {

      console.error("Invoice download failed", error);

      toast.error("Failed to download invoice");

    }

  };



  return (

    <div className="min-h-screen bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center px-4 py-20 relative overflow-hidden">

      <div className="w-full max-w-3xl text-center">

        {/* SUCCESS ICON */}

        <div className="flex justify-center mb-6">

          <div className="relative">

            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-linear-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-scale-in shadow-xl">

              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-white" />

            </div>

          </div>

        </div>



        {/* Success Message */}

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">

          Payment Successful!

        </h1>

        <p className="text-base sm:text-lg text-gray-700 mb-2">

          🎉 Thank you for your purchase!

        </p>

        <p className="text-sm sm:text-base text-gray-600 mb-8">

          Your transaction has been processed successfully.

        </p>



        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-green-100 shadow-lg animate-fade-in-up animation-delay-600 relative z-20">

          <h3 className="text-lg font-semibold text-gray-800 mb-4">

            Transaction Details

          </h3>

          <div className="space-y-2 text-sm">

            <div className="flex justify-between items-center">

              <span className="text-gray-600">Status:</span>

              <span className="text-green-600 font-semibold flex items-center gap-1">

                <CheckCircle className="w-4 h-4" />

                Completed

              </span>

            </div>

          </div>

        </div>



        {/* Spinning Wheel Section */}

        {razorpayOrderId && (

          <div className="bg-white rounded-2xl p-6 mb-8 shadow-xl border border-emerald-100">

            <h2 className="text-xl sm:text-2xl font-bold text-emerald-600 mb-1">

              🎁 Prepaid Bonus Spin

            </h2>

            <p className="text-sm sm:text-base text-gray-600 mb-6">

              Spin the wheel and win a guaranteed reward!

            </p>



            <div id="wrapper">

              <div

                id="wheel"

                style={{ maxWidth: "90vmin", maxHeight: "90vmin" }}

              >

                <svg

                  width="100%"

                  height="100%"

                  viewBox="0 0 300 300"

                  style={{ display: "block" }}

                >

                  <g

                    id="inner-wheel"

                    style={{

                      transformOrigin: "150px 150px",

                      transform: `rotate(${rotation}deg)`,

                      transition: spinning

                        ? "transform 8s cubic-bezier(0.17, 0.67, 0.12, 0.99)"

                        : "none",

                    }}

                  >

                    {rewards.map((reward, i) => {

                      const slice = 360 / rewards.length;

                      const startAngle = (i * slice - 90) * (Math.PI / 180);

                      const endAngle = ((i + 1) * slice - 90) * (Math.PI / 180);

                      const midAngle = (startAngle + endAngle) / 2;



                      const radius = 150;

                      const x1 = 150 + Math.cos(startAngle) * radius;

                      const y1 = 150 + Math.sin(startAngle) * radius;

                      const x2 = 150 + Math.cos(endAngle) * radius;

                      const y2 = 150 + Math.sin(endAngle) * radius;



                      const imageRadius = 90;

                      const imageX = 150 + Math.cos(midAngle) * imageRadius;

                      const imageY = 150 + Math.sin(midAngle) * imageRadius;



                      return (

                        <g key={i}>

                          <defs>

                            <clipPath id={`clip-${i}`}>

                              <path

                                d={`M 150 150 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}

                              />

                            </clipPath>

                            <pattern

                              id={`pattern-${i}`}

                              x="0"

                              y="0"

                              width="300"

                              height="300"

                              patternUnits="userSpaceOnUse"

                            >

                              <image

                                href={IMAGE[i]}

                                x="0"

                                y="5"

                                width="300"

                                height="300"

                                preserveAspectRatio="xMidYMid slice"

                                opacity="0.4"

                              />

                            </pattern>

                          </defs>



                          <path

                            d={`M 150 150 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}

                            fill={`url(#pattern-${i})`}

                            stroke="#fff"

                            strokeWidth="2"

                          />



                          <path

                            d={`M 150 150 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}

                            fill={COLORS[i]}

                            opacity="0.7"

                          />



                          <circle

                            cx={imageX}

                            cy={imageY}

                            r="31"

                            fill="#fff"

                            opacity="0.7"

                          />



                          <image

                            href={IMAGE[i]}

                            x={imageX - 20}

                            y={imageY - 20}

                            width="40"

                            height="40"

                            clipPath="circle(20px at 50% 50%)"

                            preserveAspectRatio="xMidYMid slice"

                          />

                        </g>

                      );

                    })}

                  </g>

                </svg>



                {/* Center Spin Button */}

                <div

                  id="spin"

                  onClick={spinWheel}

                  style={{ pointerEvents: spinning ? "none" : "auto" }}

                >

                  <div id="inner-spin"></div>

                  <div id="spin-text">{spinning ? "SPIN" : "SPIN"}</div>

                </div>



                {/* Pointer Arrow */}

                <div id="pointer"></div>

              </div>

            </div>



            {selectedReward && (

              <div

                className="mt-4 sm:mt-6 p-4 sm:p-5 md:p-6 

                bg-linear-to-r from-green-100 to-emerald-100 

                rounded-xl animate-bounce-in text-center"

              >

                <p

                  className="text-lg sm:text-xl md:text-2xl 

                font-bold text-green-700"

                >

                  🎉 Congratulations!

                </p>



                <p

                  className="mt-2 

                text-base sm:text-lg md:text-xl 

                font-semibold text-emerald-600 wrap-break-word"

                >

                  You won: {selectedReward}

                </p>

              </div>

            )}

          </div>

        )}



        {/* Action Buttons */}

        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-20">

          <button

            onClick={handleGoHome}

            className="flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:scale-105 transition cursor-pointer"

          >

            <Home className="w-5 h-5" />

            Go Back

          </button>



          <button

            onClick={handleDownloadReceipt}

            className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-600 font-semibold rounded-xl border-2 border-green-200 hover:bg-green-50 hover:scale-105 transition shadow-lg cursor-pointer"

          >

            <Download className="w-5 h-5" />

            Download Receipt

          </button>

        </div>



        {/* Floating Elements */}

        <div className="absolute top-20 left-10 w-16 h-16 bg-green-200 rounded-full opacity-20 animate-float -z-10"></div>

        <div className="absolute bottom-20 right-10 w-20 h-20 bg-emerald-200 rounded-full opacity-20 animate-float-delayed -z-10"></div>

        <div className="absolute top-1/3 right-20 w-12 h-12 bg-teal-200 rounded-full opacity-20 animate-float-slow -z-10"></div>

        <div className="absolute bottom-1/3 left-16 w-8 h-8 bg-green-300 rounded-full opacity-30 animate-float -z-10"></div>

      </div>



      {/* Custom Animations */}

      <style>{`

        @keyframes scale-in {

          0% {

            transform: scale(0);

            opacity: 0;

          }

          50% {

            transform: scale(1.1);

          }

          100% {

            transform: scale(1);

            opacity: 1;

          }

        }



        @keyframes check-draw {

          0% {

            transform: scale(0);

            opacity: 0;

          }

          50% {

            transform: scale(1.2);

            opacity: 0.8;

          }

          100% {

            transform: scale(1);

            opacity: 1;

          }

        }



        @keyframes fade-in-up {

          0% {

            opacity: 0;

            transform: translateY(30px);

          }

          100% {

            opacity: 1;

            transform: translateY(0);

          }

        }



        @keyframes float {

          0%, 100% {

            transform: translateY(0px);

          }

          50% {

            transform: translateY(-20px);

          }

        }



        @keyframes float-delayed {

          0%, 100% {

            transform: translateY(0px);

          }

          50% {

            transform: translateY(-15px);

          }

        }



        @keyframes float-slow {

          0%, 100% {

            transform: translateY(0px);

          }

          50% {

            transform: translateY(-10px);

          }

        }



        @keyframes bounce-in {

          0% {

            transform: scale(0);

            opacity: 0;

          }

          50% {

            transform: scale(1.1);

          }

          100% {

            transform: scale(1);

            opacity: 1;

          }

        }



        .animate-scale-in {

          animation: scale-in 0.6s ease-out;

        }



        .animate-check-draw {

          animation: check-draw 0.6s ease-out 0.3s both;

        }



        .animate-fade-in-up {

          animation: fade-in-up 0.6s ease-out both;

        }



        .animate-bounce-in {

          animation: bounce-in 0.5s ease-out;

        }



        .animation-delay-200 {

          animation-delay: 0.2s;

        }



        .animation-delay-400 {

          animation-delay: 0.4s;

        }



        .animation-delay-600 {

          animation-delay: 0.6s;

        }



        .animation-delay-800 {

          animation-delay: 0.8s;

        }



        .animate-float {

          animation: float 3s ease-in-out infinite;

        }



        .animate-float-delayed {

          animation: float-delayed 4s ease-in-out infinite 1s;

        }



        .animate-float-slow {

          animation: float-slow 5s ease-in-out infinite 2s;

        }



        #wrapper {

          margin: 20px auto;

          max-width: 240px;

          width: 100%;

          position: relative;

        }



        @media (min-width: 375px) {

          #wrapper {

            max-width: 280px;

          }

        }



        #wheel {

          position: relative;

        }



        #spin {

          width: 80px;

          height: 80px;

          position: absolute;

          top: 50%;

          left: 50%;

          margin: -40px 0 0 -40px;

          border-radius: 50%;

          background: linear-gradient(135deg, #fff, #f0f0f0);

          cursor: pointer;

          z-index: 100;

          box-shadow: 0 4px 12px rgba(0,0,0,0.2);

          transition: transform 0.2s;

          display: flex;

          align-items: center;

          justify-content: center;

        }



        #spin:hover {

          transform: scale(1.05);

        }



        #spin:active {

          transform: scale(0.95);

        }



        #spin-text {

          font-weight: bold;

          color: #16a085;

          font-size: 14px;

          z-index: 101;

        }



        #inner-spin {

          width: 60px;

          height: 60px;

          position: absolute;

          border-radius: 50%;

          background: radial-gradient(circle, #fff, #e0e0e0);

          border: 3px solid #16a085;

        }



        #pointer {

          position: absolute;

          width: 0;

          height: 0;

          border-style: solid;

          border-width: 0 12px 25px 12px;

          border-color: transparent transparent #fff transparent;

          top: 54px;

          left: 50%;

          margin-left: -12px;

          z-index: 99;

          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));

        }



        @media (min-width: 375px) {

          #pointer {

            top: 78px;

          }

        }

      `}</style>

    </div>

  );

};



export default PaymentSuccessClient;
