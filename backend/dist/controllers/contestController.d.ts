/**
 * GET /api/users/:username/contests
 * Returns full contest ranking history for a user.
 */
export declare const getContests: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * GET /api/contests/:contestSlug/problems
 * Returns the list of problems in a given contest.
 */
export declare const getContestProblemsHandler: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
