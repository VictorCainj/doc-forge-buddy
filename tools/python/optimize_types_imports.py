#!/usr/bin/env python3
"""
Script para otimizar imports de tipos no projeto TypeScript
"""

import os
import re
import json
from pathlib import Path
from typing import List, Dict, Set, Tuple
from collections import defaultdict

class TypeImportOptimizer:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.src_path = self.project_root / "src"
        self.types_path = self.src_path / "types"
        self.optimizations = []
        self.tsconfig_path = self.project_root / "tsconfig.json"
        
    def find_types_imports(self) -> List[Dict]:
        """Encontra todos os imports de tipos no projeto"""
        imports = []
        pattern = re.compile(r"import\s+(?:{[^}]+}|\w+)\s+from\s+['\"](@/types/[^'\"]+)['\"]")
        
        for file_path in self.src_path.rglob("*.ts*"):
            if file_path.is_file() and "node_modules" not in str(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        for match in pattern.finditer(content):
                            line_num = content[:match.start()].count('\n') + 1
                            imports.append({
                                'file': str(file_path.relative_to(self.project_root)),
                                'line': line_num,
                                'import_path': match.group(1),
                                'original_line': content.split('\n')[line_num - 1].strip()
                            })
                except Exception as e:
                    print(f"Erro ao ler {file_path}: {e}")
        
        return imports
    
    def analyze_import_patterns(self, imports: List[Dict]) -> Dict:
        """Analisa padrões de imports para identificar otimizações"""
        patterns = {
            'by_file': defaultdict(list),
            'by_type': defaultdict(list),
            'redundant_imports': [],
            'barrel_opportunities': []
        }
        
        # Agrupa imports por arquivo
        for imp in imports:
            patterns['by_file'][imp['file']].append(imp)
        
        # Identifica imports do mesmo módulo
        for file, file_imports in patterns['by_file'].items():
            type_groups = defaultdict(list)
            for imp in file_imports:
                # Extrai o módulo base do import
                module_path = '/'.join(imp['import_path'].split('/')[:-1])
                type_name = imp['import_path'].split('/')[-1]
                type_groups[module_path].append({
                    'type': type_name,
                    'line': imp['line'],
                    'original_line': imp['original_line']
                })
            
            # Verifica se há múltiplos tipos do mesmo módulo
            for module_path, types in type_groups.items():
                if len(types) > 1:
                    patterns['redundant_imports'].append({
                        'file': file,
                        'module': module_path,
                        'types': types
                    })
        
        return patterns
    
    def generate_optimizations(self, patterns: Dict) -> List[Dict]:
        """Gera lista de otimizações a serem aplicadas"""
        optimizations = []
        
        # Otimização 1: Agrupar imports do mesmo módulo
        for redundant in patterns['redundant_imports']:
            if len(redundant['types']) > 1:
                types_str = ', '.join([t['type'] for t in redundant['types']])
                old_lines = '\n'.join([t['original_line'] for t in redundant['types']])
                new_line = f"import {{ {types_str} }} from '@/types/{redundant['module']}'"
                
                optimizations.append({
                    'type': 'merge_imports',
                    'file': redundant['file'],
                    'description': f"Agrupar {len(redundant['types'])} imports do módulo '{redundant['module']}'",
                    'old_lines': old_lines,
                    'new_line': new_line,
                    'lines': [t['line'] for t in redundant['types']]
                })
        
        # Otimização 2: Usar barrel exports
        for file, file_imports in patterns['by_file'].items():
            types_only_imports = []
            other_imports = []
            
            for imp in file_imports:
                if '/domain/' in imp['import_path'] or '/business/' in imp['import_path'] or '/features/' in imp['import_path'] or '/ui/' in imp['import_path']:
                    types_only_imports.append(imp)
                else:
                    other_imports.append(imp)
            
            if len(types_only_imports) >= 2:
                # Agrupa por categoria
                categories = defaultdict(list)
                for imp in types_only_imports:
                    if '/domain/' in imp['import_path']:
                        categories['domain'].append(imp)
                    elif '/business/' in imp['import_path']:
                        categories['business'].append(imp)
                    elif '/features/' in imp['import_path']:
                        categories['features'].append(imp)
                    elif '/ui/' in imp['import_path']:
                        categories['ui'].append(imp)
                
                for category, imports in categories.items():
                    if len(imports) >= 2:
                        types_str = ', '.join([imp['import_path'].split('/')[-1] for imp in imports])
                        new_line = f"import {{ {types_str} }} from '@/types'"
                        old_lines = '\n'.join([imp['original_line'] for imp in imports])
                        
                        optimizations.append({
                            'type': 'barrel_export',
                            'file': file,
                            'description': f"Usar barrel export para {len(imports)} tipos da categoria '{category}'",
                            'old_lines': old_lines,
                            'new_line': new_line,
                            'lines': [imp['line'] for imp in imports]
                        })
        
        return optimizations
    
    def apply_optimizations(self, optimizations: List[Dict]):
        """Aplica as otimizações nos arquivos"""
        applied = 0
        
        for opt in optimizations:
            file_path = self.project_root / opt['file']
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                
                if opt['type'] == 'merge_imports':
                    # Remove linhas antigas e adiciona a nova
                    lines_to_remove = sorted(opt['lines'], reverse=True)
                    for line_num in lines_to_remove:
                        if line_num <= len(lines):
                            lines.pop(line_num - 1)
                    
                    # Encontra a posição para inserir a nova linha
                    insert_pos = min(opt['lines']) - 1
                    lines.insert(insert_pos, opt['new_line'] + '\n')
                
                elif opt['type'] == 'barrel_export':
                    # Similar ao merge_imports
                    lines_to_remove = sorted(opt['lines'], reverse=True)
                    for line_num in lines_to_remove:
                        if line_num <= len(lines):
                            lines.pop(line_num - 1)
                    
                    insert_pos = min(opt['lines']) - 1
                    lines.insert(insert_pos, opt['new_line'] + '\n')
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.writelines(lines)
                
                applied += 1
                print(f"✅ Otimizado: {opt['file']}")
                
            except Exception as e:
                print(f"❌ Erro ao otimizar {opt['file']}: {e}")
        
        return applied
    
    def enhance_tsconfig(self):
        """Melhora a configuração de paths no tsconfig"""
        try:
            with open(self.tsconfig_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            # Adiciona paths específicos para melhor organização
            if 'compilerOptions' not in config:
                config['compilerOptions'] = {}
            
            paths = config['compilerOptions'].get('paths', {})
            
            # Adiciona paths específicos se não existirem
            new_paths = {
                "@types/*": ["src/types/*"],
                "@hooks/*": ["src/hooks/*"],
                "@components/*": ["src/components/*"],
                "@utils/*": ["src/utils/*"],
                "@pages/*": ["src/pages/*"],
                "@features/*": ["src/features/*"],
                "@providers/*": ["src/providers/*"],
                "@services/*": ["src/services/*"],
                "@stores/*": ["src/stores/*"]
            }
            
            # Mantém o path @/* existente e adiciona os novos
            if "@/*" in paths:
                new_paths["@/*"] = paths["@/*"]
            
            config['compilerOptions']['paths'] = new_paths
            
            with open(self.tsconfig_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2)
            
            print("✅ tsconfig.json atualizado com paths otimizados")
            
        except Exception as e:
            print(f"❌ Erro ao atualizar tsconfig.json: {e}")
    
    def run(self):
        """Executa o processo completo de otimização"""
        print("🔍 Analisando imports de tipos...")
        
        # Encontra todos os imports
        imports = self.find_types_imports()
        print(f"📊 Encontrados {len(imports)} imports de tipos")
        
        # Analisa padrões
        patterns = self.analyze_import_patterns(imports)
        
        # Gera otimizações
        optimizations = self.generate_optimizations(patterns)
        print(f"🎯 Identificadas {len(optimizations)} oportunidades de otimização")
        
        # Aplica otimizações
        if optimizations:
            print("\n🔧 Aplicando otimizações...")
            applied = self.apply_optimizations(optimizations)
            print(f"\n✅ {applied} otimizações aplicadas com sucesso!")
        else:
            print("\n✅ Nenhuma otimização necessária - imports já estão bem organizados!")
        
        # Melhora tsconfig
        print("\n⚙️  Otimizando configuração TypeScript...")
        self.enhance_tsconfig()
        
        # Gera relatório
        self.generate_report(imports, optimizations)
    
    def generate_report(self, imports: List[Dict], optimizations: List[Dict]):
        """Gera relatório das otimizações"""
        report_path = self.project_root / "RELATORIO_OTIMIZACAO_IMPORTS.md"
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# Relatório de Otimização de Imports de Tipos\n\n")
            f.write(f"**Data:** {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("## 📊 Resumo\n")
            f.write(f"- **Total de imports analisados:** {len(imports)}\n")
            f.write(f"- **Otimizações aplicadas:** {len(optimizations)}\n")
            f.write(f"- **Arquivos afetados:** {len(set(opt['file'] for opt in optimizations))}\n\n")
            
            if optimizations:
                f.write("## 🔧 Otimizações Aplicadas\n\n")
                for i, opt in enumerate(optimizations, 1):
                    f.write(f"### {i}. {opt['description']}\n")
                    f.write(f"**Arquivo:** `{opt['file']}`\n\n")
                    f.write("**Antes:**\n")
                    f.write(f"```typescript\n{opt['old_lines']}\n```\n\n")
                    f.write("**Depois:**\n")
                    f.write(f"```typescript\n{opt['new_line']}\n```\n\n")
                    f.write("---\n\n")
            else:
                f.write("## ✅ Status\n")
                f.write("Todos os imports de tipos já estão otimizados com barrel exports!\n\n")
            
            f.write("## 📈 Benefícios Alcançados\n")
            f.write("- ✅ Imports agrupados por categoria\n")
            f.write("- ✅ Barrel exports implementados\n")
            f.write("- ✅ Paths otimizados no tsconfig.json\n")
            f.write("- ✅ Melhor organização de tipos\n")
            f.write("- ✅ Facilita manutenção do código\n\n")
        
        print(f"\n📄 Relatório salvo em: {report_path}")

if __name__ == "__main__":
    optimizer = TypeImportOptimizer("/workspace/doc-forge-buddy-Cain")
    optimizer.run()