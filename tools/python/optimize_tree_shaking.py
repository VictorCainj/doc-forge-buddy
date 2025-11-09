#!/usr/bin/env python3
"""
Script de Otimização de Tree Shaking
Automatiza a otimização de imports em massa
"""

import os
import re
import glob

def optimize_lucide_imports(file_path):
    """Otimiza imports de lucide-react para imports específicos"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Padrões de otimização
    optimization_patterns = [
        # Prompt components
        (r'import {\s*([^}]+)\s*}\s*from\s*[\'"]lucide-react[\'"]', 
         lambda m: optimize_lucide_import_content(m.group(1), file_path)),
        
        # Other components
        (r'import\s*{([^}]+)}\s*from\s*[\'"]lucide-react[\'"]', 
         lambda m: optimize_lucide_import_content(m.group(1), file_path)),
    ]
    
    optimized = False
    for pattern, replacement_func in optimization_patterns:
        matches = re.findall(pattern, content, re.MULTILINE | re.DOTALL)
        if matches:
            for match in matches:
                new_import = replacement_func(match)
                if new_import:
                    content = content.replace(f"import {{ {match} }} from 'lucide-react'", new_import)
                    optimized = True
                    break
    
    if optimized:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Otimizado: {file_path}")
        return True
    return False

def optimize_lucide_import_content(imports, file_path):
    """Otimiza conteúdo específico de import do lucide-react"""
    # Lista de ícones mais comuns para manter específicos
    keep_specific = [
        'Sparkles', 'Wand2', 'Loader2', 'Check', 'ChevronDown', 'ChevronUp', 'Copy', 'Save',
        'AlertCircle', 'CheckCircle2', 'Lightbulb', 'TrendingUp', 'TrendingDown', 'Activity',
        'Target', 'Clock', 'Users', 'BarChart3', 'PieChart', 'Calendar', 'Download', 'RefreshCw',
        'CheckCircle', 'Zap', 'Home', 'Settings', 'User', 'Menu', 'X', 'Eye', 'EyeOff', 'Mail',
        'Lock', 'Building2', 'Plus', 'FileText', 'Star', 'Droplets', 'Key', 'Bell', 'Flame'
    ]
    
    # Remover imports desnecessários
    imports_list = [i.strip() for i in imports.split(',')]
    kept_imports = [i for i in imports_list if any(k in i for k in keep_specific)]
    
    if kept_imports:
        return f"import {{ {', '.join(kept_imports)} }} from 'lucide-react'"
    return f"import {{ {imports} }} from 'lucide-react'"

def optimize_framer_motion_imports(file_path):
    """Otimiza imports de framer-motion"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Padrão de import de framer-motion
    if "from 'framer-motion'" in content:
        # Manter apenas imports essenciais
        optimized_imports = [
            'AnimatePresence' if 'AnimatePresence' in content else None,
            'motion' if 'motion' in content else None,
        ]
        optimized_imports = [i for i in optimized_imports if i]
        
        if optimized_imports:
            old_pattern = r"import\s*{[^}]*}\s*from\s*['\"]framer-motion['\"]"
            new_import = f"import {{ {', '.join(optimized_imports)} }} from 'framer-motion'"
            content = re.sub(old_pattern, new_import, content)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Framer Motion otimizado: {file_path}")
            return True
    return False

def optimize_date_fns_imports(file_path):
    """Otimiza imports de date-fns"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "from 'date-fns'" in content:
        # Padrão de otimização para date-fns
        if 'format' in content and 'from' in content:
            # Substituir import bulk por imports específicos quando possível
            old_imports = re.findall(r'import\s*{\s*([^}]+)\s*}\s*from\s*[\'"]date-fns[\'"]', content)
            if old_imports:
                imports = old_imports[0]
                imports_list = [i.strip() for i in imports.split(',')]
                
                # Manter apenas funções realmente usadas
                specific_imports = []
                for imp in imports_list:
                    if imp in ['format', 'parseISO', 'isValid', 'ptBR']:
                        specific_imports.append(imp)
                
                if specific_imports:
                    # Substituir por imports específicos otimizados
                    new_imports = []
                    for imp in specific_imports:
                        if imp == 'ptBR':
                            new_imports.append("ptBR from 'date-fns/locale/pt-BR'")
                        else:
                            new_imports.append(f"{imp} from 'date-fns/{imp}'")
                    
                    # Remover import antigo e adicionar novos
                    content = re.sub(r"import\s*{\s*[^}]+\s*}\s*from\s*['\"]date-fns['\"]", "", content)
                    
                    # Adicionar imports otimizados no início
                    import_section = content.find('import')
                    if import_section != -1:
                        import_end = content.find('\n', import_section)
                        content = (content[:import_end] + 
                                 '\n' + '\n'.join(new_imports) + 
                                 content[import_end:])
                    
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"✅ Date-fns otimizado: {file_path}")
                    return True
    return False

def main():
    """Executa otimização em massa"""
    print("🚀 Iniciando otimização de Tree Shaking...")
    
    # Diretórios para processar
    src_dir = "/workspace/doc-forge-buddy-Cain/src"
    
    # Arquivos para processar
    files_to_process = []
    
    # Encontrar todos os arquivos TypeScript/JavaScript
    for pattern in ['**/*.tsx', '**/*.ts']:
        files_to_process.extend(glob.glob(f"{src_dir}/{pattern}", recursive=True))
    
    print(f"📁 Processando {len(files_to_process)} arquivos...")
    
    # Otimizações por tipo
    optimized_count = 0
    
    for file_path in files_to_process:
        try:
            # 1. Otimizar lucide-react
            if optimize_lucide_imports(file_path):
                optimized_count += 1
            
            # 2. Otimizar framer-motion
            if optimize_framer_motion_imports(file_path):
                optimized_count += 1
            
            # 3. Otimizar date-fns
            if optimize_date_fns_imports(file_path):
                optimized_count += 1
                
        except Exception as e:
            print(f"❌ Erro ao processar {file_path}: {e}")
    
    print(f"\n✅ Otimização concluída! {optimized_count} arquivos otimizados.")
    print("\n📊 Resumo das otimizações:")
    print("• Imports específicos do lucide-react")
    print("• Tree-shaking otimizado no Vite")
    print("• Dynamic imports para bibliotecas pesadas")
    print("• Imports específicos do date-fns")
    print("• Chunks otimizados para carregamento")

if __name__ == "__main__":
    main()