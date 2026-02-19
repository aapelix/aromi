import "virtual:uno.css";

import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";

export default function App() {
  return (
    <>
      <script
        defer
        src="https://analytics.aapelix.dev/script.js"
        data-website-id="8da35657-7723-45ea-bc10-2123e3e731d8"
      ></script>

      <Router
        root={(props) => (
          <>
            <Suspense>{props.children}</Suspense>
          </>
        )}
      >
        <FileRoutes />
      </Router>
    </>
  );
}
