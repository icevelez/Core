import { mount } from "./core/runtime.js";
// import App from "./src/App.js";

import { component } from "./core/magic.js";

// mount(App, document.getElementById("app"));

// import Benchmark from "./src/Benchmark.js";

// mount(Benchmark, document.getElementById("app"));

// import NewBenchmark from "./src/NewBenchmark.js";

// NewBenchmark(document.getElementById("app"));

const App = await component("/core.concept.html");

mount(App, document.getElementById("app"));
