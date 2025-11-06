import { createApp } from "./app.js";

const port = process.env.PORT || 3000;

const server = createApp().listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// In a container Node runs as PID 1, which ignores SIGTERM unless it is
// handled, so `docker stop` would otherwise wait out its timeout.
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
