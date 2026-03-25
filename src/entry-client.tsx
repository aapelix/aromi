// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";

import posthog from "posthog-js";

posthog.init("phc_9a8liLr4O60FcK3SImNVTJm62uf04gvQ9LPej4wgJVm", {
  api_host: "https://j.aapelix.dev",
  defaults: "2026-01-30",
});

export default mount(() => <StartClient />, document.getElementById("app")!);
