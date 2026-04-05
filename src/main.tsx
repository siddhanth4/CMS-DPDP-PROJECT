import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./formbuilder.css";
import { ProjectProvider } from "./Context/projectContext.tsx";
import { OrganizationAuthProvider } from "./Context/organizationContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename="/CMP">
      <OrganizationAuthProvider>
        <ProjectProvider>
          <App />
        </ProjectProvider>
      </OrganizationAuthProvider>
    </BrowserRouter>
  </StrictMode>
);
