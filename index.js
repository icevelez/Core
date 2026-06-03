import { sfc } from "./core/parser/handlebar.js";
import { mount, signal } from "./core/runtime.js";

// import App from "./src/App.js";
// mount(App, document.getElementById("app"));

const App = await sfc("sfc/App.html");
mount(App, document.getElementById("app"));
