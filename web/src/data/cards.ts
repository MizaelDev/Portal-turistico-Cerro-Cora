import type { Category, GameCard } from "@/types/game";

type RawCard = [string, string, string, string, string, string];

const RAW: Record<Category, RawCard[]> = {
  Objetos: [
    ["Guarda-chuva","Chuva","Molhar","Abrir","Cabo","Proteção"],["Tesoura","Cortar","Papel","Lâmina","Ponta","Costura"],["Relógio","Hora","Pulso","Ponteiro","Tempo","Atraso"],["Mochila","Costas","Escola","Alça","Carregar","Bolso"],["Lanterna","Luz","Escuro","Pilha","Iluminar","Botão"],["Espelho","Reflexo","Rosto","Vidro","Olhar","Banheiro"],["Martelo","Prego","Bater","Ferramenta","Madeira","Construção"],["Chaveiro","Chave","Argola","Porta","Bolso","Metal"],["Cadeira","Sentar","Mesa","Pernas","Encosto","Móvel"],["Garrafa","Água","Tampa","Beber","Vidro","Líquido"],
  ],
  Animais: [
    ["Capivara","Roedor","Água","Grande","Brasil","Dentes"],["Girafa","Pescoço","Alta","África","Manchas","Folhas"],["Pinguim","Gelo","Frio","Preto","Branco","Antártida"],["Polvo","Oito","Tentáculos","Mar","Molusco","Tinta"],["Coruja","Noite","Olhos","Ave","Sábia","Voa"],["Tamanduá","Formiga","Focinho","Língua","Brasil","Cupim"],["Golfinho","Mar","Inteligente","Nadar","Salto","Mamífero"],["Camaleão","Cor","Mudar","Lagarto","Língua","Olhos"],["Joaninha","Vermelha","Pintas","Inseto","Asas","Jardim"],["Canguru","Bolsa","Austrália","Pular","Filhote","Cauda"],
  ],
  Comidas: [
    ["Pipoca","Milho","Cinema","Estourar","Panela","Manteiga"],["Brigadeiro","Chocolate","Festa","Leite condensado","Doce","Bolinha"],["Cuscuz","Milho","Nordeste","Café","Flocos","Vapor"],["Lasanha","Massa","Queijo","Molho","Forno","Camadas"],["Acarajé","Bahia","Feijão","Azeite","Camarão","Fritar"],["Paçoca","Amendoim","Doce","Rolha","Festa junina","Farelo"],["Tapioca","Goma","Frigideira","Recheio","Branca","Beiju"],["Feijoada","Feijão","Porco","Arroz","Preta","Sábado"],["Pudim","Leite","Caramelo","Sobremesa","Forma","Furo"],["Coxinha","Frango","Salgado","Frita","Massa","Ponta"],
  ],
  Lugares: [
    ["Biblioteca","Livro","Silêncio","Ler","Estante","Empréstimo"],["Aeroporto","Avião","Viagem","Mala","Embarque","Pista"],["Farmácia","Remédio","Saúde","Comprar","Receita","Balcão"],["Praia","Mar","Areia","Sol","Banho","Onda"],["Museu","Arte","História","Quadro","Exposição","Visita"],["Padaria","Pão","Café","Forno","Comprar","Bolo"],["Estádio","Jogo","Torcida","Campo","Futebol","Arquibancada"],["Zoológico","Animal","Jaula","Visita","Selvagem","Parque"],["Feira","Barraca","Comprar","Fruta","Rua","Vendedor"],["Teatro","Palco","Ator","Peça","Plateia","Cortina"],
  ],
  Profissões: [
    ["Bombeiro","Fogo","Incêndio","Mangueira","Resgate","Caminhão"],["Dentista","Dente","Consultório","Cárie","Boca","Broca"],["Jornalista","Notícia","Reportagem","Entrevista","Jornal","Informação"],["Arquiteto","Casa","Projeto","Planta","Construção","Desenho"],["Padeiro","Pão","Forno","Massa","Padaria","Trigo"],["Veterinário","Animal","Clínica","Cachorro","Saúde","Vacina"],["Fotógrafo","Foto","Câmera","Imagem","Lente","Retrato"],["Cozinheiro","Comida","Panela","Restaurante","Receita","Cozinha"],["Professor","Aluno","Escola","Ensinar","Aula","Quadro"],["Carteiro","Carta","Entrega","Correio","Endereço","Correspondência"],
  ],
  Tecnologia: [
    ["Bluetooth","Sem fio","Conectar","Celular","Fone","Azul"],["Impressora","Papel","Tinta","Documento","Imprimir","Computador"],["Roteador","Internet","Wi-Fi","Sinal","Rede","Antena"],["Teclado","Digitar","Letras","Computador","Tecla","Espaço"],["Bateria","Carga","Energia","Celular","Acabar","Porcentagem"],["Satélite","Espaço","Sinal","Órbita","Antena","Terra"],["Robô","Máquina","Automático","Metal","Programar","Humano"],["Pendrive","USB","Arquivo","Memória","Computador","Salvar"],["Drone","Voar","Câmera","Controle","Hélice","Filmagem"],["Código QR","Quadrado","Câmera","Escanear","Link","Pagamento"],
  ],
  Internet: [
    ["Meme","Piada","Imagem","Viral","Internet","Compartilhar"],["Podcast","Áudio","Episódio","Ouvir","Microfone","Programa"],["Hashtag","Cerquilha","Assunto","Rede social","Marcar","Tendência"],["Streaming","Assistir","Filme","Série","Internet","Ao vivo"],["Influenciador","Seguidores","Rede social","Publicidade","Vídeo","Famoso"],["Senha","Acesso","Secreta","Login","Letras","Segurança"],["Download","Baixar","Arquivo","Internet","Salvar","Computador"],["Emoji","Carinha","Mensagem","Símbolo","Celular","Expressão"],["Nuvem digital","Arquivo","Online","Salvar","Servidor","Internet"],["Videochamada","Câmera","Reunião","Online","Falar","Tela"],
  ],
  Brasil: [
    ["Carnaval","Folia","Fantasia","Samba","Fevereiro","Desfile"],["Amazônia","Floresta","Norte","Rio","Verde","Brasil"],["Cristo Redentor","Rio de Janeiro","Estátua","Braços","Corcovado","Turista"],["Chimarrão","Erva","Cuia","Sul","Quente","Bomba"],["Samba","Dança","Música","Carnaval","Ritmo","Pandeiro"],["Pantanal","Alagado","Onça","Centro-Oeste","Natureza","Novela"],["Festa do Peão","Rodeio","Boi","Interior","Chapéu","Arena"],["Boto-cor-de-rosa","Amazônia","Rio","Golfinho","Lenda","Encantado"],["Jabuti","Casco","Lento","Réptil","Terra","Animal"],["Guaraná","Refrigerante","Fruta","Amazônia","Bebida","Cafeína"],
  ],
  Nordeste: [
    ["Literatura de cordel","Verso","Folheto","Xilogravura","Poema","Feira"],["Forró","Dança","Sanfona","Festa","Música","Nordeste"],["Mandacaru","Cacto","Sertão","Espinho","Seca","Flor"],["Jangada","Mar","Pesca","Vela","Madeira","Praia"],["Caranguejo","Praia","Casco","Pinça","Mangue","Andar"],["Rapadura","Cana","Doce","Bloco","Açúcar","Sertão"],["Frevo","Pernambuco","Dança","Sombrinha","Carnaval","Rápido"],["Renda de bilro","Artesanato","Linha","Almofada","Tecido","Ceará"],["Serra","Montanha","Frio","Subir","Mirante","Altitude"],["Vaquejada","Cavalo","Boi","Arena","Vaqueiro","Corrida"],
  ],
  Futebol: [
    ["Impedimento","Árbitro","Gol","Linha","Atacante","Regra"],["Escanteio","Canto","Bola","Cobrança","Área","Bandeirinha"],["Goleiro","Gol","Mão","Defesa","Luvas","Trave"],["Drible","Bola","Passar","Jogador","Adversário","Finta"],["Pênalti","Falta","Área","Chute","Gol","Marca"],["Torcida","Estádio","Cantar","Time","Arquibancada","Gritar"],["Cartão vermelho","Expulsão","Árbitro","Falta","Jogador","Campo"],["Prorrogação","Tempo","Empate","Jogo","Minutos","Final"],["Chuteira","Pé","Trava","Campo","Calçado","Jogador"],["Bola na trave","Gol","Poste","Chute","Quase","Rebote"],
  ],
  Esportes: [
    ["Vôlei","Rede","Bola","Saque","Quadra","Cortar"],["Natação","Piscina","Água","Nadar","Raia","Touca"],["Skate","Rodas","Prancha","Manobra","Pista","Capacete"],["Judô","Luta","Quimono","Faixa","Tatame","Golpe"],["Tênis","Raquete","Bola","Quadra","Saque","Rede"],["Surfe","Onda","Prancha","Mar","Praia","Equilíbrio"],["Ciclismo","Bicicleta","Pedal","Corrida","Capacete","Roda"],["Basquete","Cesta","Bola","Quadra","Arremesso","Tabela"],["Atletismo","Corrida","Pista","Salto","Medalha","Velocidade"],["Ginástica","Aparelho","Salto","Equilíbrio","Nota","Olímpico"],
  ],
  Escola: [
    ["Recreio","Intervalo","Lanche","Pátio","Aula","Brincar"],["Prova","Nota","Questão","Estudar","Resposta","Avaliação"],["Apontador","Lápis","Ponta","Raspa","Material","Girar"],["Geografia","Mapa","País","Terra","Matéria","Capital"],["Cantina","Lanche","Comprar","Comida","Intervalo","Fila"],["Caderno","Folha","Escrever","Matéria","Espiral","Capa"],["Mochila escolar","Livro","Costas","Material","Alça","Aluno"],["Experimento","Ciência","Laboratório","Teste","Resultado","Hipótese"],["Chamada","Nome","Presença","Professor","Aluno","Falta"],["Trabalho em grupo","Equipe","Nota","Colega","Apresentar","Tarefa"],
  ],
  Casa: [
    ["Liquidificador","Bater","Cozinha","Suco","Copo","Lâmina"],["Varal","Roupa","Secar","Pregador","Sol","Quintal"],["Travesseiro","Dormir","Cabeça","Cama","Macio","Fronha"],["Chuveiro","Banho","Água","Quente","Banheiro","Sabonete"],["Geladeira","Frio","Comida","Cozinha","Porta","Freezer"],["Vassoura","Varrer","Chão","Limpar","Cabo","Poeira"],["Sofá","Sala","Sentar","Almofada","Televisão","Móvel"],["Micro-ondas","Esquentar","Comida","Tempo","Cozinha","Prato"],["Cortina","Janela","Tecido","Luz","Abrir","Sala"],["Campainha","Porta","Tocar","Visita","Som","Botão"],
  ],
  Transporte: [
    ["Metrô","Trem","Estação","Subterrâneo","Passageiro","Trilho"],["Bicicleta","Pedal","Roda","Guidão","Capacete","Ciclovia"],["Helicóptero","Voar","Hélice","Piloto","Céu","Pousar"],["Barco","Água","Navegar","Rio","Vela","Porto"],["Ônibus","Passageiro","Ponto","Motorista","Cidade","Passagem"],["Patinete","Rodas","Guidão","Empurrar","Elétrico","Rua"],["Caminhão","Carga","Estrada","Motorista","Grande","Carroceria"],["Teleférico","Cabo","Montanha","Cabine","Alto","Passeio"],["Táxi","Corrida","Motorista","Passageiro","Amarelo","Preço"],["Balsa","Travessia","Água","Carro","Rio","Embarcação"],
  ],
  Natureza: [
    ["Cachoeira","Água","Queda","Rio","Banho","Pedra"],["Arco-íris","Chuva","Cores","Céu","Sol","Sete"],["Vulcão","Lava","Erupção","Montanha","Fogo","Cinza"],["Manguezal","Mangue","Caranguejo","Lama","Maré","Raiz"],["Deserto","Areia","Seco","Calor","Cacto","Duna"],["Aurora boreal","Luzes","Céu","Norte","Noite","Verde"],["Caverna","Escuro","Pedra","Morcego","Gruta","Entrar"],["Gêiser","Água","Quente","Vapor","Jato","Terra"],["Recife de coral","Mar","Peixe","Colorido","Mergulho","Oceano"],["Duna","Areia","Vento","Deserto","Morro","Praia"],
  ],
  Aleatórias: [
    ["Cócegas","Rir","Toque","Barriga","Pé","Brincadeira"],["Déjà vu","Sensação","Já","Aconteceu","Lembrança","Francês"],["Fofoca","Segredo","Contar","Pessoa","Notícia","Boato"],["Soneca","Dormir","Curta","Tarde","Cansaço","Cama"],["Fila","Esperar","Ordem","Pessoa","Atendimento","Frente"],["Sorte","Azar","Acaso","Ganhar","Trevo","Destino"],["Silêncio","Som","Calar","Barulho","Ouvir","Quieto"],["Pressa","Rápido","Atraso","Correr","Tempo","Urgente"],["Saudade","Falta","Lembrança","Pessoa","Distância","Sentimento"],["Gambiarra","Improviso","Conserto","Jeito","Fita","Brasil"],
  ],
};

const slug = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const CARDS: GameCard[] = Object.entries(RAW).flatMap(([category, rows]) =>
  rows.map((row, localIndex) => {
    const index = Object.keys(RAW).indexOf(category) * 10 + localIndex;
    const difficulty = index < 48 ? "easy" : index < 120 ? "medium" : "hard";
    return { id: `${slug(category)}-${String(localIndex + 1).padStart(3, "0")}`, word: row[0], forbidden: row.slice(1) as GameCard["forbidden"], category: category as Category, difficulty };
  }),
);
