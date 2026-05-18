/**
 * GET /api/replay/:contestSlug/:questionSlug/:username
 * Returns raw replay events AND the reconstructed final code.
 */
export declare const getReplay: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
