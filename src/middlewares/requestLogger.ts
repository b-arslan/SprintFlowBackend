import { Request, Response, NextFunction } from "express";

export const requestLogger = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const start = Date.now();

    console.log("───────────────────────────────────────");
    console.log(`[Request Start] ${req.method} ${req.originalUrl}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`[Request Body]: ${JSON.stringify(req.body)}`);
    }

    // Orijinal res.send'i yakala
    const originalSend = res.send.bind(res);

    res.send = (body: any) => {
        const duration = Date.now() - start;

        console.log(`[Response] ${req.method} ${req.originalUrl}`);
        console.log(`[Status Code]: ${res.statusCode}`);
        console.log(
            `[Response Body]: ${typeof body === "object" ? JSON.stringify(body) : body}`
        );
        console.log(`[Duration]: ${duration}ms`);
        console.log("───────────────────────────────────────");

        return originalSend(body);
    };

    next();
};