import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const questions = [
  {
    q: "Como funciona o VSFood?",
    a: "O VSFood cria a loja do seu restaurante para você. Depois disso, você gerencia cardápio, pedidos, entrega e configurações direto pelo painel — sem depender de ninguém.",
  },
  {
    q: "Posso alterar meu cardápio?",
    a: "Sim. Você adiciona, edita e organiza categorias, produtos, preços, fotos e adicionais a qualquer momento pelo painel.",
  },
  {
    q: "Preciso instalar aplicativo?",
    a: "Não. Tanto sua loja quanto o seu painel funcionam direto no navegador, em qualquer dispositivo.",
  },
  {
    q: "Funciona no celular?",
    a: "Sim, a loja e o painel são totalmente responsivos — funcionam bem em celular, tablet e computador.",
  },
  {
    q: "Como recebo os pedidos?",
    a: "Os pedidos chegam em tempo real no seu painel, organizados por status (novo, em preparo, saiu para entrega, etc).",
  },
  {
    q: "Posso configurar entrega?",
    a: "Sim. Você define taxas de entrega por bairro e também pode habilitar retirada no local.",
  },
  {
    q: "Posso usar meu WhatsApp?",
    a: "Sim, o WhatsApp da sua loja fica configurado no painel para contato com os clientes.",
  },
  {
    q: "Como funciona o teste grátis?",
    a: "Sua loja começa com um período de teste grátis, com o plano já ativo, para você conhecer o sistema antes de decidir continuar.",
  },
  {
    q: "Posso trocar de plano?",
    a: "Sim. A troca de plano é feita pelo time VSFood — é só entrar em contato.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Perguntas frequentes</h2>
      </div>
      <Accordion type="single" collapsible className="mt-10">
        {questions.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
