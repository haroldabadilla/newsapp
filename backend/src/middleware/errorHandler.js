export function errorHandler(err, req, res, _next) {
  // Axios error (request to NewsAPI failed)
  if (err?.isAxiosError) {
    const status = err.response?.status || 502;
    const payload = err.response?.data || { message: err.message };
    console.error("NewsAPI error:", status, payload); // <= you'll see exact reason in server console
    return res.status(status).json({
      error: {
        code: "UPSTREAM_ERROR",
        message: payload?.message || "Upstream error",
      },
    });
  }

  // Mongo duplicate key
  if (err?.code === 11000) {
    return res
      .status(409)
      .json({
        error: {
          code: "EMAIL_IN_USE",
          message: "A user with this email already exists",
        },
      });
  }

  // Zod validation
  if (err?.name === "ZodError") {
    return res
      .status(400)
      .json({
        error: {
          code: "VALIDATION_ERROR",
          message: err.issues?.[0]?.message || "Invalid input",
        },
      });
  }

  console.error(err);
  return res
    .status(500)
    .json({
      error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
    });
}
