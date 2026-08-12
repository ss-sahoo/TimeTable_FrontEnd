with open('/home/diracai/Desktop/dasho2.0/Exam_Frontendnextjs/src/react-app/pages/Finance/PlatformInvoices.tsx', 'r') as f:
    text = f.read()
text = text.replace("} catch (e) {\n            toast.error(\"Failed to mark invoice as paid\");", "} catch {\n            toast.error(\"Failed to mark invoice as paid\");")
text = text.replace("} catch (e) {\n            toast.error(\"Failed to cancel invoice\");", "} catch {\n            toast.error(\"Failed to cancel invoice\");")
with open('/home/diracai/Desktop/dasho2.0/Exam_Frontendnextjs/src/react-app/pages/Finance/PlatformInvoices.tsx', 'w') as f:
    f.write(text)
