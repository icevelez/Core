// import { mount } from "./core/runtime.js";
// import App from "./src/App.js";

// mount(App, document.getElementById("app"));

import { sfc } from "./core/parser/handlebar.js";
import { mount } from "./core/runtime.js";

const App = await sfc("sfc/App.html");
mount(App, document.getElementById("app"));
