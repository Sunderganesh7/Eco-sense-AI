import ast
import os
import sys

stdlib = sys.stdlib_module_names if hasattr(sys, 'stdlib_module_names') else set()
local = {'app', 'tests', 'backend', 'scripts', 'main'}
imports = set()

for root, _, files in os.walk('backend/app'):
    for f in files:
        if f.endswith('.py'):
            with open(os.path.join(root, f), 'r', encoding='utf-8') as file:
                try:
                    tree = ast.parse(file.read())
                    for node in ast.walk(tree):
                        if isinstance(node, ast.Import):
                            for alias in node.names:
                                imports.add(alias.name.split('.')[0])
                        elif isinstance(node, ast.ImportFrom):
                            if node.module:
                                imports.add(node.module.split('.')[0])
                except Exception:
                    pass

third_party = imports - stdlib - local
print('\n'.join(sorted(third_party)))
