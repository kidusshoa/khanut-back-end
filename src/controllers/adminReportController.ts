import { Request, Response } from "express";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { User } from "../models/user";
import { Business } from "../models/business";
import { Review } from "../models/review";

export const getAdminReports = async (_req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalBusinesses,
      totalReviews,
      pendingApprovals,
      pendingReviews,
    ] = await Promise.all([
      User.countDocuments(),
      Business.countDocuments(),
      Review.countDocuments(),
      Business.countDocuments({ approved: false }),
      Review.countDocuments({ status: "pending" }),
    ]);

    const userAggregation = await User.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
    ]);

    const businessAggregation = await Business.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
    ]);

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const monthlyUsers = userAggregation.map((entry) => ({
      month: months[entry._id - 1],
      count: entry.count,
    }));

    const monthlyBusinesses = businessAggregation.map((entry) => ({
      month: months[entry._id - 1],
      count: entry.count,
    }));

    res.json({
      totalUsers,
      totalBusinesses,
      totalReviews,
      pendingApprovals,
      pendingReviews,
      monthlyUsers,
      monthlyBusinesses,
    });
  } catch (err) {
    console.error("❌ Report fetch error:", err);
    res.status(500).json({ message: "Failed to load report data" });
  }
};

export const exportAdminReports = async (_req: Request, res: Response) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Khanut Report");

    sheet.addRow(["Metric", "Value"]).font = { bold: true };

    const [
      totalUsers,
      totalBusinesses,
      totalReviews,
      unapprovedBusinesses,
      pendingReviews,
    ] = await Promise.all([
      User.countDocuments(),
      Business.countDocuments(),
      Review.countDocuments(),
      Business.countDocuments({ approved: false }),
      Review.countDocuments({ status: "pending" }),
    ]);

    sheet.addRows([
      ["Total Users", totalUsers],
      ["Total Businesses", totalBusinesses],
      ["Total Reviews", totalReviews],
      ["Pending Approvals", unapprovedBusinesses],
      ["Pending Reviews", pendingReviews],
    ]);

    const filename = `khanut_report_${Date.now()}.xlsx`;
    const filepath = path.join("/tmp", filename);

    await workbook.xlsx.writeFile(filepath);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error("❌ File download failed:", err);
        res.status(500).send("Failed to export report");
      }

      fs.unlink(filepath, () => {});
    });
  } catch (err) {
    console.error("❌ Excel export error:", err);
    res.status(500).json({ message: "Failed to export Excel report" });
  }
};
