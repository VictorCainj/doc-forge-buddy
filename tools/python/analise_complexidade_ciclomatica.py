#!/usr/bin/env python3
"""
Analisador de Complexidade Ciclomática para TypeScript/React
Calcula a complexidade ciclomática baseada em estruturas de controle
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass, asdict
import argparse

@dataclass
class FunctionComplexity:
    name: str
    file_path: str
    line_start: int
    line_end: int
    complexity: int
    complexity_breakdown: Dict[str, int]
    
@dataclass
class FileComplexity:
    file_path: str
    total_complexity: int
    average_complexity: float
    functions: List[FunctionComplexity]
    file_size: int
    is_component: bool
    category: str

class CyclomaticComplexityAnalyzer:
    """Analisador de Complexidade Ciclomática para TypeScript/React"""
    
    def __init__(self):
        self.results: List[FileComplexity] = []
        
        # Padrões que adicionam complexidade
        self.complexity_patterns = {
            'if_statements': r'\bif\s*\(',
            'else_if': r'\belse\s+if\s*\(',
            'else': r'\belse\b',
            'switch': r'\bswitch\s*\(',
            'case': r'\bcase\s+',
            'default': r'\bdefault\s*:',
            'for_loop': r'\bfor\s*\(',
            'while_loop': r'\bwhile\s*\(',
            'do_while': r'\bdo\s*\{',
            'try_catch': r'\btry\s*\{',
            'catch': r'\bcatch\s*\(',
            'finally': r'\bfinally\s*\{',
            'ternary': r'[^?:]*\?[^:]*:',
            'logical_and': r'\&\&',
            'logical_or': r'\|\|',
            'optional_chaining': r'\?\.',
            'nullish_coalescing': r'\?\?',
            'map_with_logic': r'\.map\s*\([^)]*\([^)]*\)[^)]*\)',
            'filter_with_logic': r'\.filter\s*\([^)]*\([^)]*\)[^)]*\)',
            'reduce_with_logic': r'\.reduce\s*\([^)]*\([^)]*\)[^)]*\)',
            'event_handlers': r'\bon[A-Z][a-zA-Z]*\s*=\s*\([^)]*\)\s*=?>\s*\{',
            'arrow_function_jsx': r'=>\s*\{[^}]*(?:if|switch|for|while|try)\b',
            'conditional_rendering': r'\{[^}]*\?[^}]*\}',
            'array_method_callback': r'\.(?:map|filter|reduce|find|some|every)\s*\([^)]*=>',
            'short_circuit': r'\{[^}]*&&[^}]*\}',
        }
        
        # Pesos para diferentes tipos de complexidade
        self.complexity_weights = {
            'if_statements': 1,
            'else_if': 1,
            'else': 0.5,  # Else sem condition adiciona menos complexidade
            'switch': 1,
            'case': 1,
            'default': 0.5,
            'for_loop': 1,
            'while_loop': 1,
            'do_while': 1,
            'try_catch': 1,
            'catch': 1,
            'finally': 0.5,
            'ternary': 1,
            'logical_and': 1,
            'logical_or': 1,
            'optional_chaining': 0.5,
            'nullish_coalescing': 0.5,
            'map_with_logic': 2,  # Alto peso por ser mais complexo
            'filter_with_logic': 2,
            'reduce_with_logic': 2,
            'event_handlers': 2,
            'arrow_function_jsx': 1.5,
            'conditional_rendering': 1,
            'array_method_callback': 1.5,
            'short_circuit': 1,
        }
    
    def calculate_function_complexity(self, content: str, file_path: str) -> List[FunctionComplexity]:
        """Calcula complexidade de funções individuais"""
        functions = []
        lines = content.split('\n')
        
        # Padrões para detectar funções
        function_patterns = [
            r'(?:function\s+(\w+)\s*\([^)]*\)\s*\{)',
            r'(?:const\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|[^=]*=>)\s*\{)',
            r'(?:(\w+)\s*:\s*(?:\([^)]*\)\s*=>|[^=]*=>)\s*\{)',
            r'(?:(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{)',
            r'(?:const\s+(\w+)\s*=\s*function\s*\([^)]*\)\s*\{)',
        ]
        
        function_stack = []
        
        for i, line in enumerate(lines):
            # Detectar início de função
            for pattern in function_patterns:
                matches = re.finditer(pattern, line, re.MULTILINE)
                for match in matches:
                    func_name = match.group(1) if match.groups() else 'anonymous'
                    
                    # Encontrar o final da função
                    end_line = self._find_function_end(lines, i)
                    
                    # Extrair conteúdo da função
                    func_content = '\n'.join(lines[i:end_line+1])
                    complexity = self._calculate_complexity_of_text(func_content)
                    
                    functions.append(FunctionComplexity(
                        name=func_name,
                        file_path=file_path,
                        line_start=i+1,
                        line_end=end_line+1,
                        complexity=complexity['total'],
                        complexity_breakdown=complexity['breakdown']
                    ))
        
        return functions
    
    def _find_function_end(self, lines: List[str], start_line: int) -> int:
        """Encontra o final de uma função baseado em chaves balanceadas"""
        brace_count = 0
        in_function = False
        
        for i in range(start_line, len(lines)):
            line = lines[i]
            
            for char in line:
                if char == '{':
                    brace_count += 1
                    in_function = True
                elif char == '}':
                    brace_count -= 1
                    if in_function and brace_count == 0:
                        return i
        
        return start_line + 10  # Fallback
    
    def _calculate_complexity_of_text(self, text: str) -> Dict[str, int]:
        """Calcula complexidade de um texto específico"""
        breakdown = {}
        total = 1  # Base complexity
        
        for pattern_name, pattern in self.complexity_patterns.items():
            matches = len(re.findall(pattern, text, re.MULTILINE | re.DOTALL))
            if matches > 0:
                breakdown[pattern_name] = matches
                total += matches * self.complexity_weights.get(pattern_name, 1)
        
        return {'total': total, 'breakdown': breakdown}
    
    def analyze_file(self, file_path: str) -> FileComplexity:
        """Analisa um arquivo completo"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"Erro ao ler {file_path}: {e}")
            return None
        
        # Calcular complexidade total do arquivo
        file_complexity_data = self._calculate_complexity_of_text(content)
        total_complexity = file_complexity_data['total']
        
        # Identificar funções
        functions = self.calculate_function_complexity(content, file_path)
        
        # Calcular complexidade média
        if functions:
            average_complexity = sum(f.complexity for f in functions) / len(functions)
        else:
            # Se não há funções definidas, usar a complexidade calculada diretamente
            average_complexity = total_complexity
        
        # Identificar tipo do arquivo
        is_component = self._is_react_component(file_path, content)
        category = self._categorize_file(file_path, is_component)
        
        return FileComplexity(
            file_path=file_path,
            total_complexity=total_complexity,
            average_complexity=average_complexity,
            functions=functions,
            file_size=len(content),
            is_component=is_component,
            category=category
        )
    
    def _is_react_component(self, file_path: str, content: str) -> bool:
        """Identifica se é um componente React"""
        return (
            file_path.endswith('.tsx') and
            ('import React' in content or 'from \'react\'' in content or 'from "react"' in content) and
            ('export default' in content or 'function ' in content or 'const ' in content)
        )
    
    def _categorize_file(self, file_path: str, is_component: bool) -> str:
        """Categoriza o arquivo baseado no caminho"""
        path_parts = file_path.split('/')
        
        if 'components' in path_parts:
            if is_component:
                return 'React Component'
            return 'Component Utility'
        elif 'pages' in path_parts:
            return 'Page'
        elif 'hooks' in path_parts:
            return 'Custom Hook'
        elif 'utils' in path_parts:
            return 'Utility'
        elif 'services' in path_parts:
            return 'Service'
        elif 'types' in path_parts:
            return 'Type Definition'
        elif 'features' in path_parts:
            return 'Feature'
        elif 'supabase/functions' in file_path:
            return 'Edge Function'
        else:
            return 'Other'
    
    def find_typescript_files(self, root_dir: str) -> List[str]:
        """Encontra todos os arquivos TypeScript/React"""
        ts_files = []
        extensions = ['.ts', '.tsx']
        
        for root, dirs, files in os.walk(root_dir):
            # Pular node_modules e dist
            dirs[:] = [d for d in dirs if d not in ['node_modules', 'dist', 'build', '.git']]
            
            for file in files:
                if any(file.endswith(ext) for ext in extensions):
                    file_path = os.path.join(root, file)
                    ts_files.append(file_path)
        
        return ts_files
    
    def analyze_project(self, root_dir: str) -> List[FileComplexity]:
        """Analisa todo o projeto"""
        print("🔍 Encontrando arquivos TypeScript/React...")
        ts_files = self.find_typescript_files(root_dir)
        print(f"📁 Encontrados {len(ts_files)} arquivos")
        
        print("🔬 Analisando complexidade ciclomática...")
        results = []
        
        for i, file_path in enumerate(ts_files):
            if i % 10 == 0:
                print(f"   Processando arquivo {i+1}/{len(ts_files)}")
            
            result = self.analyze_file(file_path)
            if result:
                results.append(result)
        
        self.results = results
        return results
    
    def get_top_complex_files(self, limit: int = 20) -> List[FileComplexity]:
        """Retorna os arquivos mais complexos"""
        return sorted(self.results, key=lambda x: x.total_complexity, reverse=True)[:limit]
    
    def get_high_complexity_functions(self, min_complexity: int = 10) -> List[FunctionComplexity]:
        """Retorna funções com alta complexidade"""
        high_complexity = []
        for result in self.results:
            for func in result.functions:
                if func.complexity >= min_complexity:
                    high_complexity.append(func)
        return sorted(high_complexity, key=lambda x: x.complexity, reverse=True)
    
    def generate_report(self, output_file: str = 'docs/analise_complexidade.md'):
        """Gera relatório em Markdown"""
        if not self.results:
            print("❌ Nenhum resultado para gerar relatório")
            return
        
        # Ordenar resultados
        self.results.sort(key=lambda x: x.total_complexity, reverse=True)
        
        # Categorizar por complexidade
        very_high = [f for f in self.results if f.total_complexity > 30]
        high = [f for f in self.results if 15 < f.total_complexity <= 30]
        medium = [f for f in self.results if 10 < f.total_complexity <= 15]
        low = [f for f in self.results if f.total_complexity <= 10]
        
        # Estatísticas gerais
        total_files = len(self.results)
        avg_complexity = sum(f.total_complexity for f in self.results) / total_files
        total_lines = sum(f.file_size for f in self.results)
        
        # Gerar markdown
        markdown = f"""# Análise de Complexidade Ciclomática - Doc Forge Buddy

**Data da Análise:** {self._get_current_date()}  
**Total de Arquivos Analisados:** {total_files}  
**Complexidade Média:** {avg_complexity:.2f}  
**Total de Linhas de Código:** {total_lines:,}  

## 📊 Resumo da Complexidade

| Categoria | Quantidade | Percentual |
|-----------|------------|------------|
| 🔴 Muito Alta (>30) | {len(very_high)} | {len(very_high)/total_files*100:.1f}% |
| 🟠 Alta (15-30) | {len(high)} | {len(high)/total_files*100:.1f}% |
| 🟡 Média (10-15) | {len(medium)} | {len(medium)/total_files*100:.1f}% |
| 🟢 Baixa (≤10) | {len(low)} | {len(low)/total_files*100:.1f}% |

## 🏆 Top 20 Arquivos Mais Complexos

| Rank | Arquivo | Complexidade | Categoria | Tamanho (chars) |
|------|---------|--------------|-----------|-----------------|
"""
        
        for i, file in enumerate(self.get_top_complex_files(20), 1):
            relative_path = file.file_path.replace('/workspace/doc-forge-buddy-Cain/', '')
            complexity_emoji = "🔴" if file.total_complexity > 30 else "🟠" if file.total_complexity > 15 else "🟡"
            markdown += f"| {i} | `{relative_path}` | {complexity_emoji} **{file.total_complexity}** | {file.category} | {file.file_size:,} |\n"
        
        # Funções mais complexas
        high_complexity_functions = self.get_high_complexity_functions(10)
        
        if high_complexity_functions:
            markdown += f"""

## 🚨 Funções com Alta Complexidade (≥10)

| Função | Arquivo | Complexidade | Linhas |
|--------|---------|--------------|--------|
"""
            
            for func in high_complexity_functions[:15]:
                relative_path = func.file_path.replace('/workspace/doc-forge-buddy-Cain/', '')
                markdown += f"| `{func.name}` | `{relative_path}` | 🔴 **{func.complexity}** | {func.line_start}-{func.line_end} |\n"
        
        # Padrões problemáticos
        markdown += self._generate_patterns_analysis()
        
        # Recomendações
        markdown += self._generate_recommendations(very_high, high, medium)
        
        # Esforço de refatoração
        markdown += self._generate_refactoring_effort(very_high, high, medium)
        
        # Salvar arquivo
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(markdown)
        
        print(f"📄 Relatório gerado: {output_file}")
        return output_file
    
    def _generate_patterns_analysis(self) -> str:
        """Analisa padrões de código problemáticos"""
        pattern_stats = {}
        
        for result in self.results:
            for func in result.functions:
                for pattern, count in func.complexity_breakdown.items():
                    if count > 0:
                        if pattern not in pattern_stats:
                            pattern_stats[pattern] = 0
                        pattern_stats[pattern] += count
        
        # Ordenar por frequência
        sorted_patterns = sorted(pattern_stats.items(), key=lambda x: x[1], reverse=True)[:10]
        
        markdown = """

## 🔍 Padrões de Código Problemáticos

Os seguintes padrões contribuem mais para a complexidade:

| Padrão | Ocorrências | Impacto |
|--------|-------------|---------|
"""
        
        pattern_descriptions = {
            'if_statements': 'Condicionais if',
            'ternary': 'Operador ternário',
            'logical_and': 'Operador &&',
            'conditional_rendering': 'Renderização condicional',
            'array_method_callback': 'Callbacks em arrays',
            'for_loop': 'Loops for',
            'switch': 'Switch/case',
            'try_catch': 'Try/catch blocks',
            'event_handlers': 'Event handlers',
            'map_with_logic': 'Map com lógica',
        }
        
        for pattern, count in sorted_patterns:
            desc = pattern_descriptions.get(pattern, pattern)
            impact = "Alto" if count > 100 else "Médio" if count > 50 else "Baixo"
            markdown += f"| {desc} | {count} | {impact} |\n"
        
        return markdown
    
    def _generate_recommendations(self, very_high: List, high: List, medium: List) -> str:
        """Gera recomendações de refatoração"""
        markdown = """

## 💡 Recomendações de Refatoração

### 🔴 Prioridade Alta (Complexidade > 15)
"""
        
        if very_high:
            markdown += "**Arquivos que exigem refatoração urgente:**\n\n"
            for file in very_high[:5]:
                relative_path = file.file_path.replace('/workspace/doc-forge-buddy-Cain/', '')
                markdown += f"- **`{relative_path}`** (Complexidade: {file.total_complexity})\n"
                markdown += f"  - Quebre em funções menores\n"
                markdown += f"  - Extraia lógica de negócio para hooks customizados\n"
                markdown += f"  - Use early returns para reduzir aninhamento\n\n"
        
        if high:
            markdown += "### 🟠 Prioridade Média (Complexidade 15-30)\n\n"
            markdown += "**Considere refatorar estes arquivos:**\n\n"
            for file in high[:5]:
                relative_path = file.file_path.replace('/workspace/doc-forge-buddy-Cain/', '')
                markdown += f"- `{relative_path}` (Complexidade: {file.total_complexity})\n"
        
        markdown += """

### 🛠️ Estratégias de Refatoração

1. **Extract Method**: Separe lógica complexa em funções menores
2. **Early Returns**: Retorne antecipadamente para reduzir aninhamento
3. **Strategy Pattern**: Use diferentes estratégias para casos complexos
4. **Custom Hooks**: Mova lógica de estado para hooks reutilizáveis
5. **Composition over Inheritance**: Prefira composição a herança complexa
6. **Guard Clauses**: Use cláusulas de guarda para validar pré-condições

### 📏 Metas de Complexidade

- **Funções**: Manter ≤ 10 pontos de complexidade
- **Componentes**: Manter ≤ 20 pontos de complexidade total
- **Páginas**: Manter ≤ 50 pontos de complexidade total
"""
        
        return markdown
    
    def _generate_refactoring_effort(self, very_high: List, high: List, medium: List) -> str:
        """Gera estimativa de esforço de refatoração"""
        
        # Calcular esforço baseado no tamanho e complexidade
        def calculate_effort(files, base_hours):
            total_effort = 0
            for file in files:
                # Baseado na complexidade e tamanho
                size_factor = min(file.file_size / 5000, 3)  # Máximo 3x
                complexity_factor = file.total_complexity / 10
                effort = base_hours * size_factor * complexity_factor
                total_effort += effort
            
            return total_effort
        
        very_high_effort = calculate_effort(very_high, 8)  # 8 horas base para alta complexidade
        high_effort = calculate_effort(high, 4)  # 4 horas base para complexidade média
        medium_effort = calculate_effort(medium, 2)  # 2 horas base para complexidade baixa
        total_effort = very_high_effort + high_effort + medium_effort
        
        markdown = f"""

## ⏱️ Estimativa de Esforço para Refatoração

| Categoria | Arquivos | Esforço Estimado |
|-----------|----------|------------------|
| 🔴 Muito Alta (>30) | {len(very_high)} | {very_high_effort:.1f} horas |
| 🟠 Alta (15-30) | {len(high)} | {high_effort:.1f} horas |
| 🟡 Média (10-15) | {len(medium)} | {medium_effort:.1f} horas |
| **TOTAL** | {len(very_high) + len(high) + len(medium)} | **{total_effort:.1f} horas** |

### 📅 Cronograma Sugerido

- **Sprint 1**: Arquivos de prioridade alta (8 arquivos max) - 2-3 semanas
- **Sprint 2**: Arquivos de prioridade média (10-15 arquivos) - 3-4 semanas
- **Sprint 3**: Revisão e otimizações finais - 1-2 semanas

**Total estimado: 6-9 semanas de refatoração**

### 💰 Custo Estimado (baseado em 80€/hora)

**€{(total_effort * 80):,.2f}** - Custo total de refatoração
"""
        
        return markdown
    
    def _get_current_date(self):
        """Retorna data atual formatada"""
        from datetime import datetime
        return datetime.now().strftime("%d/%m/%Y %H:%M")

def main():
    parser = argparse.ArgumentParser(description='Analisador de Complexidade Ciclomática')
    parser.add_argument('--project-dir', default='/workspace/doc-forge-buddy-Cain', 
                       help='Diretório do projeto')
    parser.add_argument('--output', default='docs/analise_complexidade.md',
                       help='Arquivo de saída do relatório')
    
    args = parser.parse_args()
    
    analyzer = CyclomaticComplexityAnalyzer()
    results = analyzer.analyze_project(args.project_dir)
    
    if results:
        report_file = analyzer.generate_report(args.output)
        print(f"✅ Análise completa! Relatório salvo em: {report_file}")
    else:
        print("❌ Falha na análise")

if __name__ == "__main__":
    main()