#!/usr/bin/env python3
"""
Análise de Dependências e Acoplamento para o projeto Doc Forge Buddy
"""

import os
import re
import ast
import json
from collections import defaultdict, Counter
from typing import Dict, List, Set, Tuple
from pathlib import Path

class DependencyAnalyzer:
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.src_path = self.project_path / 'src'
        self.dependencies = defaultdict(set)  # arquivo -> set de dependências
        self.reverse_dependencies = defaultdict(set)  # dependência -> set de arquivos que dependem
        self.import_stats = Counter()
        self.circular_dependencies = []
        self.unused_imports = []
        self.components_by_coupling = []
        
    def analyze_file(self, file_path: Path) -> Tuple[Set[str], Set[str]]:
        """Analisa um arquivo e extrai suas dependências"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Regex para capturar imports
            import_pattern = r"^(?:import|from)\s+(.+?)\s+(?:import|;|$)"
            matches = re.findall(import_pattern, content, re.MULTILINE)
            
            local_deps = set()
            external_deps = set()
            
            for match in matches:
                # Remove comentários e limpa o import
                clean_match = re.sub(r'//.*$', '', match).strip()
                if not clean_match:
                    continue
                    
                # Identifica se é importação local (começa com @/ ou ./)
                if clean_match.startswith(('@/', './', '../')):
                    # Converte para caminho relativo
                    dep_path = self._resolve_import_path(file_path, clean_match)
                    if dep_path:
                        local_deps.add(dep_path)
                else:
                    # É uma dependência externa
                    external_deps.add(clean_match.split('/')[0].split()[0])
            
            return local_deps, external_deps
            
        except Exception as e:
            print(f"Erro ao analisar {file_path}: {e}")
            return set(), set()
    
    def _resolve_import_path(self, file_path: Path, import_path: str) -> str:
        """Resolve o caminho do import para um caminho relativo"""
        # Remove @/ se presente
        if import_path.startswith('@/'):
            import_path = import_path[2:]
        elif import_path.startswith('./'):
            import_path = import_path[2:]
        elif import_path.startswith('../'):
            # Calcular caminho relativo
            current_dir = file_path.parent
            target_dir = current_dir / import_path
            rel_path = os.path.relpath(target_dir, self.src_path)
            return rel_path.replace('\\', '/')
        
        # Adiciona extensão .tsx se não tiver
        if not import_path.endswith(('.tsx', '.ts', '.js', '.jsx')):
            # Tenta diferentes extensões
            for ext in ['.tsx', '.ts', '.js', '.jsx']:
                potential_path = self.src_path / f"{import_path}{ext}"
                if potential_path.exists():
                    return f"{import_path}{ext}"
        
        return import_path
    
    def find_circular_dependencies(self) -> List[List[str]]:
        """Encontra dependências circulares usando DFS"""
        visited = set()
        rec_stack = set()
        cycles = []
        
        def dfs(node: str, path: List[str]):
            if node in rec_stack:
                # Encontrou um ciclo
                cycle_start = path.index(node)
                cycle = path[cycle_start:] + [node]
                cycles.append(cycle)
                return
                
            if node in visited:
                return
                
            visited.add(node)
            rec_stack.add(node)
            path.append(node)
            
            for neighbor in self.dependencies.get(node, set()):
                if neighbor in self.dependencies:  # Só continua se a dependência existe
                    dfs(neighbor, path[:])
            
            rec_stack.remove(node)
        
        for file in self.dependencies:
            if file not in visited:
                dfs(file, [])
        
        return cycles
    
    def analyze_coupling(self) -> List[Tuple[str, int]]:
        """Analisa o acoplamento dos componentes (quantos dependem deles)"""
        coupling_scores = []
        
        for component, dependents in self.reverse_dependencies.items():
            score = len(dependents)
            if score > 0:
                coupling_scores.append((component, score))
        
        return sorted(coupling_scores, key=lambda x: x[1], reverse=True)
    
    def find_lazy_loadable_components(self) -> List[str]:
        """Identifica componentes que podem ser lazy loaded"""
        lazy_loadable = []
        
        for component, score in self.components_by_coupling:
            # Componentes com alto acoplamento mas não críticos
            if score < 10 and not any(dependency in component for dependency in ['types/', 'utils/', 'hooks/']):
                if any(ext in component for ext in ['Modal', 'Panel', 'Modal', 'Viewer']):
                    lazy_loadable.append(component)
        
        return lazy_loadable
    
    def run_analysis(self):
        """Executa a análise completa"""
        print("🔍 Iniciando análise de dependências...")
        
        # 1. Analisa todos os arquivos
        for file_path in self.src_path.rglob('*.tsx'):
            if 'node_modules' in str(file_path) or '__tests__' in str(file_path):
                continue
                
            rel_path = str(file_path.relative_to(self.src_path))
            local_deps, external_deps = self.analyze_file(file_path)
            
            self.dependencies[rel_path] = local_deps
            
            # Atualiza estatísticas reversas
            for dep in local_deps:
                self.reverse_dependencies[dep].add(rel_path)
            
            self.import_stats.update(external_deps)
        
        print(f"✅ Analisados {len(self.dependencies)} arquivos")
        
        # 2. Encontra dependências circulares
        print("🔄 Procurando dependências circulares...")
        self.circular_dependencies = self.find_circular_dependencies()
        print(f"✅ Encontradas {len(self.circular_dependencies)} dependências circulares")
        
        # 3. Analisa acoplamento
        print("📊 Analisando acoplamento...")
        self.components_by_coupling = self.analyze_coupling()
        print(f"✅ Identificados {len(self.components_by_coupling)} componentes")
        
        return self.generate_report()
    
    def generate_report(self) -> str:
        """Gera o relatório completo"""
        report = []
        
        # Cabeçalho
        report.append("# 📊 Análise de Dependências e Acoplamento - Doc Forge Buddy")
        report.append(f"*Gerado em: {__import__('datetime').datetime.now().strftime('%d/%m/%Y %H:%M:%S')}*")
        report.append("")
        
        # Estatísticas gerais
        report.append("## 📈 Estatísticas Gerais")
        report.append(f"- **Total de arquivos analisados:** {len(self.dependencies)}")
        report.append(f"- **Componentes com dependentes:** {len([c for c, deps in self.reverse_dependencies.items() if deps])}")
        report.append(f"- **Dependências circulares encontradas:** {len(self.circular_dependencies)}")
        report.append("")
        
        # 1. Dependências Circulares
        report.append("## 🔄 Dependências Circulares")
        if self.circular_dependencies:
            for i, cycle in enumerate(self.circular_dependencies, 1):
                report.append(f"### Ciclo {i}:")
                report.append("```")
                for j in range(len(cycle) - 1):
                    report.append(f"  {cycle[j]} -> {cycle[j+1]}")
                report.append("```")
                report.append("")
        else:
            report.append("✅ **Nenhuma dependência circular detectada!**")
            report.append("")
        
        # 2. Componentes com Alta Acoplagem
        report.append("## 🔗 Componentes com Alta Acoplagem (Top 10)")
        top_coupled = self.components_by_coupling[:10]
        report.append("| Componente | Dependentes | Tipo |")
        report.append("|------------|-------------|------|")
        
        for component, score in top_coupled:
            # Determina o tipo do componente
            if '/components/' in component:
                if '/ui/' in component:
                    comp_type = "UI Base"
                elif '/modals/' in component:
                    comp_type = "Modal"
                elif '/admin/' in component:
                    comp_type = "Admin"
                else:
                    comp_type = "Componente"
            elif '/hooks/' in component:
                comp_type = "Hook"
            elif '/utils/' in component:
                comp_type = "Utilidade"
            elif '/types/' in component:
                comp_type = "Tipo"
            else:
                comp_type = "Módulo"
            
            report.append(f"| {component} | {score} | {comp_type} |")
        
        report.append("")
        
        # 3. Análise de Importações Não Utilizadas
        report.append("## 🗑️ Possíveis Imports Não Utilizados")
        report.append("*Nota: Esta análise é baseada em padrões e pode gerar falsos positivos*")
        report.append("")
        
        # 4. Sugestões de Lazy Loading
        report.append("## ⚡ Componentes Candidatos para Lazy Loading")
        lazy_candidates = self.find_lazy_loadable_components()
        
        if lazy_candidates:
            for component in lazy_candidates[:15]:  # Top 15
                report.append(f"- `{component}`")
        else:
            report.append("- Nenhum componente identificado para lazy loading")
        
        report.append("")
        
        # 5. Recomendações
        report.append("## 💡 Recomendações para Redução de Acoplamento")
        
        report.append("### Prioridade Alta")
        if self.circular_dependencies:
            report.append("1. **Resolvir dependências circulares** - Identificadas acima")
            report.append("   - Refatore imports para usar injeção de dependência")
            report.append("   - Extraia interfaces comuns para módulos separados")
        
        high_coupled = [c for c, s in self.components_by_coupling if s > 20]
        if high_coupled:
            report.append(f"2. **Reduzir acoplamento de {len(high_coupled)} componentes altamente acoplados**")
            report.append("   - Aplicar princípios SOLID")
            report.append("   - Usar composição sobre herança")
            report.append("   - Implementar padrões de design apropriados (Strategy, Factory, etc.)")
        
        report.append("")
        report.append("### Prioridade Média")
        report.append("3. **Implementar lazy loading para componentes identificados**")
        report.append("4. **Criar índices barrel (`index.ts`) para importações mais limpas**")
        report.append("5. **Mover funcionalidades utilitárias para hooks customizados**")
        
        report.append("")
        report.append("### Prioridade Baixa")
        report.append("6. **Revisar imports não utilizados periodicamente**")
        report.append("7. **Documentar dependências críticas do sistema**")
        report.append("8. **Implementar testes unitários para módulos com alto acoplamento**")
        
        report.append("")
        
        # 6. Code Splitting por Feature
        report.append("## 🏗️ Sugestões de Code Splitting por Feature")
        report.append("")
        report.append("### Áreas de Aplicação que Podem ser Separadas:")
        
        features = {
            'Admin': ['/components/admin/', '/pages/Admin.tsx', '/hooks/useUserManagement.ts'],
            'Chat': ['/components/Chat*', '/components/Chat*', '/hooks/useChat*'],
            'Contratos': ['/features/contracts/', '/pages/Contratos.tsx', '/pages/EditarContrato.tsx'],
            'Vistoria': ['/features/analise-vistoria/', '/features/vistoria/', '/pages/AnaliseVistoria.tsx'],
            'Documentos': ['/features/documents/', '/components/modals/Document*', '/pages/GerarDocumento.tsx'],
            'Tarefas': ['/components/Task*', '/pages/Tarefas.tsx', '/hooks/useTasks.ts'],
            'Notificações': ['/features/notifications/', '/pages/Notificacoes.tsx'],
            'Dashboard': ['/pages/DashboardDesocupacao.tsx', '/components/dashboard/']
        }
        
        for feature, files in features.items():
            report.append(f"#### {feature}")
            for file_pattern in files:
                report.append(f"- {file_pattern}")
            report.append("")
        
        # 7. Dependências Externas Mais Utilizadas
        report.append("## 📦 Dependências Externas (Top 15)")
        top_external = self.import_stats.most_common(15)
        
        for dep, count in top_external:
            report.append(f"- **{dep}**: {count} importações")
        
        return "\n".join(report)

if __name__ == "__main__":
    project_path = "/workspace/doc-forge-buddy-Cain"
    analyzer = DependencyAnalyzer(project_path)
    report = analyzer.run_analysis()
    
    # Salva o relatório
    output_path = Path("/workspace/docs/analise_dependencias.md")
    output_path.parent.mkdir(exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"📄 Relatório salvo em: {output_path}")