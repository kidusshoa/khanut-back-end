import { Request, Response } from "express";
import { Transaction } from "../models/transaction";

interface AuthRequest extends Request {
  user: {
    id: string;
  };
}

export const getCustomerTransactions = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find({ customerId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ customerId: req.user.id }),
    ]);

    return res.json({
      transactions,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("❌ Fetch transactions error:", err);
    return res.status(500).json({ message: "Failed to fetch transactions" });
  }
};
