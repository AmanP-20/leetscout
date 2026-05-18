export const config = {
    leetcode: {
        graphqlUrl: "https://leetcode.com/graphql/",
        headers: {
            "content-type": "application/json",
            // Add cookie/session token here if needed for auth-gated queries
            // "cookie": process.env.LEETCODE_SESSION ?? "",
        },
    },
    server: {
        port: parseInt(process.env.PORT ?? "3000", 10),
        nodeEnv: process.env.NODE_ENV ?? "development",
    },
};
