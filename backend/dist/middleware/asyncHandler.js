/**
 * Wraps an async route handler so unhandled promise rejections
 * are forwarded to Express's error middleware automatically.
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
}
