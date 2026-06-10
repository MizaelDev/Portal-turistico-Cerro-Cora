import { createApp } from "./server.js";

const app = await createApp();
app.listen(app.get("port"), () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${app.get("port")}`);
});

