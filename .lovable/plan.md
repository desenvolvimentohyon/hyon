

## Plano: Aplicar formato de cards na aba Minha Empresa

### Resumo
Substituir a TabsList (barra de abas) do componente MinhaEmpresa pelo mesmo componente `SubtabGrid` usado em "Configurações Gerais", convertendo as 7 abas em cards visuais com ícones e descrições.

### Editar: `src/components/configuracoes/MinhaEmpresa.tsx`

1. **Importar `SubtabGrid`** e seu tipo `SubtabItem`.

2. **Criar array de subtabs** com os 7 itens (Dados Gerais, Endereço, Fiscal, Bancário, Identidade Visual, Parâmetros, Renovação), cada um com ícone, cor e descrição — seguindo o mesmo padrão visual da screenshot.

3. **Adicionar estado local** `activeTab` com `useState("dados")`.

4. **Substituir a `TabsList`** pelo componente `<SubtabGrid>` e ocultar a TabsList original (`className="hidden"`), controlando a navegação pelo estado local.

### Resultado
A aba "Minha Empresa" terá o mesmo visual de cards em grid que a aba "Configurações Gerais", com ícones coloridos, descrições e indicador de aba ativa.

| Arquivo | Mudança |
|---------|---------|
| `src/components/configuracoes/MinhaEmpresa.tsx` | Substituir TabsList por SubtabGrid |

