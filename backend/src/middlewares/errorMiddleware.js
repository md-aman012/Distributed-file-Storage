// ============================================================
// errorMiddleware.js
// Global error-handling middleware for the Express backend.
//
// Two middlewares are exported:
//   1. notFound     — catches any request that reaches this
//                     point without a matching route and creates
//                     a structured 404 error.
//   2. errorHandler — the final Express error-handler (4-arg
//                     signature). Formats every error as a
//                     consistent JSON response and hides stack
//                     traces in production.
// ============================================================

/**
 * @desc  Catch-all for undefined routes.
 *        Must be placed AFTER all valid route registrations.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found — ${req.originalUrl}`);
  res.status(404);
  next(error); // forward to errorHandler
};

/**
 * @desc  Global Express error handler.
 *        Must be registered as the LAST middleware (4 parameters).
 *
 * Returns:
 *   { message: string, stack?: string }
 *
 * The stack trace is only included when NODE_ENV !== 'production'
 * so we never leak internals to end users.
 */
const errorHandler = (err, req, res, next) => {
  // Express may arrive here with a 200 status if an error was
  // thrown synchronously — normalise to at least 500.
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
