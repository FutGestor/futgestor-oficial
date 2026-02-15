import os
import re

def find_orphans():
    src_dir = 'src'
    files_to_check = []
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                full_path = os.path.join(root, file)
                # Ignore main entry points and protected files
                if file in ['main.tsx', 'App.tsx', 'vite-env.d.ts', 'index.css']:
                    continue
                files_to_check.append((full_path, os.path.splitext(file)[0]))

    all_content = ""
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts') or file.endswith('.css'):
                with open(os.path.join(root, file), 'r', encoding='utf-8', errors='ignore') as f:
                    all_content += f.read() + "\n"

    orphans = []
    for path, name in files_to_check:
        # Search for the component name in the whole codebase
        # Simple check: is the filename (without extension) mentioned?
        if name not in all_content:
            orphans.append(path)
    
    return orphans

if __name__ == "__main__":
    orphans = find_orphans()
    if orphans:
        print("POTENTIAL ORPHANS FOUND:")
        for o in orphans:
            print(o)
    else:
        print("No orphans found.")
