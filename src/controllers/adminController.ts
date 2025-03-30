import { Request, Response } from "express";
import { Admin } from "../models/admin";
import bcrypt from "bcryptjs";

export const getSettings = async (req: Request, res: Response) => {
  const admin = await Admin.findOne(); // defaulting to first for now
  if (!admin) return res.status(404).json({ message: "Admin not found" });

  res.json({
    name: admin.name,
    email: admin.email,
    notify: admin.notify,
    twoFactorAuth: admin.twoFactorAuth,
  });
};

export const updateSettings = async (req: Request, res: Response) => {
  const { name, email, notify, twoFactorAuth } = req.body;
  const admin = await Admin.findOne();
  if (!admin) return res.status(404).json({ message: "Admin not found" });

  admin.name = name;
  admin.email = email;
  admin.notify = notify;
  admin.twoFactorAuth = twoFactorAuth;
  await admin.save();

  res.json({ message: "Settings updated" });
};

export const addAdmin = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const exists = await Admin.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already exists" });

  const newAdmin = new Admin({ name, email, password });
  await newAdmin.save();

  res.status(201).json({ message: "Admin created" });
};

export const changePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const admin = await Admin.findOne();
  if (!admin) return res.status(404).json({ message: "Admin not found" });

  const isMatch = await bcrypt.compare(oldPassword, admin.password);
  if (!isMatch)
    return res.status(401).json({ message: "Old password incorrect" });
  if (newPassword !== confirmPassword)
    return res.status(400).json({ message: "Passwords do not match" });

  admin.password = newPassword;
  await admin.save();

  res.json({ message: "Password updated" });
};
