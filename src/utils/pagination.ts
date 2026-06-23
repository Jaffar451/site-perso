import { Request } from "express";

export const getPagination = (req: Request) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

export const formatPaginatedResponse = (data: any[], count: number, page: number, limit: number) => ({
  success: true,
  data,
  pagination: {
    total: count,
    page,
    limit,
    pages: Math.ceil(count / limit),
  },
});
