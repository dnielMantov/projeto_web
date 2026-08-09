const sections = [
  {
    title: '1. Aceitação dos termos',
    content:
      'Ao acessar e utilizar a loja virtual da COMPIA Editora, você concorda com os termos e condições descritos nesta página. Caso não concorde, recomendamos não utilizar a plataforma.',
  },
  {
    title: '2. Cadastro e conta',
    content:
      'Para finalizar compras, é necessário criar uma conta com informações verdadeiras e atualizadas. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.',
  },
  {
    title: '3. Produtos e preços',
    content:
      'Os livros físicos, e-books e kits são vendidos conforme descrição e preço exibidos no momento da compra. A COMPIA Editora reserva-se o direito de corrigir eventuais erros de preço ou descrição antes da confirmação do pedido.',
  },
  {
    title: '4. Formas de entrega',
    content:
      'Livros físicos são enviados para o endereço informado no checkout. E-books ficam disponíveis para download imediato na área do cliente após a confirmação do pagamento.',
  },
  {
    title: '5. Trocas, devoluções e cancelamento',
    content:
      'Produtos físicos com defeito podem ser trocados em até 7 dias corridos após o recebimento, conforme o Código de Defesa do Consumidor. E-books adquiridos e já baixados não são passíveis de reembolso, salvo defeito comprovado no arquivo.',
  },
  {
    title: '6. Propriedade intelectual',
    content:
      'Todo o conteúdo publicado pela COMPIA Editora é protegido por direitos autorais. A reprodução, distribuição ou compartilhamento não autorizado dos e-books é expressamente proibida.',
  },
  {
    title: '7. Alterações destes termos',
    content:
      'Estes termos podem ser atualizados periodicamente. A versão vigente estará sempre disponível nesta página, com a data da última atualização.',
  },
];

export default function TermsPage() {
  return (
    <div style={{ backgroundColor: '#070d1a', minHeight: '100vh', padding: '4rem 0' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ color: '#06b6d4', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
          Documento legal
        </div>
        <h1 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '0.75rem' }}>
          Termos de Uso
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '3rem' }}>
          Última atualização: 08 de agosto de 2026
        </p>

        <div className="flex flex-col" style={{ gap: '2rem' }}>
          {sections.map((s) => (
            <div key={s.title}>
              <h2 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.6rem' }}>
                {s.title}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.8 }}>{s.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
