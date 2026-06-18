export interface GiraHorario {
  dia: string;
  titulo?: string;
  horarioInicio: string;
  horarioFim?: string;
}

export interface Terreiro {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  dataFundacao: string;
  liderReligioso: string;
  fundador: string;
  nacaoFundador: string;
  uf: string;
  cidade: string;
  bairro: string;
  rua: string;
  numero: string;
  horarioAbertura: string;
  horarioFechamento: string;
  giras?: GiraHorario[];
  telefone: string;
  email: string;
  site?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  lat: number;
  lng: number;
  fotos: string[];
}

export interface Evento {
  id: string;
  terreiroId: string;
  titulo: string;
  categoria: string;
  data: string;
  horario: string;
  local: string;
  descricao: string;
  linkIngresso?: string;
}

export type CampanhaStatus = "ativa" | "encerrada" | "rascunho";
export type CampanhaMetaTipo = "monetaria" | "itens";

interface CampanhaBase {
  id: string;
  terreiroId: string;
  parceiroTerreiroId?: string;
  titulo: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  status: CampanhaStatus;
}

export interface CampanhaMonetaria extends CampanhaBase {
  metaTipo: "monetaria";
  metaArrecadacao: number;
  valorArrecadado: number;
}

export interface CampanhaItens extends CampanhaBase {
  metaTipo: "itens";
  itemDescricao: string;
  metaQuantidade: number;
  quantidadeArrecadada: number;
  unidade: string;
}

export type Campanha = CampanhaMonetaria | CampanhaItens;

/** Terreiro autenticado no protótipo (Cabana Senhora da Glória). */
export const LOGGED_TERREIRO_ID = "1";

export const MOCK_TERREIROS: Terreiro[] = [
  {
    id: "1",
    nome: "Cabana Senhora da Glória — Nzo Kuna Nkos'i",
    categoria: "Candomblé Angola",
    descricao:
      "Mais antigo terreiro afrorreligioso em funcionamento em Belo Horizonte (desde 1961). Iniciou como centro umbandista e, em 1964, assentou a tradição Candomblé Angola Moxicongo — a primeira casa dessa nação em Minas Gerais.",
    dataFundacao: "1961",
    liderReligioso: "Tateto Nepanji",
    fundador: "Nelson Mateus Nogueira (Tateto Nepanji)",
    nacaoFundador: "Angola Moxicongo",
    uf: "MG",
    cidade: "Belo Horizonte",
    bairro: "Sarandi",
    rua: "Rua Expedicionário Vicente Ribeiro",
    numero: "84",
    horarioAbertura: "09:00",
    horarioFechamento: "17:00",
    telefone: "",
    email: "cabanasenhoradagloria@gmail.com",
    site: "https://cabanasenhoradagloria.com.br",
    lat: -19.86892,
    lng: -44.01234,
    fotos: [
      "https://cabanasenhoradagloria.com.br/wp-content/uploads/2017/03/logomarca.jpg?w=800",
      "https://cabanasenhoradagloria.com.br/wp-content/uploads/2016/12/cropped-cropped-img-20161212-wa00015.jpg",
    ],
  },
  {
    id: "2",
    nome: "CAVOP — Casa de Caridade Vovô Pedro de Aruanda",
    categoria: "Umbanda",
    descricao:
      "Casa de Caridade fundada em 2000 por Pai Fernando de Xangô, no bairro Carajás. Referência religiosa e cultural na Região Metropolitana, com giras de atendimento, feijoada comunitária e ações de caridade.",
    dataFundacao: "2000",
    liderReligioso: "Pai Fernando de Xangô",
    fundador: "Pai Fernando de Xangô",
    nacaoFundador: "Matriz Africana",
    uf: "MG",
    cidade: "Contagem",
    bairro: "Carajás",
    rua: "Rua Moscovita",
    numero: "168",
    horarioAbertura: "16:00",
    horarioFechamento: "20:00",
    giras: [
      {
        dia: "Sábado",
        titulo: "Gira de atendimento espiritual",
        horarioInicio: "16:00",
        horarioFim: "20:00",
      },
    ],
    telefone: "",
    email: "",
    instagram: "@cavop",
    lat: -19.85892,
    lng: -44.03263,
    fotos: [
      "https://portal.contagem.mg.gov.br/fotos/d29ca105e14e2e27f9dd832037efe5ee.jpg",
    ],
  },
  {
    id: "3",
    nome: "Ylê Axé Orixá Xangô",
    categoria: "Umbanda",
    descricao:
      "Terreiro de Umbanda em Betim conduzido por Pai Célio e Mãe Cleide, com giras abertas à comunidade e trabalho de acolhimento espiritual no bairro Bandeirinhas.",
    dataFundacao: "1995",
    liderReligioso: "Pai Célio e Mãe Cleide",
    fundador: "Pai Célio e Mãe Cleide",
    nacaoFundador: "Matriz Africana",
    uf: "MG",
    cidade: "Betim",
    bairro: "Bandeirinhas",
    rua: "Rua Marckinair de Almeida Campos",
    numero: "105",
    horarioAbertura: "19:00",
    horarioFechamento: "22:00",
    giras: [
      {
        dia: "Quinta-feira",
        titulo: "Gira de Umbanda",
        horarioInicio: "19:00",
        horarioFim: "22:00",
      },
    ],
    telefone: "",
    email: "",
    lat: -19.957,
    lng: -44.238,
    fotos: [
      "https://www.cedefes.org.br/wp-content/uploads/2026/02/ataquereligioso.jpg",
    ],
  },
  {
    id: "4",
    nome: "Centro Espírita Ogum Beira Mar (Ilê Asé Igba Ogum)",
    categoria: "Umbanda",
    descricao:
      "Comunidade-terreiro fundada em 1986 por Mãe Cida Ti Ogum, reconhecida como patrimônio cultural imaterial de Contagem. Une tradições do candomblé Angola, umbanda e elementos ketu, com acolhimento espiritual, banquetes comunitários e formação em cultura afro-brasileira.",
    dataFundacao: "1986",
    liderReligioso: "Mãe Cida Ti Ogum",
    fundador: "Mãe Cida Ti Ogum",
    nacaoFundador: "Angola",
    uf: "MG",
    cidade: "Contagem",
    bairro: "Nova Contagem",
    rua: "Rua VL-11",
    numero: "219",
    horarioAbertura: "18:00",
    horarioFechamento: "21:00",
    telefone: "",
    email: "",
    lat: -19.82855,
    lng: -44.15158,
    fotos: [
      "https://portal.contagem.mg.gov.br/fotos/d4d4b807d73175c126afdc1807c0f999.jpg",
    ],
  },
  {
    id: "5",
    nome: "Associação Espírita Pai Benedito de Aruanda",
    categoria: "Umbanda",
    descricao:
      "Casa de Umbanda na Serra do Curral (Nova Lima), referência na resistência dos povos de terreiro à mineração e na preservação da memória afro-religiosa da região metropolitana.",
    dataFundacao: "2013",
    liderReligioso: "Dirigência espiritual Pai Benedito",
    fundador: "Comunidade Pai Benedito de Aruanda",
    nacaoFundador: "Aruanda",
    uf: "MG",
    cidade: "Nova Lima",
    bairro: "Vila São José",
    rua: "Rua Vila Lobos",
    numero: "552",
    horarioAbertura: "19:00",
    horarioFechamento: "22:00",
    telefone: "(31) 99941-7267",
    email: "",
    instagram: "@aepaibenedito",
    whatsapp: "(31) 99941-7267",
    lat: -19.985,
    lng: -43.846,
    fotos: [
      "https://pacs.org.br/wp-content/uploads/2020/09/WhatsApp-Image-2020-09-10-at-16.54.21-5-1200x768.jpeg",
    ],
  },
  {
    id: "6",
    nome: "Casa de Caridade Pai Jacob do Oriente (CCPJO)",
    categoria: "Umbanda",
    descricao:
      "Terreiro de Umbanda fundado em 1966 na Vila Senhor dos Passos (Lagoinha). Espaço sagrado de acolhimento, cultura afro-brasileira e resistência, com assistência social, festejos públicos como o Encontro com Iemanjá e a Noite da Libertação.",
    dataFundacao: "1966",
    liderReligioso: "Pai Ricardo de Moura",
    fundador: "Joaquim Camilo e Maria das Dores de Moura",
    nacaoFundador: "Matriz Africana",
    uf: "MG",
    cidade: "Belo Horizonte",
    bairro: "Vila Senhor dos Passos",
    rua: "Rua Fagundes Varela",
    numero: "99",
    horarioAbertura: "19:00",
    horarioFechamento: "22:00",
    giras: [
      {
        dia: "Segunda-feira",
        titulo: "Gira de Umbanda",
        horarioInicio: "19:00",
        horarioFim: "22:00",
      },
      {
        dia: "Quarta-feira",
        titulo: "Gira de Umbanda",
        horarioInicio: "19:00",
        horarioFim: "22:00",
      },
    ],
    telefone: "",
    email: "casapaijacobdooriente@gmail.com",
    site: "https://ccpjo.org.br",
    instagram: "@casapaijacobdooriente",
    facebook: "Casa Pai Jacob do Oriente",
    lat: -19.90635,
    lng: -43.94702,
    fotos: [
      "https://ccpjo.org.br/wp-content/uploads/2024/12/cropped-Logo_CCPJO_brasao_RGB-01.png",
      "https://ccpjo.org.br/wp-content/uploads/2025/09/Iemanja-2025-727-1.jpg",
      "https://ccpjo.org.br/wp-content/uploads/2024/12/livertacao-5.jpg",
    ],
  },
  {
    id: "7",
    nome: "Terreiro de Umbanda Ilê Axé Guian Anchieta",
    categoria: "Umbanda Omolokô",
    descricao:
      "Centro espírita e terreiro de Umbanda Omolokô na Santa Efigênia, com trabalho mediúnico e atendimento espiritual à comunidade.",
    dataFundacao: "1990",
    liderReligioso: "Dirigente espiritual",
    fundador: "Comunidade Ilê Axé Guian",
    nacaoFundador: "Omolokô",
    uf: "MG",
    cidade: "Belo Horizonte",
    bairro: "Santa Efigênia",
    rua: "Rua Niquelina",
    numero: "179",
    horarioAbertura: "19:00",
    horarioFechamento: "22:00",
    telefone: "(31) 99668-5738",
    email: "",
    whatsapp: "(31) 99668-5738",
    lat: -19.91838,
    lng: -43.91059,
    fotos: [],
  },
  {
    id: "8",
    nome: "Tenda Umbandista Caboclo Pena Branca",
    categoria: "Umbanda Omolokô",
    descricao:
      "Tenda de Umbanda Omolokô em funcionamento desde 1983, sob direção do Pai Ulisses de Ogunté. Espaço de fé, caridade e acolhimento dedicado à prática da Umbanda Omolokô.",
    dataFundacao: "1983",
    liderReligioso: "Pai Ulisses de Ogunté",
    fundador: "Pai Ulisses de Ogunté",
    nacaoFundador: "Omolokô",
    uf: "MG",
    cidade: "Belo Horizonte",
    bairro: "Aparecida",
    rua: "Rua Hespéria",
    numero: "105",
    horarioAbertura: "19:00",
    horarioFechamento: "23:00",
    giras: [
      {
        dia: "Sexta-feira",
        titulo: "Gira de Umbanda Omolokô",
        horarioInicio: "20:00",
        horarioFim: "23:00",
      },
    ],
    telefone: "",
    email: "",
    instagram: "@tendacpenabranca",
    lat: -19.88982,
    lng: -43.95121,
    fotos: [
      "https://www.terreirosdobrasil.com.br/wp-content/uploads/classified-listing/2025/12/1000557163.jpg",
    ],
  },
  {
    id: "9",
    nome: "Terreiro de Candomblé Ilê Wopo Olojukan",
    categoria: "Candomblé Ketu",
    descricao:
      "Primeiro terreiro de Candomblé de Belo Horizonte, fundado em 1964 por Carlos Olojukan (Carlos Ketu). Tradição Yorubá Ketu com patrono Oxóssi, tombado como patrimônio cultural do município em 1995.",
    dataFundacao: "1964",
    liderReligioso: "Babalorixá Sidney Ferreira da Silva",
    fundador: "Carlos Ribeiro da Silva (Carlos Olojukan)",
    nacaoFundador: "Ketu",
    uf: "MG",
    cidade: "Belo Horizonte",
    bairro: "Aarão Reis",
    rua: "Rua Doutor Benedito Xavier",
    numero: "2030",
    horarioAbertura: "09:00",
    horarioFechamento: "17:00",
    telefone: "",
    email: "",
    site: "http://projetoilewopoolojukan.blogspot.com",
    instagram: "@ilewopo",
    lat: -19.84888,
    lng: -43.9211,
    fotos: [
      "http://1.bp.blogspot.com/-iScdoHmJx5o/WJS0ICDSkuI/AAAAAAAAAAc/1NRvN9Nj6YQs9BXTgc6kMP4Rv32djeocgCK4B/s0/olojucam.jpg",
    ],
  },
  {
    id: "10",
    nome: "Núcleo Vida BH — Centro Espírita Pai Oxossi",
    categoria: "Umbanda",
    descricao:
      "Casa de Caridade Santo Expedito fundada em 1984 pelo médium Pai Oswaldo Pimentel. Centro espírita e casa de Umbanda com assistência espiritual, jogos de búzios, reiki e ações sociais como a Macarronada Solidária.",
    dataFundacao: "1984",
    liderReligioso: "Pai Oswaldo Lino Pimentel Filho",
    fundador: "Pai Oswaldo Pimentel",
    nacaoFundador: "Matriz Africana",
    uf: "MG",
    cidade: "Belo Horizonte",
    bairro: "São Geraldo",
    rua: "Avenida Silva Alvarenga",
    numero: "217",
    horarioAbertura: "18:00",
    horarioFechamento: "21:00",
    telefone: "(31) 3075-9196",
    email: "contato@nucleovidabh.com.br",
    site: "https://nucleovidabh.com.br",
    instagram: "@nucleovidabh",
    whatsapp: "(31) 99504-3984",
    lat: -19.89407,
    lng: -43.89761,
    fotos: [
      "https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1920,fit=crop/dWxw7XMrORu56R8n/foto-de-capa-m5K2oLZRw1FE6P5J.png",
      "https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=576,fit=crop,q=95/dWxw7XMrORu56R8n/logo-naocelo-vida-AE0MLaGNz7sRJQz0.png",
    ],
  },
  {
    id: "11",
    nome: "Magha — Centro Universalista",
    categoria: "Umbanda",
    descricao:
      "Centro universalista em Belo Horizonte com Templo Escola de Umbanda Pena Branca, terapias energéticas, formações e giras abertas ao público. Atua desde rodas de estudo espiritual até workshops e vivências.",
    dataFundacao: "2010",
    liderReligioso: "Dirigência Magha",
    fundador: "Comunidade Magha",
    nacaoFundador: "Omolokô",
    uf: "MG",
    cidade: "Belo Horizonte",
    bairro: "Fernão Dias",
    rua: "Rua Afrânio Castanheira Friche",
    numero: "95",
    horarioAbertura: "19:00",
    horarioFechamento: "22:00",
    giras: [
      {
        dia: "Quarta-feira",
        titulo: "Gira de atendimento ao público",
        horarioInicio: "20:00",
        horarioFim: "22:00",
      },
      {
        dia: "Quinta-feira",
        titulo: "Desenvolvimento mediúnico",
        horarioInicio: "20:00",
        horarioFim: "22:00",
      },
    ],
    telefone: "(31) 98238-6179",
    email: "",
    site: "https://maghabh.com",
    instagram: "@maghabh",
    whatsapp: "(31) 98238-6179",
    lat: -19.87826,
    lng: -43.91483,
    fotos: [
      "https://maghabh.com/wp-content/uploads/2024/02/maghasocial-03.png",
    ],
  },
  {
    id: "12",
    nome: "Templo de Umbanda Hermética — Filial Portal da Luz",
    categoria: "Umbanda Hermética",
    descricao:
      "Filial do Templo de Umbanda Hermética em Contagem. Atendimentos espirituais caritativos às terças e sextas, unindo ritualística umbandista e filosofia hermética.",
    dataFundacao: "2010",
    liderReligioso: "Dirigência espiritual do Templo",
    fundador: "Templo de Umbanda Hermética",
    nacaoFundador: "Matriz Africana",
    uf: "MG",
    cidade: "Contagem",
    bairro: "Parque Recreio",
    rua: "Rua Constantinopla",
    numero: "261",
    horarioAbertura: "19:30",
    horarioFechamento: "22:30",
    giras: [
      {
        dia: "Terça-feira",
        titulo: "Atendimento espiritual",
        horarioInicio: "19:30",
        horarioFim: "22:30",
      },
      {
        dia: "Sexta-feira",
        titulo: "Atendimento espiritual",
        horarioInicio: "19:30",
        horarioFim: "22:30",
      },
    ],
    telefone: "",
    email: "templodeumbandahermetica@gmail.com",
    site: "https://templodeumbandahermetica.org.br",
    instagram: "@templodeumbandahermetica",
    lat: -19.88207,
    lng: -44.01708,
    fotos: [
      "https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1024,h=876,fit=crop/znftCOQ697xMJtIJ/escaravelho_completo_simbolo_sem_nome-p96DbXfOAg5DmUK5.png",
    ],
  },
  {
    id: "13",
    nome: "Ilê Axé Omin Ty Oxalufan",
    categoria: "Tambor de Mina",
    descricao:
      "Terreiro fundado em 2011 por Mãe Kátia de Lissá, reconhecido como patrimônio cultural imaterial de Contagem. Práticas de tambor de mina, batismos em cachoeira e ações culturais na Vila Belém.",
    dataFundacao: "2011",
    liderReligioso: "Mãe Kátia de Lissá",
    fundador: "Mãe Kátia de Lissá",
    nacaoFundador: "Matriz Africana",
    uf: "MG",
    cidade: "Contagem",
    bairro: "Vila Belém",
    rua: "Rua Maria Augusta Belém",
    numero: "248",
    horarioAbertura: "18:00",
    horarioFechamento: "21:00",
    telefone: "",
    email: "",
    instagram: "@ileaxeomindoxalufan",
    lat: -19.845,
    lng: -44.038,
    fotos: [
      "https://portal.contagem.mg.gov.br/fotos/d4d4b807d73175c126afdc1807c0f999.jpg",
    ],
  },
  {
    id: "14",
    nome: "Comunidade Espírita Odé Farangi",
    categoria: "Candomblé Jeje",
    descricao:
      "Comunidade com raízes no candomblé Jeje Marrim, fundada há mais de cinquenta anos por Pai Milton de Oxóssi. Transferida de Belo Horizonte para Contagem em busca de maior conexão com a natureza.",
    dataFundacao: "1970",
    liderReligioso: "Pai Milton de Oxóssi",
    fundador: "Pai Milton de Oxóssi",
    nacaoFundador: "Jeje",
    uf: "MG",
    cidade: "Contagem",
    bairro: "Nazaré",
    rua: "Rua Arpoador",
    numero: "21",
    horarioAbertura: "09:00",
    horarioFechamento: "20:00",
    telefone: "(31) 3913-5182",
    email: "",
    lat: -19.86645,
    lng: -44.02811,
    fotos: [
      "https://portal.contagem.mg.gov.br/fotos/d4d4b807d73175c126afdc1807c0f999.jpg",
    ],
  },
  {
    id: "15",
    nome: "Ilê Axé Casa de Vó Ana e Pena Verde",
    categoria: "Umbanda",
    descricao:
      "Terreiro de Umbanda raiz no Novo Progresso (Contagem), com culto à espiritualidade em sua essência e atendimento mediúnico à comunidade.",
    dataFundacao: "2000",
    liderReligioso: "Dirigência espiritual",
    fundador: "Comunidade Ilê Axé Vó Ana",
    nacaoFundador: "Matriz Africana",
    uf: "MG",
    cidade: "Contagem",
    bairro: "Novo Progresso",
    rua: "Rua Hermes da Fonseca",
    numero: "269",
    horarioAbertura: "19:00",
    horarioFechamento: "22:00",
    telefone: "",
    email: "",
    instagram: "@ileaxevoana",
    lat: -19.90221,
    lng: -44.03014,
    fotos: [],
  },
  {
    id: "16",
    nome: "Comunidade Quilombola Manzo Ngunzo Kaiango",
    categoria: "Candomblé Angola",
    descricao:
      "Comunidade-terreiro quilombola certificada pela Palmares, fundada na década de 1970 por Mãe Efigênia. Patrimônio cultural de Minas Gerais, com tradição de candomblé angola na Zona Leste de Belo Horizonte.",
    dataFundacao: "1970",
    liderReligioso: "Mãe Efigênia (Mametu Muiandê)",
    fundador: "Mãe Efigênia",
    nacaoFundador: "Angola",
    uf: "MG",
    cidade: "Belo Horizonte",
    bairro: "Paraíso",
    rua: "Rua São Tiago",
    numero: "216",
    horarioAbertura: "09:00",
    horarioFechamento: "17:00",
    telefone: "",
    email: "kilombomanzo@gmail.com",
    site: "http://kilombomanzo.weebly.com",
    lat: -19.91838,
    lng: -43.91059,
    fotos: [
      "http://kilombomanzo.weebly.com/uploads/4/8/0/9/48096565/festamaeefigenia20151114-2_1.jpg",
      "http://kilombomanzo.weebly.com/uploads/4/8/0/9/48096565/festamaeefigenia20151114-61.jpg",
      "http://kilombomanzo.weebly.com/uploads/4/8/0/9/48096565/palmares-logomarca_orig.jpg",
    ],
  },
];

export const MOCK_EVENTOS: Evento[] = [
  {
    id: "1",
    terreiroId: "1",
    titulo: "Jogos de búzios — Tata Kis'ange",
    categoria: "Gira",
    data: "2026-06-27",
    horario: "14:00",
    local: "Rua Expedicionário Vicente Ribeiro, 84 — Sarandi, Belo Horizonte",
    descricao:
      "Consultas de búzios conduzidas por Tata Kis'ange (Nilo Sérgio Nogueira), um dos ogãs autorizados a representar a Cabana Senhora da Glória. Atendimento mediante agendamento prévio pelo e-mail cabanasenhoradagloria@gmail.com.",
  },
  {
    id: "2",
    terreiroId: "2",
    titulo: "Festejo de 25 anos da CAVOP",
    categoria: "Festividade",
    data: "2026-05-10",
    horario: "16:00",
    local: "Rua Moscovita, 168 — Carajás, Contagem",
    descricao:
      "Celebração dos 25 anos da Casa de Caridade Vovô Pedro de Aruanda com gira de atendimento espiritual, exibição de documentário sobre a história do terreiro e feijoada comunitária gratuita. Evento apoiado pelo Fundo Municipal de Incentivo à Cultura de Contagem, com distribuição de 100 marmitas a pessoas em situação de rua.",
  },
  {
    id: "3",
    terreiroId: "3",
    titulo: "Gira de Umbanda — quintas-feiras",
    categoria: "Gira",
    data: "2026-06-18",
    horario: "19:00",
    local: "Rua Marckinair de Almeida Campos, 105 — Bandeirinhas, Betim",
    descricao:
      "Gira semanal de Umbanda aberta à comunidade, conduzida por Pai Célio e Mãe Cleide no Ylê Axé Orixá Xangô.",
  },
  {
    id: "4",
    terreiroId: "4",
    titulo: "Banquete comunitário",
    categoria: "Festividade",
    data: "2026-08-15",
    horario: "12:00",
    local: "Rua VL-11, 219 — Nova Contagem, Contagem",
    descricao:
      "Refeição comunitária e formação em cultura afro-brasileira promovida pelo Centro Espírita Ogum Beira Mar (Ilê Asé Igba Ogum), patrimônio cultural imaterial de Contagem.",
  },
  {
    id: "5",
    terreiroId: "1",
    titulo: "Participação no COMPIR-BH",
    categoria: "Palestra",
    data: "2026-07-12",
    horario: "10:00",
    local: "Belo Horizonte — MG",
    descricao:
      "Representação da Cabana Senhora da Glória no Conselho Municipal de Promoção da Igualdade Racial de Belo Horizonte, articulando políticas públicas contra o racismo religioso.",
  },
  {
    id: "6",
    terreiroId: "5",
    titulo: "Ser Criança — ancestralidade e afeto",
    categoria: "Workshop",
    data: "2026-06-28",
    horario: "15:00",
    local: "Rua Vila Lobos, 552 — Nova Lima",
    descricao:
      "Projeto Ser Criança: ancestralidade, afeto e representatividade, desenvolvido pela Associação Espírita Pai Benedito de Aruanda com crianças da comunidade e apoio da Prefeitura de Nova Lima.",
  },
  {
    id: "7",
    terreiroId: "6",
    titulo: "Encontro com Iemanjá",
    categoria: "Festividade",
    data: "2026-08-16",
    horario: "08:00",
    local: "Lagoa da Pampulha — Belo Horizonte",
    descricao:
      "Celebração pública anual em homenagem à Iemanjá na Lagoa da Pampulha, com carreata de terreiros, rituais e entrega de oferendas. Organizado pela CCPJO desde 2012; reconhecido como Patrimônio Cultural Imaterial de Belo Horizonte.",
    linkIngresso: "https://ccpjo.org.br/festejos/",
  },
  {
    id: "8",
    terreiroId: "6",
    titulo: "Noite da Libertação",
    categoria: "Festividade",
    data: "2026-05-13",
    horario: "18:00",
    local: "Praça 13 de Maio — Graça, Belo Horizonte",
    descricao:
      "Celebração do Dia da Abolição da Escravatura em homenagem aos Pretos Velhos, realizada há mais de 40 anos pela CCPJO. Patrimônio Cultural Imaterial de Belo Horizonte desde 2019.",
    linkIngresso: "https://ccpjo.org.br/festejos/",
  },
  {
    id: "9",
    terreiroId: "10",
    titulo: "Macarronada Solidária",
    categoria: "Festividade",
    data: "2026-07-12",
    horario: "10:30",
    local: "Praça da Estação — Belo Horizonte",
    descricao:
      "Ação social do Núcleo Vida BH com distribuição de refeições à comunidade em situação de vulnerabilidade, integrando o projeto Macarronada Solidária na Praça da Estação.",
  },
  {
    id: "10",
    terreiroId: "9",
    titulo: "Festividade de Oxóssi",
    categoria: "Obrigação",
    data: "2026-09-27",
    horario: "16:00",
    local: "Rua Doutor Benedito Xavier, 2030 — Aarão Reis, Belo Horizonte",
    descricao:
      "Festividade anual em homenagem a Oxóssi, orixá patrono do Ilê Wopo Olojukan — primeiro terreiro de Candomblé de Belo Horizonte, tombado como patrimônio cultural em 1995.",
  },
  {
    id: "11",
    terreiroId: "8",
    titulo: "Gira de Umbanda Omolokô",
    categoria: "Gira",
    data: "2026-06-19",
    horario: "20:00",
    local: "Rua Hespéria, 105 — Aparecida, Belo Horizonte",
    descricao:
      "Gira aberta às sextas-feiras na Tenda Umbandista Caboclo Pena Branca. Portão aberto às 19h; atendimento por ordem de assento, sem distribuição de senhas.",
  },
  {
    id: "12",
    terreiroId: "12",
    titulo: "Atendimento espiritual — Portal da Luz",
    categoria: "Gira",
    data: "2026-06-24",
    horario: "19:30",
    local: "Rua Constantinopla, 261 — Parque Recreio, Contagem",
    descricao:
      "Atendimento espiritual caritativo do Templo de Umbanda Hermética — Filial Portal da Luz, com distribuição de senhas. Portão fechado às 20h30.",
  },
  {
    id: "13",
    terreiroId: "14",
    titulo: "Banquete comunitário Jeje",
    categoria: "Festividade",
    data: "2026-07-20",
    horario: "12:00",
    local: "Rua Arpoador, 21 — Nazaré, Contagem",
    descricao:
      "Refeição comunitária da Comunidade Espírita Odé Farangi em homenagem às tradições Jeje Marrim, com mais de cinquenta anos de história em Minas Gerais.",
  },
  {
    id: "14",
    terreiroId: "16",
    titulo: "Abre Caminho — Festejo ao Pai Benedito",
    categoria: "Festividade",
    data: "2026-05-31",
    horario: "10:00",
    local: "Rua São Tiago, 216 — Paraíso, Belo Horizonte",
    descricao:
      "Festejo tradicional do Kilombu Manzo Ngunzo Kaiango com cortejo do Boi do Rosário, roda de capoeira, Guarda de Moçambique de São Benedito, Mesa de Teresa e gira de samba. Patrimônio Cultural de BH e de Minas Gerais.",
  },
  {
    id: "15",
    terreiroId: "15",
    titulo: "Gira de Umbanda raiz",
    categoria: "Gira",
    data: "2026-06-26",
    horario: "20:00",
    local: "Rua Hermes da Fonseca, 269 — Novo Progresso, Contagem",
    descricao:
      "Trabalho espiritual de Umbanda raiz no Ilê Axé Casa de Vó Ana e Pena Verde, com culto à espiritualidade em sua essência.",
  },
  {
    id: "16",
    terreiroId: "6",
    titulo: "Pisada de Caboclo — Confluências Afro-indígenas",
    categoria: "Festividade",
    data: "2026-11-15",
    horario: "14:00",
    local: "CRCP Lagoa do Nado — Belo Horizonte",
    descricao:
      "Celebração anual da CCPJO em homenagem à linha dos caboclos, reunindo terreiros e lideranças indígenas — Maxakali, Xacriabá, Pataxó, Guaranis e outras nações — no Centro de Referência da Cultura Popular Lagoa do Nado.",
    linkIngresso: "https://ccpjo.org.br/festejos/",
  },
  {
    id: "17",
    terreiroId: "11",
    titulo: "Gira de atendimento ao público",
    categoria: "Gira",
    data: "2026-06-17",
    horario: "20:00",
    local: "Rua Afrânio Castanheira Friche, 95 — Fernão Dias, Belo Horizonte",
    descricao:
      "Gira de atendimento espiritual no Templo Escola de Umbanda Pena Branca, às quartas-feiras, no Centro Universalista Magha.",
  },
  {
    id: "18",
    terreiroId: "7",
    titulo: "Atendimento espiritual — Umbanda Omolokô",
    categoria: "Gira",
    data: "2026-06-20",
    horario: "19:00",
    local: "Rua Niquelina, 179 — Santa Efigênia, Belo Horizonte",
    descricao:
      "Trabalho mediúnico e atendimento espiritual no Terreiro de Umbanda Ilê Axé Guian Anchieta, tradição Omolokô na região central de Belo Horizonte.",
  },
  {
    id: "19",
    terreiroId: "13",
    titulo: "Tambor de Mina — patrimônio de Contagem",
    categoria: "Festividade",
    data: "2026-08-08",
    horario: "16:00",
    local: "Rua Maria Augusta Belém, 248 — Vila Belém, Contagem",
    descricao:
      "Celebração das práticas de tambor de mina do Ilê Axé Omin Ty Oxalufan, reconhecido como patrimônio cultural imaterial de Contagem, com Mãe Kátia de Lissá.",
  },
  {
    id: "20",
    terreiroId: "2",
    titulo: "Gira de atendimento — sábados",
    categoria: "Gira",
    data: "2026-06-21",
    horario: "16:00",
    local: "Rua Moscovita, 168 — Carajás, Contagem",
    descricao:
      "Gira semanal de atendimento espiritual aos sábados na CAVOP, das 16h às 20h, conduzida por Pai Fernando de Xangô.",
  },
];

export const MOCK_CAMPANHAS: Campanha[] = [
  {
    id: "1",
    terreiroId: LOGGED_TERREIRO_ID,
    parceiroTerreiroId: "6",
    titulo: "Mobilização para o Encontro com Iemanjá 2026",
    descricao:
      "Arrecadação conjunta da Cabana Senhora da Glória e da CCPJO para apoiar a logística, transporte e oferendas do Encontro com Iemanjá na Lagoa da Pampulha — festejo público patrimônio imaterial de Belo Horizonte.",
    metaTipo: "monetaria",
    metaArrecadacao: 20000,
    valorArrecadado: 11850,
    dataInicio: "2026-06-01",
    dataFim: "2026-08-16",
    status: "ativa",
  },
  {
    id: "2",
    terreiroId: LOGGED_TERREIRO_ID,
    titulo: "Cestas básicas — região Sarandi",
    descricao:
      "Coleta de alimentos não perecíveis para montagem de cestas básicas distribuídas pela Cabana a famílias do entorno, conforme ações comunitárias e parcerias com políticas públicas locais.",
    metaTipo: "itens",
    itemDescricao: "Alimentos não perecíveis",
    metaQuantidade: 80,
    quantidadeArrecadada: 52,
    unidade: "cestas",
    dataInicio: "2026-06-01",
    dataFim: "2026-07-31",
    status: "ativa",
  },
  {
    id: "3",
    terreiroId: "6",
    titulo: "Encontro com Iemanjá — materiais e oferendas",
    descricao:
      "Campanha da CCPJO para arrecadar flores, velas, incensos e materiais de limpeza utilizados na organização do festejo público de Iemanjá na Lagoa da Pampulha.",
    metaTipo: "itens",
    itemDescricao: "Flores, velas e materiais ritualísticos",
    metaQuantidade: 400,
    quantidadeArrecadada: 265,
    unidade: "itens",
    dataInicio: "2026-06-01",
    dataFim: "2026-08-16",
    status: "ativa",
  },
  {
    id: "4",
    terreiroId: "10",
    titulo: "Macarronada Solidária — mantimentos",
    descricao:
      "Arrecadação de macarrão, molho, carnes e utensílios descartáveis para as edições da Macarronada Solidária do Núcleo Vida BH na Praça da Estação.",
    metaTipo: "itens",
    itemDescricao: "Mantimentos para refeições",
    metaQuantidade: 300,
    quantidadeArrecadada: 187,
    unidade: "itens",
    dataInicio: "2026-05-15",
    dataFim: "2026-08-31",
    status: "ativa",
  },
  {
    id: "5",
    terreiroId: "16",
    titulo: "Projeto Kizomba — acolhimento comunitário",
    descricao:
      "Campanha do Kilombu Manzo Ngunzo Kaiango para o projeto Kizomba, de acolhimento e apoio a comunidades do entorno, com oficinas de capoeira, dança-afro e confecção de adesivos.",
    metaTipo: "monetaria",
    metaArrecadacao: 8000,
    valorArrecadado: 4200,
    dataInicio: "2026-04-01",
    dataFim: "2026-09-30",
    status: "ativa",
  },
  {
    id: "6",
    terreiroId: "2",
    titulo: "Festejo de 25 anos — marmitas solidárias",
    descricao:
      "Campanha encerrada da CAVOP para preparação de 100 marmitas distribuídas a pessoas em situação de rua durante o festejo comemorativo dos 25 anos do terreiro.",
    metaTipo: "itens",
    itemDescricao: "Marmitas e refeições",
    metaQuantidade: 100,
    quantidadeArrecadada: 100,
    unidade: "marmitas",
    dataInicio: "2026-04-01",
    dataFim: "2026-05-10",
    status: "encerrada",
  },
  {
    id: "7",
    terreiroId: "5",
    parceiroTerreiroId: "1",
    titulo: "Ser Criança — materiais pedagógicos",
    descricao:
      "Arrecadação conjunta da Associação Pai Benedito de Aruanda e da Cabana Senhora da Glória de livros, brinquedos culturais e materiais para o projeto Ser Criança em Nova Lima.",
    metaTipo: "itens",
    itemDescricao: "Livros e materiais pedagógicos",
    metaQuantidade: 150,
    quantidadeArrecadada: 89,
    unidade: "itens",
    dataInicio: "2026-05-01",
    dataFim: "2026-08-31",
    status: "ativa",
  },
];
