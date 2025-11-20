#!/usr/bin/env python3
"""
Script para migrar imports de hooks antigos para novos hooks consolidados.
Execute este script para atualizar automaticamente os imports no projeto.
"""

import os
import re
from pathlib import Path

# Mapeamento de imports antigos para novos
IMPORT_MAPPINGS = {
    # Contratos
    "from '@/hooks/useContractData'": "from '@/hooks/shared/useContractManager'",
    "from '@/hooks/useContractsQuery'": "from '@/hooks/shared/useContractManager'",
    "from '@/hooks/useCompleteContractData'": "from '@/hooks/shared/useContractManager'",
    "from '@/hooks/useContractAnalysis'": "from '@/hooks/shared/useContractManager'",
    "from '@/hooks/useContractsWithPendingBills'": "from '@/hooks/shared/useContractBills'",
    
    # Contas de contrato
    "from '@/hooks/useContractBills'": "from '@/hooks/shared/useContractBills'",
    "from '@/hooks/useContractBillsSync'": "from '@/hooks/shared/useContractBills'",
    
    # Imagens
    "from '@/hooks/useImageOptimizationGlobal'": "from '@/hooks/shared/useImageOptimizer'",
    "from '@/hooks/useOptimizedImages'": "from '@/hooks/shared/useImageOptimizer'",
    
    # Local Storage
    "from '@/hooks/useLocalStorage'": "from '@/hooks/shared/useLocalStorage'",
    
    # Auth
    "from '@/hooks/useAuth'": "from '@/hooks/providers/useAuthProvider'",
    
    # API
    "from '@/hooks/useOptimizedData'": "from '@/hooks/shared/useAPI'",
}

# Hooks que devem ser removidos (arquivos)
HOOKS_TO_REMOVE = [
    'useContractData.ts',
    'useContractsQuery.ts', 
    'useCompleteContractData.tsx',
    'useContractAnalysis.tsx',
    'useContractBillsSync.ts',
    'useImageOptimizationGlobal.ts',
    'useOptimizedImages.ts',
    'useOptimizedData.ts',
]

def migrate_file_imports(file_path):
    """Migra os imports de um arquivo específico."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Aplicar mapeamentos de import
        for old_import, new_import in IMPORT_MAPPINGS.items():
            content = content.replace(old_import, new_import)
        
        # Atualizar import do useAuth (caso específico)
        content = re.sub(
            r"import\s*{\s*useAuth\s*}\s*from\s*['\"]@/hooks/useAuth['\"]",
            "import { useAuth } from '@/hooks/providers/useAuthProvider'",
            content
        )
        
        # Atualizar import do useLocalStorage (caso específico)
        content = re.sub(
            r"import\s*{\s*useLocalStorage\s*}\s*from\s*['\"]@/hooks/useLocalStorage['\"]",
            "import { useLocalStorage } from '@/hooks/shared/useLocalStorage'",
            content
        )
        
        # Salvar se houve mudanças
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Atualizado: {file_path}")
            return True
        else:
            print(f"⏭️  Nenhuma mudança: {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao processar {file_path}: {e}")
        return False

def main():
    """Função principal de migração."""
    print("🚀 Iniciando migração de imports de hooks...")
    
    # Diretório do projeto
    project_root = Path(__file__).parent / "src"
    
    if not project_root.exists():
        print(f"❌ Diretório do projeto não encontrado: {project_root}")
        return
    
    # Contadores
    files_updated = 0
    files_processed = 0
    
    # Processar todos os arquivos TypeScript/JavaScript/TSX/JSX
    for file_path in project_root.rglob("*.{ts,tsx,js,jsx}"):
        # Pular arquivos de hooks consolidados e node_modules
        if 'node_modules' in str(file_path) or 'dist' in str(file_path) or 'build' in str(file_path):
            continue
            
        # Pular arquivos que vamos remover
        if file_path.name in HOOKS_TO_REMOVE:
            continue
            
        files_processed += 1
        if migrate_file_imports(file_path):
            files_updated += 1
    
    print(f"\n📊 Relatório da migração:")
    print(f"   - Arquivos processados: {files_processed}")
    print(f"   - Arquivos atualizados: {files_updated}")
    print(f"   - Taxa de atualização: {(files_updated/files_processed*100):.1f}%" if files_processed > 0 else "   - Nenhum arquivo processado")
    
    # Oferecer para remover hooks antigos
    print(f"\n🗑️  Hooks antigos identificados para remoção:")
    for hook in HOOKS_TO_REMOVE:
        hook_path = project_root / "hooks" / hook
        if hook_path.exists():
            print(f"   - {hook}")
    
    print(f"\n📝 Próximos passos:")
    print(f"   1. Revise os arquivos atualizados")
    print(f"   2. Execute os testes para verificar compatibilidade")
    print(f"   3. Remova os hooks antigos se tudo estiver funcionando")
    print(f"   4. Atualize a documentação se necessário")
    
    response = input(f"\n🤔 Deseja remover os hooks antigos agora? (y/N): ").strip().lower()
    if response == 'y':
        remove_old_hooks(project_root)
    else:
        print("⏸️  Migração concluída sem remoção. Você pode remover os hooks manualmente mais tarde.")

def remove_old_hooks(project_root):
    """Remove os hooks antigos após confirmação."""
    print("\n🗑️  Removendo hooks antigos...")
    
    removed_count = 0
    for hook in HOOKS_TO_REMOVE:
        hook_path = project_root / "hooks" / hook
        if hook_path.exists():
            try:
                hook_path.unlink()
                print(f"   ✅ Removido: {hook}")
                removed_count += 1
            except Exception as e:
                print(f"   ❌ Erro ao remover {hook}: {e}")
    
    print(f"\n📊 {removed_count} hooks antigos removidos com sucesso!")
    print(f"🎉 Migração de hooks concluída!")

if __name__ == "__main__":
    main()