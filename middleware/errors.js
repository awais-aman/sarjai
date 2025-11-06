export function notFound(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
}

// Express 5 forwards both thrown and rejected errors here. Client errors
// raised by Express itself (a malformed %-escape, for example) carry a
// 4xx status; anything else is a bug and is logged, not echoed back.
export function errorHandler(err, req, res, _next) {
  const status = err.status ?? err.statusCode ?? 500;

  if (status >= 500) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }

  res.status(status).json({ error: err.expose ? err.message : "Bad request" });
}
