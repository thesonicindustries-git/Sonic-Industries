"use client";

import { useState, useEffect, useRef } from "react";
import axios, { AxiosError } from "axios";
import { Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";

// CHANGE: spam protection settings
const COOLDOWN_SECONDS = 60;
const COOLDOWN_KEY = "contact_last_sent";
const MIN_FILL_TIME_MS = 3000; // a human needs at least 3 seconds to fill the form

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  // CHANGE: hidden field that only bots fill
  const [honeypot, setHoneypot] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  // CHANGE: remember when the user started typing
  const startedAtRef = useRef<number | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (startedAtRef.current === null) startedAtRef.current = Date.now();
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }

    // CHANGE: block bots that submit instantly
    if (
      startedAtRef.current === null ||
      Date.now() - startedAtRef.current < MIN_FILL_TIME_MS
    ) {
      toast.error("Please take a moment to fill in the form.");
      return;
    }

    // CHANGE: cooldown between messages (60 seconds)
    try {
      const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
      const secondsLeft = Math.ceil(
        (last + COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
      );
      if (secondsLeft > 0) {
        toast.error(`Please wait ${secondsLeft}s before sending another message.`);
        return;
      }
    } catch {
      // localStorage not available, backend limit still protects us
    }

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/leads`,
        // CHANGE: send the honeypot value too, backend rejects bots
        { ...formData, website: honeypot }
      );

      if (res.data.success) {
        toast.success("Message sent successfully!");
        setFormData({ name: "", email: "", message: "" });
        startedAtRef.current = null;
        try {
          localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
        } catch {}
      } else {
        toast.error("Failed to send message.");
      }
    } catch (err) {
      // CHANGE: show the backend's message (for example, rate limit reached)
      const error = err as AxiosError<{ message?: string }>;
      if (error.response?.status === 429) {
        toast.error(
          error.response.data?.message ||
            "Too many messages. Please try again later."
        );
      } else {
        toast.error(
          error.response?.data?.message ||
            "Something went wrong while sending the message. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.15 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const contactCards = [
    {
      id: 1,
      icon: <Phone className="w-6 h-6 text-red-600" />,
      content: ["+91 8010735898", "+91 9321970200"],
    },
    {
      id: 2,
      icon: <Mail className="w-6 h-6 text-red-600" />,
      content: ["sonicindustriesofficial@gmail.com"],
    },
    {
      id: 3,
      icon: <MapPin className="w-6 h-6 text-red-600" />,
      content: [
        "Ground Floor, Office No. A-1, Sai Srushti Apartment, near Bharat Gas, Lakshmiben Chedda Nagar, Nalasopara West, Maharashtra 401203",
      ],
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="bg-gray-100 py-14 sm:py-20 px-4"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3">
            Contact Us
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Have questions or inquiries? We’d love to hear from you.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {contactCards.map((card, index) => (
            <div
              key={card.id}
              className={`bg-white rounded-xl shadow-md p-6 sm:p-8 text-center transition-all duration-700 ${index === contactCards.length - 1 ? "md:col-span-2 md:w-1/2 md:justify-self-center lg:col-span-1 lg:w-auto" : ""}
              ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: `${index * 120}ms` }}
            >
              <div className="flex justify-center mb-4">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-dashed border-red-400 animate-spin animation-duration-[12s]" />
                  <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
                    {card.icon}
                  </div>
                </div>
              </div>

              {card.content.map((line, i) => (
                <p
                  key={i}
                  className="text-sm sm:text-base text-gray-700 leading-relaxed"
                >
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Form + Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form */}
          <div
            className={`bg-white rounded-xl shadow-md p-6 sm:p-8 transition-all duration-700
            ${
              isVisible
                ? "translate-x-0 opacity-100"
                : "-translate-x-8 opacity-0"
            }`}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                maxLength={80}
                className="w-full px-4 py-3 text-sm sm:text-base border rounded-md focus:ring-2 focus:ring-blue-400"
              />

              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
                maxLength={120}
                className="w-full px-4 py-3 text-sm sm:text-base border rounded-md focus:ring-2 focus:ring-blue-400"
              />

              <textarea
                name="message"
                rows={4}
                placeholder="Your Message"
                value={formData.message}
                onChange={handleChange}
                maxLength={1000}
                className="w-full px-4 py-3 text-sm sm:text-base border rounded-md focus:ring-2 focus:ring-blue-400"
              />

              {/* CHANGE: honeypot field. Hidden from real users, bots fill it. */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                }}
              >
                <label>
                  Website
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </label>
              </div>

              <button
                disabled={isSubmitting}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-md transition w-full sm:w-auto"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          {/* Map */}
          <div
            className={`bg-white rounded-xl shadow-md overflow-hidden h-75 sm:h-full transition-all duration-700
            ${
              isVisible
                ? "translate-x-0 opacity-100"
                : "translate-x-8 opacity-0"
            }`}
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.6990232557923!2d72.81300262498675!3d19.425406081852454!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7a9ef038b322f%3A0xe02b3de42dd9dc44!2sSonic%20Industries!5e0!3m2!1sen!2sin!4v1745071411343!5m2!1sen!2sin"
              className="w-full h-full"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}