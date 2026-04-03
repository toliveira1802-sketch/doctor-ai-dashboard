export const pecas = [
  {
    codigo_peca: "WP-0948",
    tipo_peca: "Bomba D'água",
    carros_suportados: [
      "VW Gol 1.0/1.6 (2008-2023)",
      "VW Voyage 1.0/1.6 (2008-2023)",
      "VW Saveiro 1.6 (2010-2023)",
      "VW Fox 1.0/1.6 (2003-2021)",
    ],
    pecas_equivalentes: ["Indisa 948i", "URB UB0948", "Nakata NKBA03480", "Gates GWP4087"],
    quantidade_estoque: 3,
    preco_medio_mercado: 189.90,
  },
  {
    codigo_peca: "FO-PH5796",
    tipo_peca: "Filtro de Óleo",
    carros_suportados: [
      "Fiat Uno 1.0 Fire (2001-2023)",
      "Fiat Palio 1.0/1.4 (2001-2023)",
      "Fiat Strada 1.4 (2004-2023)",
      "Fiat Mobi 1.0 (2016-2023)",
      "Fiat Argo 1.0 (2017-2023)",
    ],
    pecas_equivalentes: ["MANN W712/21", "Wega WO161", "Tecfil PSL141", "Fram PH5796"],
    quantidade_estoque: 12,
    preco_medio_mercado: 28.50,
  },
  {
    codigo_peca: "PF-SYL1405",
    tipo_peca: "Pastilha de Freio Dianteira",
    carros_suportados: [
      "Chevrolet Onix 1.0/1.4 (2012-2023)",
      "Chevrolet Prisma 1.0/1.4 (2012-2019)",
      "Chevrolet Cobalt 1.4/1.8 (2011-2019)",
      "Chevrolet Spin 1.8 (2012-2023)",
    ],
    pecas_equivalentes: ["Bosch BP1087", "Cobreq N1405", "Fras-Le PD/1087", "TRW RCPT12480"],
    quantidade_estoque: 8,
    preco_medio_mercado: 89.90,
  },
  {
    codigo_peca: "CR-HY001",
    tipo_peca: "Correia Dentada",
    carros_suportados: [
      "Hyundai HB20 1.0 (2012-2023)",
      "Hyundai HB20S 1.0 (2013-2023)",
      "Kia Picanto 1.0 (2011-2020)",
    ],
    pecas_equivalentes: ["Gates 5578XS", "Continental CT1168", "Dayco 94976EL", "SKF VKMT06134"],
    quantidade_estoque: 2,
    preco_medio_mercado: 72.00,
  },
  {
    codigo_peca: "VE-VC927",
    tipo_peca: "Vela de Ignição (Iridium)",
    carros_suportados: [
      "Toyota Corolla 1.8/2.0 (2009-2023)",
      "Toyota Yaris 1.3/1.5 (2018-2023)",
      "Honda Civic 2.0 (2016-2023)",
      "Honda HR-V 1.8 (2015-2023)",
    ],
    pecas_equivalentes: ["NGK ILZKR7B-11S", "Denso IXEH22TT", "Bosch YR7NII33U", "Champion RER8ZWYCB4"],
    quantidade_estoque: 16,
    preco_medio_mercado: 54.90,
  },
];

export function buscarPeca(codigo) {
  return pecas.find((p) => p.codigo_peca.toLowerCase() === codigo.trim().toLowerCase());
}

export function buscarPecas(termo) {
  const t = termo.trim().toLowerCase();
  if (!t) return [];
  return pecas.filter(
    (p) =>
      p.codigo_peca.toLowerCase().includes(t) ||
      p.tipo_peca.toLowerCase().includes(t) ||
      p.carros_suportados.some((c) => c.toLowerCase().includes(t))
  );
}
