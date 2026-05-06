/**
 * Centralized error handling middleware in Express.
 * Every time we call `next(error)` in any controller or route, it ends up here.
 */
export const errorHandler = (err, req, res, next) => {
    // Default values if an error object is thrown without statusCode or status
    err.statusCode = err.statusCode || 500;
    
    // In development or when requested, we might want to log the full stack trace.
    // For now, we will just format a standard JSON response.
    
    const response = {
        status: "error",
        message: err.message || "Internal Server Error"
    };

    // Include the stack trace only if it's an operational error or in development mode
    // (We will expand this conditionally later if needed, right now we just return the basics)
    console.error(`[Error Handler] ${err.statusCode} - ${err.message}`);

    res.status(err.statusCode).json(response);
};
