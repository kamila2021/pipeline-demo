import { httpRequestDuration, httpRequestsTotal } from '../metrics.js';

export function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const route = req.route?.path ? (req.baseUrl + req.route.path) : req.path;
    const labels = { method: req.method, route, status_code: res.statusCode };
    end(labels);
    httpRequestsTotal.inc(labels);
  });

  next();
}
