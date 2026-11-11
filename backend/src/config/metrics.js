import client from "prom-client";

// Collect default metrics (CPU, RAM, event loop, GC)
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: "twitter_app_" });

// HTTP Request Counter
export const httpRequestCounter = new client.Counter({
  name: "twitter_http_requests_total",
  help: "Total number of HTTP requests received",
  labelNames: ["method", "route", "status_code"],
});

// HTTP Request Duration Histogram
export const httpRequestDuration = new client.Histogram({
  name: "twitter_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

// Queue Depth Gauge for BullMQ
export const queueDepthGauge = new client.Gauge({
  name: "twitter_queue_waiting_jobs",
  help: "Number of waiting jobs in BullMQ queues",
  labelNames: ["queue_name"],
});

export const metricsRegistry = client.register;
