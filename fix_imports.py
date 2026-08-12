with open('/home/diracai/Desktop/dasho2.0/Exam_Frontendnextjs/src/react-app/components/PlatformOwnerLayout.tsx', 'r') as f:
    text = f.read()

text = text.replace("import {\n    IndianRupee, useNavigate, useLocation, Link } from \"react-router\";", "import { useNavigate, useLocation, Link } from \"react-router\";")
text = text.replace("import {\n    IndianRupee, useAuthContext } from \"../contexts/AuthContext\";", "import { useAuthContext } from \"../contexts/AuthContext\";")

with open('/home/diracai/Desktop/dasho2.0/Exam_Frontendnextjs/src/react-app/components/PlatformOwnerLayout.tsx', 'w') as f:
    f.write(text)
