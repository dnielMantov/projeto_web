export {};

declare global {
  interface Window {
    MercadoPago: new (publicKey: string) => {
      createCardToken: (data: {
        cardNumber: string;
        cardholderName: string;
        cardExpirationMonth: string;
        cardExpirationYear: string;
        securityCode: string;
        identificationType: string;
        identificationNumber: string;
      }) => Promise<{ id: string }>;
      getPaymentMethods: (data: { bin: string }) => Promise<{ results: { id: string }[] }>;
    };
  }
}
