# Sistema de Plugins - Bob AI X

## Objetivo

Os plugins permitem adicionar novas capacidades ao Bob AI X sem modificar o núcleo do sistema.

Cada plugin deve ser independente.

---

## Estrutura

plugins/

└── nome-do-plugin/

├── manifest.json

├── plugin.js

└── README.md (opcional)

---

## Arquivos

### manifest.json

Contém as informações do plugin.

Campos obrigatórios:

- nome
- versao
- autor
- descricao
- categoria

Exemplo:

{
    "nome": "GitHub",
    "versao": "1.0.0",
    "autor": "Bob AI X",
    "descricao": "Consulta informações do GitHub.",
    "categoria": "Desenvolvimento"
}

---

### plugin.js

Responsável por executar o plugin.

Deve exportar:

module.exports = {
    executar
};

---

## Categorias

Sistema

Produtividade

Desenvolvimento

Internet

Pesquisa

Automação

IA

Banco de Dados

Segurança

Outros

---

## Objetivo futuro

No futuro o Bob carregará automaticamente todos os plugins existentes nesta pasta.
