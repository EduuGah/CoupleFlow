const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace("import { PlansList } from './pages/PlansList';", "import { PlansList } from './pages/PlansList';\nimport { PlanDetails } from './pages/PlanDetails';");
code = code.replace("<Route path=\"plans\" element={<PlansList />} />", "<Route path=\"plans\" element={<PlansList />} />\n                  <Route path=\"plans/:id\" element={<PlanDetails />} />");
fs.writeFileSync('src/App.tsx', code);
