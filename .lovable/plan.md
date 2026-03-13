

## Plano: Certificado Digital A1 — Upload, leitura automática e alertas

### Resumo

Substituir os campos manuais de certificado digital por um fluxo completo de upload de arquivo `.pfx`/`.p12`, com leitura automática das informações do certificado via Edge Function, armazenamento seguro e alertas de vencimento no Dashboard e na aba Minha Empresa.

### 1. Migração de banco de dados

Adicionar colunas na tabela `company_profile`:

```sql
ALTER TABLE company_profile
  ADD COLUMN IF NOT EXISTS cert_file_path text,
  ADD COLUMN IF NOT EXISTS cert_cn text,
  ADD COLUMN IF NOT EXISTS cert_cnpj text,
  ADD COLUMN IF NOT EXISTS cert_issuer text,
  ADD COLUMN IF NOT EXISTS cert_valid_from date,
  ADD COLUMN IF NOT EXISTS cert_valid_to date;
```

A coluna `certificate_expiration` existente será mantida e sincronizada com `cert_valid_to` para compatibilidade. A coluna `certificate_number` deixa de ser usada (não será removida do banco para não quebrar nada, apenas removida da UI).

### 2. Edge Function: `parse-certificate`

Nova Edge Function que recebe o arquivo `.pfx`/`.p12` + senha, e retorna os dados extraídos do certificado.

**Fluxo:**
1. Recebe o arquivo (base64) e a senha via POST
2. Usa a biblioteca `node-forge` (disponível no Deno via npm) para ler o PKCS#12
3. Extrai: CN (nome empresa), CNPJ (do subject), issuer, validFrom, validTo
4. Faz upload do arquivo para o bucket `certificates` com path `{orgId}/company-cert.pfx`
5. Retorna os dados extraídos ao frontend

**Segurança:** A senha é usada apenas em memória na Edge Function para ler o certificado e nunca é armazenada. O arquivo é salvo no bucket `certificates` (privado, já existente). JWT obrigatório.

### 3. Frontend — Componente de Upload de Certificado

Novo componente `CertificadoDigitalUpload` usado dentro da aba Fiscal de MinhaEmpresa.

**Estados:**
- **Sem certificado:** Mostra dropzone para upload de `.pfx`/`.p12` + campo de senha + botão "Importar"
- **Com certificado:** Mostra card com informações extraídas (CNPJ, Emissor, Vencimento) + badge de dias restantes + botão "Substituir certificado"

**Fluxo do upload:**
1. Usuário seleciona arquivo `.pfx`/`.p12`
2. Campo de senha aparece
3. Ao clicar "Importar", envia para a Edge Function
4. Edge Function retorna dados → preenche automaticamente o formulário
5. Salva os dados no `company_profile` (`cert_cn`, `cert_cnpj`, `cert_issuer`, `cert_valid_from`, `cert_valid_to`, `cert_file_path`, `certificate_expiration`)

### 4. Alterações na UI — MinhaEmpresa (aba Fiscal)

- **Remover:** campo "Número do Certificado" (linhas 482-485)
- **Remover:** campo manual "Vencimento do Certificado Digital" (linhas 478-481)
- **Adicionar:** componente `CertificadoDigitalUpload` no lugar, com alerta inline de vencimento (30/15/7 dias)

### 5. Alertas de vencimento no Dashboard

Modificar `DashboardExecutiveWidgets.tsx` para incluir alerta do certificado da **empresa** (company_profile) além dos certificados de **clientes** que já existem.

- Consultar `company_profile.certificate_expiration` (ou `cert_valid_to`)
- Mostrar alerta se ≤30 dias para vencer, com níveis: 30 dias (amarelo), 15 dias (laranja), 7 dias (vermelho)
- Texto: "O certificado digital da empresa vence em X dias."

### 6. Alerta inline na aba Minha Empresa

Dentro da aba Fiscal, exibir banner de alerta quando o certificado estiver próximo do vencimento (30/15/7 dias), usando o mesmo cálculo `certDaysLeft` já existente.

### Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/parse-certificate/index.ts` | Criar — Edge Function para ler .pfx/.p12 |
| `src/components/configuracoes/CertificadoDigitalUpload.tsx` | Criar — componente de upload + exibição |
| `src/components/configuracoes/MinhaEmpresa.tsx` | Editar — substituir campos manuais pelo novo componente |
| `src/components/DashboardExecutiveWidgets.tsx` | Editar — adicionar alerta de certificado da empresa |
| Migração SQL | Criar — adicionar colunas cert_* na company_profile |

### Segurança

- Arquivo armazenado no bucket `certificates` (privado, RLS por org_id)
- Senha do certificado processada apenas na Edge Function, nunca armazenada
- Acesso restrito a admins (RLS existente na `company_profile` já garante isso)
- Edge Function valida JWT do usuário autenticado

