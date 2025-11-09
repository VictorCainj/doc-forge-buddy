# Ferramentas de Suporte

Este diretório agrupa scripts auxiliares que não fazem parte do fluxo principal da aplicação.

- `python/`: análises e rotinas de manutenção escritas em Python (complexidade, imports, validações, testes pontuais).
- `javascript/`: utilitários em Node/TS para auditoria de dependências e monitoração de performance.
- `shell/`: scripts shell pontuais, como demonstrações de memoização.

Todos os scripts continuam podendo ser executados diretamente, basta ajustar o caminho relativo, por exemplo:

```bash
python tools/python/analise_complexidade_ciclomatica.py
node tools/javascript/analyze-deps.js
bash tools/shell/demo-memoization.sh
```

Mantenha novas automações neste diretório para preservar a organização do repositório.
