import React from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { MovimentoBancario, FORMA_PAGAMENTO_LABELS, TituloFinanceiro } from "@/types/financeiro";

interface ReciboIndividualProps {
  movimento: MovimentoBancario;
  titulo?: TituloFinanceiro;
  clienteNome?: string;
  fornecedorNome?: string;
}

export function ReciboIndividual({ movimento, titulo, clienteNome, fornecedorNome }: ReciboIndividualProps) {
  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const dataFormatada = new Date(movimento.data).toLocaleDateString("pt-BR");
    const valorExtenso = Math.abs(movimento.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    
    // Determine pagador and recebedor based on title type
    const isReceita = titulo?.tipo === "receber";
    const pagador = isReceita ? (clienteNome || "Cliente") : "Hyon ERP";
    const recebedor = isReceita ? "Hyon ERP" : (fornecedorNome || "Fornecedor");
    const tipoDoc = isReceita ? "RECIBO DE RECEBIMENTO" : "COMPROVANTE DE PAGAMENTO";

    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo - ${movimento.id.slice(0, 8)}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; background: #fff; }
            .recibo { border: 1px solid #e5e7eb; padding: 40px; max-width: 800px; margin: 0 auto; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
            .title { font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.025em; }
            .number { color: #6b7280; font-size: 12px; margin-top: 4px; font-family: monospace; }
            .valor-box { background: #eff6ff; color: #1e40af; padding: 12px 24px; font-size: 24px; font-weight: 700; border-radius: 8px; border: 1px solid #dbeafe; }
            .body { line-height: 1.8; font-size: 15px; margin-bottom: 60px; color: #374151; }
            .body strong { color: #111827; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; }
            .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; }
            .signature-area { display: flex; flex-direction: column; align-items: center; }
            .signature-line { border-top: 1px solid #9ca3af; width: 240px; margin-bottom: 8px; }
            .signature-label { font-size: 12px; color: #6b7280; font-weight: 500; }
            @media print { 
              body { padding: 0; }
              .recibo { border: none; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="recibo">
            <div class="header">
              <div>
                <div class="title">${tipoDoc}</div>
                <div class="number">CONTROLE: ${movimento.id.split("-")[0].toUpperCase()}</div>
              </div>
              <div class="valor-box">${valorExtenso}</div>
            </div>
            
            <div class="body">
              Confirmamos que foi ${isReceita ? 'recebido de' : 'pago para'} <strong>${isReceita ? pagador : recebedor}</strong> 
              a quantia líquida de <strong>${valorExtenso}</strong>, 
              referente a <strong>${movimento.descricao || 'Liquidação de título financeiro'}</strong>.
              
              <div class="grid">
                <div>
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Data do Movimento</div>
                  <div style="font-weight: 500;">${dataFormatada}</div>
                </div>
                <div>
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Forma de Liquidação</div>
                  <div style="font-weight: 500;">${titulo?.formaPagamento ? FORMA_PAGAMENTO_LABELS[titulo.formaPagamento] : 'Não informada'}</div>
                </div>
              </div>
            </div>

            <div class="footer">
              <div style="font-size: 13px; color: #4b5563;">
                Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div class="signature-area">
                <div class="signature-line"></div>
                <div class="signature-label">Assinatura / Carimbo</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = () => { 
              setTimeout(() => {
                window.print(); 
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors"
      onClick={handlePrint}
      title="Emitir Recibo"
    >
      <FileText className="h-3.5 w-3.5" />
    </Button>
  );
}
