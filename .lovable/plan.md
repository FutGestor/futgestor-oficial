

# Atualizar MP_ACCESS_TOKEN para Producao

## O que sera feito

Solicitar a atualizacao do secret `MP_ACCESS_TOKEN` com a chave de producao do Mercado Pago (Access Token que comeca com `APP_USR-...`).

## Onde encontrar a chave

1. Acesse [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
2. Va em **Suas integracoes** e selecione sua aplicacao
3. Em **Credenciais de producao**, copie o **Access Token**

## Resultado

- O checkout passara a funcionar em modo producao (cobranças reais)
- Nenhuma alteracao de codigo e necessaria — apenas o secret precisa ser atualizado

