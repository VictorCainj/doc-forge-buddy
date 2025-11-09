#!/usr/bin/env python3
"""
Script de validação para imports de tipos otimizados
"""

import os
import subprocess
import json
from pathlib import Path
from typing import List, Dict

def validate_typescript_compilation(project_root: str) -> Dict:
    """Valida se o TypeScript está compilando sem erros"""
    result = {
        'success': False,
        'output': '',
        'errors': []
    }
    
    try:
        # Executa tsc --noEmit para verificar tipos sem gerar arquivos
        os.chdir(project_root)
        process = subprocess.run(
            ['npx', 'tsc', '--noEmit', '--skipLibCheck'],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        result['output'] = process.stdout + process.stderr
        result['success'] = process.returncode == 0
        
        if not result['success']:
            # Extrai apenas erros relacionados a imports
            lines = result['output'].split('\n')
            for line in lines:
                if 'import' in line and ('error' in line.lower() or 'cannot find module' in line.lower()):
                    result['errors'].append(line.strip())
        
    except subprocess.TimeoutExpired:
        result['errors'].append('Timeout na compilação TypeScript')
    except Exception as e:
        result['errors'].append(f'Erro ao executar TypeScript: {e}')
    
    return result

def check_import_patterns(project_root: str) -> Dict:
    """Verifica se os padrões de import estão corretos"""
    src_path = Path(project_root) / "src"
    analysis = {
        'total_files': 0,
        'import_errors': [],
        'good_patterns': 0,
        'improvement_suggestions': []
    }
    
    import_patterns = {
        'good': [
            r"import\s*{[^}]*}\s*from\s*['\"]@/types/['\"]",
            r"import\s*{[^}]*}\s*from\s*['\"]@/types/[^'\"]*['\"]",
        ],
        'bad': [
            r"import\s*{[^}]*}\s*from\s*['\"][^'\"]*types/[^'\"]*['\"]",  # Caminhos absolutos
            r"import\s*{[^}]*}\s*from\s*['\"]\.\./\.\./\.\./types/['\"]",  # Paths relativos longos
        ]
    }
    
    for file_path in src_path.rglob("*.ts*"):
        if file_path.is_file() and "node_modules" not in str(file_path) and ".d.ts" not in str(file_path):
            analysis['total_files'] += 1
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    lines = content.split('\n')
                    
                    for i, line in enumerate(lines):
                        if 'import' in line and '@/types' in line:
                            # Verifica padrões ruins
                            for bad_pattern in import_patterns['bad']:
                                if re.search(bad_pattern, line):
                                    analysis['import_errors'].append({
                                        'file': str(file_path.relative_to(project_root)),
                                        'line': i + 1,
                                        'content': line.strip(),
                                        'issue': 'Use @/types/ alias instead of relative/absolute paths'
                                    })
                            
                            # Verifica padrões bons
                            for good_pattern in import_patterns['good']:
                                if re.search(good_pattern, line):
                                    analysis['good_patterns'] += 1
                                    break
                            
            except Exception as e:
                analysis['import_errors'].append({
                    'file': str(file_path.relative_to(project_root)),
                    'line': 0,
                    'content': f'Erro ao ler arquivo: {e}',
                    'issue': 'File read error'
                })
    
    return analysis

def check_barrel_exports(project_root: str) -> Dict:
    """Verifica se os barrel exports estão funcionando"""
    types_path = Path(project_root) / "src" / "types"
    status = {
        'main_index_exists': False,
        'category_indexes_exist': [],
        'export_consistency': True,
        'issues': []
    }
    
    # Verifica barrel export principal
    main_index = types_path / "index.ts"
    if main_index.exists():
        status['main_index_exists'] = True
        try:
            with open(main_index, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'export * from' not in content:
                    status['issues'].append('Main index.ts does not contain export statements')
                    status['export_consistency'] = False
        except Exception as e:
            status['issues'].append(f'Error reading main index: {e}')
    else:
        status['issues'].append('Main types/index.ts does not exist')
        status['export_consistency'] = False
    
    # Verifica barrel exports por categoria
    categories = ['domain', 'business', 'features', 'ui']
    for category in categories:
        category_index = types_path / category / "index.ts"
        if category_index.exists():
            status['category_indexes_exist'].append(category)
            try:
                with open(category_index, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if 'export * from' not in content and 'export {' not in content:
                        status['issues'].append(f'Category index {category}/index.ts is empty or malformed')
            except Exception as e:
                status['issues'].append(f'Error reading {category}/index.ts: {e}')
    
    return status

def main():
    project_root = "/workspace/doc-forge-buddy-Cain"
    
    print("🔍 Validando otimizações de imports de tipos...\n")
    
    # 1. Validação de compilação TypeScript
    print("1. 📋 Verificando compilação TypeScript...")
    ts_result = validate_typescript_compilation(project_root)
    
    if ts_result['success']:
        print("   ✅ TypeScript compilou sem erros")
    else:
        print("   ❌ Erros encontrados na compilação:")
        for error in ts_result['errors']:
            print(f"      - {error}")
    
    # 2. Verificação de padrões de import
    print("\n2. 📊 Analisando padrões de import...")
    import_analysis = check_import_patterns(project_root)
    
    print(f"   📁 {import_analysis['total_files']} arquivos TypeScript analisados")
    print(f"   ✅ {import_analysis['good_patterns']} imports com padrões corretos")
    
    if import_analysis['import_errors']:
        print("   ⚠️  Problemas encontrados:")
        for error in import_analysis['import_errors'][:5]:  # Mostra apenas os primeiros 5
            print(f"      - {error['file']}:{error['line']} - {error['issue']}")
        if len(import_analysis['import_errors']) > 5:
            print(f"      ... e mais {len(import_analysis['import_errors']) - 5} problemas")
    
    # 3. Verificação de barrel exports
    print("\n3. 📦 Verificando barrel exports...")
    barrel_status = check_barrel_exports(project_root)
    
    if barrel_status['main_index_exists']:
        print("   ✅ Barrel export principal existe")
    else:
        print("   ❌ Barrel export principal não encontrado")
    
    if barrel_status['category_indexes_exist']:
        print(f"   ✅ {len(barrel_status['category_indexes_exist'])} categorias com barrel exports")
    
    if barrel_status['issues']:
        print("   ⚠️  Problemas nos barrel exports:")
        for issue in barrel_status['issues']:
            print(f"      - {issue}")
    
    # 4. Resumo final
    print("\n" + "="*60)
    print("📋 RESUMO DA VALIDAÇÃO")
    print("="*60)
    
    if ts_result['success'] and not import_analysis['import_errors'] and barrel_status['export_consistency']:
        print("🎉 TODAS AS VALIDAÇÕES PASSARAM!")
        print("✅ Imports de tipos estão otimizados e funcionando corretamente")
    else:
        print("⚠️  ALGUNS PROBLEMAS FORAM IDENTIFICADOS:")
        
        if not ts_result['success']:
            print("   - Erros de compilação TypeScript")
        if import_analysis['import_errors']:
            print(f"   - {len(import_analysis['import_errors'])} padrões de import melhoráveis")
        if not barrel_status['export_consistency']:
            print("   - Problemas nos barrel exports")
    
    print("\n💡 RECOMENDAÇÕES:")
    if import_analysis['import_errors']:
        print("   - Use sempre @/types/ para imports de tipos")
        print("   - Prefira barrel exports @/types para grupos de tipos")
    if not barrel_status['main_index_exists']:
        print("   - Crie barrel exports para melhor organização")
    
    print("   - Execute esta validação periodicamente")
    print("   - Mantenha a estrutura de tipos organizada")

if __name__ == "__main__":
    import re
    main()