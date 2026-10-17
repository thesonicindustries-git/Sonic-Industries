import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

// Limit 1: max 3 messages per IP in 15 minutes
export const leadsShortLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many messages. Please try again after some time.",
  },
});

// Limit 2: max 10 messages per IP in 24 hours
export const leadsDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Daily message limit reached. Please try again tomorrow.",
  },
});

// Validation + bot trap
export const validateLead = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { name, email, message, website } = req.body || {};

  // Honeypot: real users never fill this hidden field, bots do.
  // We pretend it worked so the bot doesn't learn anything.
  if (website) {
    res.status(200).json({ success: true, message: "Message sent." });
    return;
  }

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string"
  ) {
    res.status(400).json({ success: false, message: "Invalid data." });
    return;
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim();
  const cleanMessage = message.trim();

  if (!cleanName || !cleanEmail || !cleanMessage) {
    res
      .status(400)
      .json({ success: false, message: "Please fill in all fields." });
    return;
  }

  if (cleanName.length > 80 || cleanEmail.length > 120 || cleanMessage.length > 1000) {
    res.status(400).json({ success: false, message: "Input is too long." });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    res.status(400).json({ success: false, message: "Invalid email address." });
    return;
  }

  // Save the cleaned values and remove the honeypot field
  req.body = { name: cleanName, email: cleanEmail, message: cleanMessage };
  next();
};