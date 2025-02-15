export const config = {
    port: process.env.PORT || 2333,
    heartbeat: {
        interval: 30000,
        timeout: 60000
    }
};