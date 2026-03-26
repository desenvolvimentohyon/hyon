

## Plano: Upload de Certificado Digital com leitura automática de vencimento

### O que muda
Na aba Contabilidade, a seção de **Anexos genéricos** será substituída por um upload dedicado de **Certificado Digital** (.pfx/.p12). Ao enviar o arquivo com a senha, o sistema extrai automaticamente a data de vencimento e preenche o campo `cert_expires_at`.

### Alterações

**1. Nova Edge Function `parse-client-certificate`**
- Recebe: `fileBase64`, `password`, `clientId`
- Usa `node-forge` para extrair validade do certificado (mesma lógica do `parse-certificate` existente)
- Armazena o arquivo no bucket `client-attachments` com path `{orgId}/{clientId}/certificado.pfx`
- Atualiza o campo `cert_expires_at` na tabela `clients`
- Retorna `cert_valid_from`, `cert_valid_to`, `cert_cn`

**2. `src/components/clientes/tabs/TabContabilidade.tsx`**
- Remover a seção de `TabAnexos` genérica
- Adicionar seção "Certificado Digital" com:
  - Input de arquivo (aceita apenas `.pfx, .p12`)
  - Input de senha do certificado
  - Botão "Enviar Certificado"
  - Loading state durante o processamento
- Ao receber resposta com sucesso, preencher automaticamente `cert_expires_at` via `onChange`
- Exibir dados do certificado atual (CN, validade) quando já houver um salvo

### Detalhes técnicos
- A edge function reutiliza a mesma lógica de parsing do `parse-certificate` existente (node-forge)
- Diferença: salva no contexto do cliente (não da empresa) e atualiza `clients.cert_expires_at`
- O campo de vencimento continua visível mas será preenchido automaticamente (ainda editável manualmente como fallback)
- Arquivo convertido para base64 no frontend antes do envio

