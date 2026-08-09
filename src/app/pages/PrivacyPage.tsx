const sections = [
  {
    title: '1. Dados que coletamos',
    content:
      'Coletamos informações fornecidas diretamente por você ao criar uma conta, realizar uma compra ou entrar em contato conosco, como nome, e-mail, endereço de entrega e dados de pagamento. Também coletamos automaticamente dados de navegação, como páginas visitadas e preferências de produtos.',
  },
  {
    title: '2. Como usamos seus dados',
    content:
      'Utilizamos os dados coletados para processar pedidos, emitir notas fiscais, entregar produtos físicos e digitais, enviar comunicações sobre seus pedidos e, quando autorizado, novidades e promoções da COMPIA Editora.',
  },
  {
    title: '3. Compartilhamento de dados',
    content:
      'Seus dados não são vendidos a terceiros. Podem ser compartilhados apenas com parceiros essenciais à operação da loja, como serviços de pagamento e transportadoras, estritamente para viabilizar a entrega do seu pedido.',
  },
  {
    title: '4. Cookies',
    content:
      'Utilizamos cookies para manter sua sessão ativa, lembrar itens no carrinho e entender como o site é utilizado, permitindo melhorias contínuas na experiência de compra.',
  },
  {
    title: '5. Seus direitos',
    content:
      'Nos termos da Lei Geral de Proteção de Dados (LGPD), você pode solicitar a qualquer momento a confirmação, correção, portabilidade ou exclusão dos seus dados pessoais, entrando em contato pelo e-mail privacidade@compia.com.br.',
  },
  {
    title: '6. Segurança',
    content:
      'Adotamos medidas técnicas e administrativas para proteger seus dados pessoais contra acessos não autorizados e situações de perda, alteração ou vazamento.',
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: '#070d1a', minHeight: '100vh', padding: '4rem 0' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ color: '#06b6d4', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
          Documento legal
        </div>
        <h1 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '0.75rem' }}>
          Política de Privacidade
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
