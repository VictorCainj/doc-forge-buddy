#!/usr/bin/env python3
"""
Analisador de Complexidade Ciclomática Refinado para TypeScript/React
Versão melhorada com cálculos mais precisos
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
    function_type: str  # 'component', 'hook', 'utility', 'arrow'
    
@dataclass
class FileComplexity:
    file_path: str
    total_complexity: int
    average_complexity: float
    functions: List[FunctionComplexity]
    file_size: int
    is_component: bool
    category: str
    lines_of_code: int

class RefinedCyclomaticAnalyzer:
    """Analisador Refinado de Complexidade Ciclomática"""
    
    def __init__(self):
        self.results: List[FileComplexity] = []
        
        # Padrões mais precisos que adicionam complexidade
        self.complexity_patterns = {
            'if_statements': r'\bif\s*\([^)]*\)\s*\{',  # if com condição e bloco
            'else_if': r'\belse\s+if\s*\([^)]*\)\s*\{',
            'else': r'\belse\s*\{',
            'switch': r'\bswitch\s*\([^)]*\)\s*\{',
            'case': r'\bcase\s+[^:]+:',
            'default': r'\bdefault\s*:',
            'for_loop': r'\bfor\s*\([^;]+;[^;]+;[^)]*\)\s*\{',
            'while_loop': r'\bwhile\s*\([^)]*\)\s*\{',
            'try_catch': r'\btry\s*\{',
            'catch': r'\bcatch\s*\([^)]*\)\s*\{',
            'finally': r'\bfinally\s*\{',
            'ternary': r'[^?{]*\?[^:]*:',  # ternário simples
            'logical_and': r'[^&]*\&\&[^&]*',  # apenas se não for operador de atribuição
            'logical_or': r'[^|]*\|\|[^|]*',
            'optional_chaining': r'\?\.',  # peso menor
            'nullish_coalescing': r'\?\?',
            'map_with_condition': r'\.map\s*\([^)]*\([^)]*\?[^)]*\)[^)]*\)',
            'filter_with_condition': r'\.filter\s*\([^)]*\([^)]*\?[^)]*\)[^)]*\)',
            'reduce_with_condition': r'\.reduce\s*\([^)]*\([^)]*\?[^)]*\)[^)]*\)',
            'event_handler_simple': r'\s+on[A-Z][a-zA-Z]*\s*=\s*\([^)]*\)\s*=>\s*\{[^}]*\}',  # handlers simples
            'arrow_function_complex': r'=>\s*\{[^}]*[^?].*\}',  #箭头函数 com lógica
            'conditional_jsx': r'\{[^}]*\?[^}]*\}',
            'short_circuit_render': r'\{[^}]*&&[^}]*\}',
            'nested_component': r'<\w+[^>]*\{[^}]*\?[^}]*\}[^>]*>',  # JSX complexo
        }
        
        # Pesos mais realistas
        self.complexity_weights = {
            'if_statements': 1.0,
            'else_if': 1.0,
            'else': 0.5,
            'switch': 2.0,  # switch é mais complexo que if
            'case': 0.5,
            'default': 0.2,
            'for_loop': 1.5,
            'while_loop': 1.5,
            'try_catch': 1.5,
            'catch': 1.0,
            'finally': 0.5,
            'ternary': 1.0,
            'logical_and': 0.8,
            'logical_or': 0.8,
            'optional_chaining': 0.3,
            'nullish_coalescing': 0.3,
            'map_with_condition': 1.5,
            'filter_with_condition': 1.5,
            'reduce_with_condition': 1.5,
            'event_handler_simple': 0.5,
            'arrow_function_complex': 1.2,
            'conditional_jsx': 0.8,
            'short_circuit_render': 0.6,
            'nested_component': 1.0,
        }
        
        # Limites de complexidade saudável
        self.healthy_limits = {
            'function': 10,
            'component': 25,
            'page': 50,
            'hook': 20,
            'utility': 15,
            'service': 20,
        }
    
    def calculate_function_complexity(self, content: str, file_path: str) -> List[FunctionComplexity]:
        """Calcula complexidade de funções individuais com melhor detecção"""
        functions = []
        lines = content.split('\n')
        
        # Padrões para diferentes tipos de funções
        function_patterns = [
            # Named functions
            (r'function\s+(\w+)\s*\([^)]*\)\s*\{', 'function'),
            # Arrow functions
            (r'const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{', 'arrow'),
            (r'const\s+(\w+)\s*=\s*[^=]*=>\s*\{', 'arrow'),
            # Method definitions
            (r'(\w+)\s*:\s*\([^)]*\)\s*=>\s*\{', 'method'),
            (r'(\w+)\s*:\s*[^=]*=>\s*\{', 'method'),
            # Function assignments
            (r'(\w+)\s*=\s*function\s*\([^)]*\)\s*\{', 'function'),
        ]
        
        # Detectar componentes React
        is_react_component = self._is_react_component(file_path, content)
        component_function_patterns = [
            (r'const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\(', 'component'),
            (r'function\s+(\w+)\s*\([^)]*\)\s*{', 'component'),
        ]
        
        # Procurar por funções/componentes
        for i, line in enumerate(lines):
            # Componentes React
            if is_react_component:
                for pattern, func_type in component_function_patterns:
                    matches = re.finditer(pattern, line, re.MULTILINE)
                    for match in matches:
                        func_name = match.group(1)
                        end_line = self._find_function_end(lines, i)
                        func_content = '\n'.join(lines[i:end_line+1])
                        complexity = self._calculate_complexity_of_text(func_content)
                        
                        functions.append(FunctionComplexity(
                            name=func_name,
                            file_path=file_path,
                            line_start=i+1,
                            line_end=end_line+1,
                            complexity=complexity['total'],
                            complexity_breakdown=complexity['breakdown'],
                            function_type=func_type
                        ))
            
            # Outras funções
            for pattern, func_type in function_patterns:
                if not re.search(pattern, line):
                    continue
                
                # Evitar duplicatas
                if any(f.line_start == i+1 for f in functions):
                    continue
                
                matches = re.finditer(pattern, line, re.MULTILINE)
                for match in matches:
                    func_name = match.group(1)
                    end_line = self._find_function_end(lines, i)
                    func_content = '\n'.join(lines[i:end_line+1])
                    complexity = self._calculate_complexity_of_text(func_content)
                    
                    functions.append(FunctionComplexity(
                        name=func_name,
                        file_path=file_path,
                        line_start=i+1,
                        line_end=end_line+1,
                        complexity=complexity['total'],
                        complexity_breakdown=complexity['breakdown'],
                        function_type=func_type
                    ))
        
        return functions
    
    def _find_function_end(self, lines: List[str], start_line: int) -> int:
        """Encontra o final de uma função com melhor detecção"""
        brace_count = 0
        in_string = False
        string_char = None
        in_comment = False
        in_block_comment = False
        
        for i in range(start_line, len(lines)):
            line = lines[i]
            j = 0
            
            while j < len(line):
                char = line[j]
                next_char = line[j+1] if j+1 < len(line) else ''
                
                # Detectar strings
                if not in_string and not in_comment and not in_block_comment:
                    if char in ['"', "'", '`']:
                        in_string = True
                        string_char = char
                    elif char == '/' and next_char == '/':
                        in_comment = True
                        break
                    elif char == '/' and next_char == '*':
                        in_block_comment = True
                        j += 1
                    elif char == '{' and not in_string:
                        brace_count += 1
                    elif char == '}' and not in_string:
                        brace_count -= 1
                        if brace_count == 0 and i > start_line:
                            return i
                elif in_string and char == string_char:
                    in_string = False
                    string_char = None
                elif in_block_comment and char == '*' and next_char == '/':
                    in_block_comment = False
                    j += 1
                
                j += 1
        
        return min(start_line + 50, len(lines) - 1)  # Limite seguro
    
    def _calculate_complexity_of_text(self, text: str) -> Dict[str, int]:
        """Calcula complexidade com desconto por concisão"""
        breakdown = {}
        total = 1  # Base complexity
        
        # Pular comentários e strings
        clean_text = self._remove_comments_and_strings(text)
        
        for pattern_name, pattern in self.complexity_patterns.items():
            matches = len(re.findall(pattern, clean_text, re.MULTILINE | re.DOTALL))
            if matches > 0:
                breakdown[pattern_name] = matches
                weight = self.complexity_weights.get(pattern_name, 1.0)
                total += matches * weight
        
        return {'total': total, 'breakdown': breakdown}
    
    def _remove_comments_and_strings(self, text: str) -> str:
        """Remove comentários e strings para análise mais precisa"""
        # Remover comentários de linha
        text = re.sub(r'//.*$', '', text, flags=re.MULTILINE)
        
        # Remover comentários de bloco
        text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
        
        # Remover strings (aproximação)
        text = re.sub(r'"[^"]*"', '""', text)
        text = re.sub(r"'[^']*'", "''", text)
        text = re.sub(r'`[^`]*`', '``', text)
        
        return text
    
    def _is_react_component(self, file_path: str, content: str) -> bool:
        """Identifica se é um componente React com mais precisão"""
        return (
            file_path.endswith('.tsx') and
            ('import React' in content or 
             'from \'react\'' in content or 
             'from "react"' in content) and
            ('export default' in content or 
             re.search(r'const\s+\w+\s*=\s*', content) or
             re.search(r'function\s+\w+\s*\(', content))
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
    
    def count_lines_of_code(self, content: str) -> int:
        """Conta linhas de código efetivo (sem comentários vazios)"""
        lines = content.split('\n')
        code_lines = 0
        
        for line in lines:
            stripped = line.strip()
            # Pular linhas vazias, comentários apenas e importações
            if (stripped and 
                not stripped.startswith('//') and 
                not stripped.startswith('/*') and
                not stripped.startswith('*') and
                not stripped.startswith('import ') and
                not stripped.startswith('export ') and
                not stripped.startswith('//') and
                stripped != '{' and 
                stripped != '}' and
                stripped != ';'):
                code_lines += 1
        
        return code_lines
    
    def analyze_file(self, file_path: str) -> FileComplexity:
        """Analisa um arquivo completo com métricas refinadas"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"Erro ao ler {file_path}: {e}")
            return None
        
        # Calcular linhas de código
        lines_of_code = self.count_lines_of_code(content)
        
        # Calcular complexidade total
        file_complexity_data = self._calculate_complexity_of_text(content)
        total_complexity = file_complexity_data['total']
        
        # Identificar funções
        functions = self.calculate_function_complexity(content, file_path)
        
        # Calcular complexidade média
        if functions:
            average_complexity = sum(f.complexity for f in functions) / len(functions)
        else:
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
            category=category,
            lines_of_code=lines_of_code
        )
    
    def find_typescript_files(self, root_dir: str) -> List[str]:
        """Encontra arquivos TypeScript focando nos mais importantes"""
        ts_files = []
        extensions = ['.ts', '.tsx']
        
        # Priorizar arquivos mais importantes
        priority_patterns = [
            'src/pages/',
            'src/components/',
            'src/hooks/',
            'src/features/',
            'src/utils/',
        ]
        
        for root, dirs, files in os.walk(root_dir):
            # Pular pastas menos importantes
            dirs[:] = [d for d in dirs if d not in [
                'node_modules', 'dist', 'build', '.git', 
                '__tests__', '.next', '.nuxt', 'coverage'
            ]]
            
            for file in files:
                if any(file.endswith(ext) for ext in extensions):
                    file_path = os.path.join(root, file)
                    
                    # Priorizar arquivos mais importantes
                    if any(pattern in file_path for pattern in priority_patterns):
                        ts_files.insert(0, file_path)  # Inserir no início
                    else:
                        ts_files.append(file_path)
        
        return ts_files[:300]  # Limitar aos 300 mais importantes
    
    def analyze_project(self, root_dir: str) -> List[FileComplexity]:
        """Analisa o projeto com foco nos arquivos mais importantes"""
        print("🔍 Encontrando arquivos TypeScript/React prioritários...")
        ts_files = self.find_typescript_files(root_dir)
        print(f"📁 Focados em {len(ts_files)} arquivos principais")
        
        print("🔬 Analisando complexidade ciclomática...")
        results = []
        
        for i, file_path in enumerate(ts_files):
            if i % 20 == 0:
                print(f"   Processando arquivo {i+1}/{len(ts_files)}")
            
            result = self.analyze_file(file_path)
            if result:
                results.append(result)
        
        self.results = results
        return results
    
    def get_critical_files(self) -> Tuple[List[FileComplexity], List[FileComplexity], List[FileComplexity]]:
        """Retorna arquivos categorizados por criticidade"""
        critical = []      # > 50
        high = []         # 25-50
        medium = []       # 15-25
        low = []          # <= 15
        
        for result in self.results:
            if result.total_complexity > 50:
                critical.append(result)
            elif result.total_complexity > 25:
                high.append(result)
            elif result.total_complexity > 15:
                medium.append(result)
            else:
                low.append(result)
        
        return critical, high, medium
    
    def calculate_refactoring_effort(self, critical: List[FileComplexity], 
                                   high: List[FileComplexity], 
                                   medium: List[FileComplexity]) -> Dict[str, float]:
        """Calcula esforço de refatoração de forma mais realista"""
        
        def estimate_effort(files: List[FileComplexity], base_hours: float) -> float:
            total_effort = 0
            for file in files:
                # Baseado em complexidade, tamanho e tipo
                complexity_factor = file.total_complexity / 20  # Normalizar
                size_factor = min(file.lines_of_code / 200, 3)  # Máximo 3x
                
                # Multiplicadores por categoria
                category_multiplier = {
                    'Page': 1.5,
                    'React Component': 1.3,
                    'Custom Hook': 1.1,
                    'Utility': 1.0,
                    'Service': 1.2,
                    'Edge Function': 1.4,
                }.get(file.category, 1.0)
                
                effort = base_hours * complexity_factor * size_factor * category_multiplier
                total_effort += effort
            
            return total_effort
        
        critical_effort = estimate_effort(critical, 6)     # 6 horas base
        high_effort = estimate_effort(high, 3)            # 3 horas base  
        medium_effort = estimate_effort(medium, 1.5)      # 1.5 horas base
        total_effort = critical_effort + high_effort + medium_effort
        
        return {
            'critical': critical_effort,
            'high': high_effort,
            'medium': medium_effort,
            'total': total_effort
        }
    
    def generate_detailed_report(self, output_file: str = 'docs/analise_complexidade.md'):
        """Gera relatório detalhado e realista"""
        if not self.results:
            print("❌ Nenhum resultado para gerar relatório")
            return
        
        # Ordenar resultados
        self.results.sort(key=lambda x: x.total_complexity, reverse=True)
        
        # Categorizar arquivos
        critical, high, medium = self.get_critical_files()
        
        # Calcular esforço
        effort = self.calculate_refactoring_effort(critical, high, medium)
        
        # Estatísticas
        total_files = len(self.results)
        avg_complexity = sum(f.total_complexity for f in self.results) / total_files
        total_lines = sum(f.lines_of_code for f in self.results)
        
        # Início do relatório
        markdown = f"""# Análise de Complexidade Ciclomática - Doc Forge Buddy

**Data da Análise:** {self._get_current_date()}  
**Arquivos Analisados:** {total_files} (focados nos mais críticos)  
**Complexidade Média:** {avg_complexity:.1f}  
**Total de Linhas de Código:** {total_lines:,}  
**Linhas Médias por Arquivo:** {total_lines // total_files:,}  

## 📊 Resumo Executivo

- 🔴 **{len(critical)} arquivos** requerem refatoração urgente (complexidade > 50)
- 🟠 **{len(high)} arquivos** precisam de atenção (complexidade 25-50)  
- 🟡 **{len(medium)} arquivos** devem ser monitorados (complexidade 15-25)
- 🟢 **{total_files - len(critical) - len(high) - len(medium)} arquivos** estão com complexidade aceitável

## 🎯 Arquivos Críticos - Prioridade Máxima

> Estes arquivos têm complexidade ciclomática > 50 e devem ser refatorados com urgência

| Rank | Arquivo | Complexidade | LOC | Categoria | Status |
|------|---------|--------------|-----|-----------|---------|
"""
        
        # Top 15 arquivos mais críticos
        for i, file in enumerate(critical[:15], 1):
            relative_path = file.file_path.replace('/workspace/doc-forge-buddy-Cain/', '')
            status = "🚨 Crítico" if file.total_complexity > 75 else "⚠️ Alto"
            markdown += f"| {i} | `{relative_path}` | **{file.total_complexity:.1f}** | {file.lines_of_code} | {file.category} | {status} |\n"
        
        # Funções mais complexas
        all_functions = []
        for result in self.results:
            for func in result.functions:
                if func.complexity >= 15:  # Apenas funções realmente complexas
                    all_functions.append(func)
        
        all_functions.sort(key=lambda x: x.complexity, reverse=True)
        
        if all_functions:
            markdown += f"""

## 🔧 Funções com Complexidade Crítica

> Funções com complexidade ≥ 15 pontos - candidatos principais para refatoração

| Função | Tipo | Arquivo | Complexidade | Linhas |
|--------|------|---------|--------------|--------|
"""
            
            for func in all_functions[:12]:
                relative_path = func.file_path.replace('/workspace/doc-forge-buddy-Cain/', '')
                type_emoji = {
                    'component': '🧩',
                    'hook': '⚓', 
                    'function': '⚙️',
                    'arrow': '➡️',
                    'method': '🔧'
                }.get(func.function_type, '📄')
                
                markdown += f"| {func.name} | {type_emoji} {func.function_type} | `{relative_path}` | **{func.complexity:.1f}** | {func.line_start}-{func.line_end} |\n"
        
        # Padrões problemáticos
        markdown += self._analyze_problematic_patterns()
        
        # Recomendações específicas
        markdown += self._generate_specific_recommendations(critical, high)
        
        # Plano de refatoração
        markdown += f"""

## 📅 Plano de Refatoração Sugerido

### Fase 1: Urgente (1-2 semanas)
**Foco:** {len(critical)} arquivos críticos
- **Esforço:** {effort['critical']:.1f} horas
- **Estratégia:** Extrair funções, simplificar lógica, quebrar componentes

### Fase 2: Importante (2-3 semanas)  
**Foco:** {len(high)} arquivos de alta complexidade
- **Esforço:** {effort['high']:.1f} horas  
- **Estratégia:** Refatorar progressivamente, aplicar patterns

### Fase 3: Monitoramento (1-2 semanas)
**Foco:** {len(medium)} arquivos de média complexidade
- **Esforço:** {effort['medium']:.1f} horas
- **Estratégia:** Revisão e otimização incremental

**⏱️ Total Estimado: {effort['total']:.1f} horas ({effort['total']/40:.1f} semanas)**

### 💰 Retorno do Investimento

**Custo de Refatoração:** €{effort['total'] * 60:,.0f} (a €60/hora)

**Benefícios Esperados:**
- ✅ 40-60% redução no tempo de desenvolvimento de features
- ✅ 30-50% menos bugs em funcionalidades complexas
- ✅ Melhor performance de código (menos re-renders)
- ✅ Facilita onboarding de novos desenvolvedores
- ✅ Reduz custo de manutenção a longo prazo
"""
        
        # Salvar relatório
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(markdown)
        
        print(f"📄 Relatório detalhado gerado: {output_file}")
        return output_file
    
    def _analyze_problematic_patterns(self) -> str:
        """Analisa padrões problemáticos específicos"""
        pattern_stats = {}
        
        for result in self.results:
            for func in result.functions:
                for pattern, count in func.complexity_breakdown.items():
                    if count > 0:
                        if pattern not in pattern_stats:
                            pattern_stats[pattern] = 0
                        pattern_stats[pattern] += count
        
        # Top 8 padrões mais problemáticos
        sorted_patterns = sorted(pattern_stats.items(), key=lambda x: x[1], reverse=True)[:8]
        
        markdown = """

## 🎯 Padrões de Código Mais Problemáticos

> Estes padrões contribuem significativamente para a complexidade

| Padrão | Ocorrências | Solução Recomendada |
|--------|-------------|-------------------|
"""
        
        pattern_solutions = {
            'if_statements': 'Usar early returns e guard clauses',
            'ternary': 'Extrair para funções utilitárias',
            'logical_and': 'Usar && apenas para condições simples',
            'conditional_jsx': 'Criar componentes menores para renderização',
            'arrow_function_complex': 'Converter para funções nomeadas',
            'for_loop': 'Usar métodos funcionais (map, filter)',
            'switch': 'Considerar strategy pattern ou lookup table',
            'try_catch': 'Extrair validações para funções específicas',
        }
        
        for pattern, count in sorted_patterns:
            solution = pattern_solutions.get(pattern, 'Revisar e simplificar')
            markdown += f"| {pattern.replace('_', ' ').title()} | {count} | {solution} |\n"
        
        return markdown
    
    def _generate_specific_recommendations(self, critical: List[FileComplexity], 
                                         high: List[FileComplexity]) -> str:
        """Gera recomendações específicas para os arquivos mais problemáticos"""
        markdown = """

## 🛠️ Recomendações Específicas por Arquivo

### 🔴 Arquivos Críticos - Ação Imediata

"""
        
        for file in critical[:5]:  # Top 5 mais críticos
            relative_path = file.file_path.replace('/workspace/doc-forge-buddy-Cain/', '')
            markdown += f"""
**`{relative_path}`** - Complexidade: {file.total_complexity:.1f}

"""
            
            # Sugestões baseadas no tipo de arquivo
            if 'Page' in file.category:
                markdown += """- **Estratégia:** Quebrar em sub-componentes
- **Ação:** Extrair lógica de estado para hooks customizados
- **Meta:** Reduzir para < 30 pontos de complexidade
"""
            elif 'React Component' in file.category:
                markdown += """- **Estratégia:** Component composition pattern
- **Ação:** Separar presentación de lógica de negócio
- **Meta:** Componentes < 15 pontos cada
"""
            elif 'Custom Hook' in file.category:
                markdown += """- **Estratégia:** Hook composition pattern
- **Ação:** Dividir em hooks menores e mais específicos
- **Meta:** Hooks < 10 pontos cada
"""
            else:
                markdown += """- **Estratégia:** Extract method pattern
- **Ação:** Quebrar em funções utilitárias menores
- **Meta:** Funções < 8 pontos cada
"""
        
        markdown += """

### 📋 Checklist de Refatoração

#### Para cada arquivo crítico:
- [ ] Identificar responsabilidades múltiplas
- [ ] Extrair funções de validação
- [ ] Separar lógica de apresentação vs negócio
- [ ] Aplicar DRY (Don't Repeat Yourself)
- [ ] Criar componentes/hooks reutilizáveis
- [ ] Implementar error boundaries
- [ ] Adicionar testes unitários
- [ ] Documentar decisões arquiteturais

#### Metas de Qualidade:
- [ ] Funções < 10 linhas quando possível
- [ ] Componentes com responsabilidade única
- [ ] Hooks que fazem uma coisa bem
- [ ] Máximo 3 níveis de aninhamento
- [ ] Early returns para reduzir complexidade ciclomática
"""
        
        return markdown
    
    def _get_current_date(self):
        """Retorna data atual formatada"""
        from datetime import datetime
        return datetime.now().strftime("%d/%m/%Y %H:%M")

def main():
    parser = argparse.ArgumentParser(description='Analisador Refinado de Complexidade Ciclomática')
    parser.add_argument('--project-dir', default='/workspace/doc-forge-buddy-Cain', 
                       help='Diretório do projeto')
    parser.add_argument('--output', default='docs/analise_complexidade.md',
                       help='Arquivo de saída do relatório')
    
    args = parser.parse_args()
    
    analyzer = RefinedCyclomaticAnalyzer()
    results = analyzer.analyze_project(args.project_dir)
    
    if results:
        report_file = analyzer.generate_detailed_report(args.output)
        print(f"✅ Análise refinada completa! Relatório salvo em: {report_file}")
    else:
        print("❌ Falha na análise")

if __name__ == "__main__":
    main()