with open('/home/diracai/Desktop/dasho2.0/Exam_Frontendnextjs/src/react-app/App.tsx', 'r') as f:
    text = f.read()

text = text.replace("import PlatformInvoices from './pages/Finance/PlatformInvoices';", "import PlatformInvoices from './pages/Finance/PlatformInvoices';\nimport SuperAdminBilling from './pages/Finance/SuperAdminBilling';")

text = text.replace('<Route path="billing" element={<ActivityLogs />} />', '<Route path="billing" element={<SuperAdminBilling />} />\n              <Route path="activity-logs" element={<ActivityLogs />} />')

with open('/home/diracai/Desktop/dasho2.0/Exam_Frontendnextjs/src/react-app/App.tsx', 'w') as f:
    f.write(text)
