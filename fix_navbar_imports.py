import os

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { FileText, User } from 'firebase/auth';", "import { User } from 'firebase/auth';")
content = content.replace("import { FileText, UtilitySettings } from '../types';", "import { UtilitySettings } from '../types';")
if "FileText," not in content.split("from 'lucide-react';")[0]:
    content = content.replace("import {", "import { FileText,", 1)

with open('src/components/Navbar.tsx', 'w') as f:
    f.write(content)
