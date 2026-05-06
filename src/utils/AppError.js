/**
 * Utility class to create operational errors.
 * Instead of dealing with unhandled exceptions, we instantiate AppError
 * whenever we hit a predictable error case (like "user not found").
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        
        this.statusCode = statusCode;
        
        // This flags that this is an expected error we manually threw,
        // vs an unexpected programming bug like a ReferenceError.
        this.isOperational = true;
        
        // Captures the stack trace, excluding the constructor call from it
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;
