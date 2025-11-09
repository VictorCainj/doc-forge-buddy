#!/usr/bin/env python3
import os
import re
import glob

# Mapear arquivos que foram movidos
moved_files = {}

# Encontrar todos os arquivos no diretório src
for root, dirs, files in os.walk('/workspace/doc-forge-buddy-Cain/src'):
    # Ignorar node_modules e __tests__
    if 'node_modules' in root or '__tests__' in root:
        continue
    
    for file in files:
        if file.endswith(('.tsx', '.ts')) and not file.endswith('.d.ts'):
            full_path = os.path.join(root, file)
            # Remover extensão
            name_without_ext = file.replace('.tsx', '').replace('.ts', '')
            # Criar caminho relativo
            rel_path = full_path.replace('/workspace/doc-forge-buddy-Cain/src/', '')
            # Remover extensão do caminho relativo
            rel_path_no_ext = rel_path.replace('.tsx', '').replace('.ts', '')
            
            # Armazenar mapeamento
            moved_files[name_without_ext] = '@/'+rel_path_no_ext

# Lista de imports que precisam ser corrigidos
common_issues = [
    ("from '@/components/ContractBillsStatus'", "from '@/features/contracts/components/ContractBillsStatus'"),
    ("from '../components/ContractBillsStatus'", "from '@/features/contracts/components/ContractBillsStatus'"),
]

# Adicionar imports que precisam trocar caminho de componentes
for name, path in moved_files.items():
    if '/components/' in path and '/modals/' not in path and '/ui/' not in path and '/common/' not in path and '/layout/' not in path:
        if 'components/'+name in path:
            common_issues.append((f"from '@/components/{name}'", f"from '{path}'"))

# Processar todos os arquivos
for root, dirs, files in os.walk('/workspace/doc-forge-buddy-Cain/src'):
    if 'node_modules' in root or '__tests__' in root:
        continue
    
    for file in files:
        if file.endswith(('.tsx', '.ts')) and not file.endswith('.d.ts'):
            full_path = os.path.join(root, file)
            
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                # Aplicar correções
                for old, new in common_issues:
                    content = content.replace(old, new)
                
                # Se houver mudanças, salvar
                if content != original_content:
                    with open(full_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Fixed: {full_path}")
                    
            except Exception as e:
                print(f"Error processing {full_path}: {e}")

print("Done!")
