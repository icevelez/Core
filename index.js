import { sfc } from "./core/parser/handlebar.js";
import { mount } from "./core/runtime.js";
// import App from "./src/App.js";

// mount(App, document.getElementById("app"));

// import Benchmark from "./src/Benchmark.js";

// mount(Benchmark, document.getElementById("app"));

// import NewBenchmark from "./src/NewBenchmark.js";

// NewBenchmark(document.getElementById("app"));

const App = await sfc("sfc/App.html");

mount(App, document.getElementById("app"));
