let undoStack = []; //Array para guardar estados anteriores do desenho (desfazer)
let redoStack = []; //Array para guardar estados anulados (refazer)
const maxStates = 20; //Limite máximo de estados guardados para poupar memória

let palettes = [];//Array que vai guardar as cores de cada paleta
let paletteNames = ["Noite Estrelada", "Os Girassóis", "Retrato Van Gogh", "Mix Van Gogh"];//Nomes das paletas
let paletteDescriptions = [ //Legenda para as cores de cada paletas
  ["1: Azul Escuro", "2: Azul Claro", "3: Laranja", "4: Amarelo", "5: Preto", "6: Branco"],
  ["1: Amarelo", "2: Castanho", "3: Castanho Escuro", "4: Bege", "5: Verde Escuro", "6: Verde Claro"],
  ["1: Verde Petróleo", "2: Azul Esverdeado", "3: Azul Gelo", "4: Pêssego", "5: Terracota", "6: Branco"],
  ["1: Vermelho", "2: Roxo", "3: Lilás", "4: Ciano", "5: Cinzento", "6: Cor de Rosa"]
];

let currentPaletteIdx = 0; //Índice da paleta selecionada no momento
let isDarkCanvas = true; // Indica se está no modo claro ou escuro
let isEraser = false; //Informa se está no modo pincel ou borracha
let selectedColor; //Cor atual que está a ser usada
let activeColorNum = 1; //Número da cor ativa
let painelAtivo = true; //Controla se o painel lateral está ativo
let mexendoNoPainel = false; // Bloqueia a pintura enquanto arrastamos sliders
let camadaDesenho; // A camada invisível onde o desenho é guardado
let brushSize = 10; // Tamanho inicial do pincel
let brushOpacity = 150; // Define o nível de transparência inicial da tinta

let msgFeedback = ""; // Texto que aparece no centro do ecrã temporariamente
let timerFeedback = 0; // Duração do texto de feedback

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);//Cria a área de visualização total
  document.body.style.margin = "0"; //Remove margens do HTML
  document.body.style.overflow = "hidden"; //Impede barras de scroll na página
  canvas.elt.style.display = "block";// Remove espaçamentos de bloco do elemento canvas

  camadaDesenho = createGraphics(windowWidth, windowHeight);// Cria uma camada transparente independente para o desenho
  camadaDesenho.clear(); // Garante que a camada de desenho começa totalmente vazia e transparente
  
  // Define as cores hexadecimais para as 4 paletas 
  palettes = [
    [color('#0F2043'), color('#1A3E8C'), color('#F29F05'), color('#F2CB05'), color('#000000'), color('#FFFFFF')],
    [color('#F2CB05'), color('#8C5E35'), color('#452B13'), color('#D9C5B2'), color('#2D401F'), color('#738C5A')],
    [color('#2D5959'), color('#4E8C8C'), color('#D6EAF2'), color('#F2D0A7'), color('#D99177'), color('#FFFFFF')],
    [color('#A62424'), color('#592D82'), color('#B68ED9'), color('#2DBABF'), color('#808080'), color('#F2A7C3')]
  ];

  selectedColor = palettes[0][0]; // Define a cor inicial como a primeira cor da primeira paleta

 // Configura um evento do navegador para avisar antes de fechar a aba
  window.onbeforeunload = function() {
    return "Tens um trabalho em andamento. Queres mesmo sair?"; // Mensagem de aviso contra perda de dados
  };

  carregarDesenho();// Tenta recuperar desenho do LocalStorage
}

function draw() {
  let bgColor = isDarkCanvas ? color(15, 25, 45) : color(242, 238, 220); // Escolhe a cor de fundo conforme o tema
  background(bgColor); // Pinta o fundo do canvas principal

  // Condição para pintar: rato premido + não estar no menu + não estar na área da moldura inferior
  if (mouseIsPressed && !mexendoNoPainel && mouseY < height - 40 && !(painelAtivo && mouseX < 260 && mouseY < 450)) { 
    paintVanGoghFluid(); // Executa a função de pintura personalizada
  }

  image(camadaDesenho, 0, 0); // Desenha a camada de pintura por cima do fundo

  drawBaseWood(); // Desenha a moldura de madeira inferior
  if (painelAtivo) drawUI(); // Se a UI estiver ativada, desenha o painel lateral

  // Gestão das mensagens de feedback centralizadas
  if (timerFeedback > 0) { // Se houver uma mensagem ativa no cronómetro
    push(); // Guarda as configurações de estilo atuais
    textAlign(CENTER, CENTER); // Alinha o texto ao centro horizontal e vertical
    textSize(32); textStyle(BOLD); // Define o tamanho grande e estilo negrito para o texto
    fill(0, timerFeedback * 0.5); text(msgFeedback, width / 2 + 2, height / 2 + 2);// Desenha uma sombra para o texto
    fill(isDarkCanvas ? 255 : 40, timerFeedback); // Define a cor do texto com base no tema e na opacidade do timer
    noStroke(); text(msgFeedback, width / 2, height / 2);
    timerFeedback -= 5; // Reduz o tempo/opacidade da mensagem em cada frame
    pop(); // Restaura as configurações de estilo
  }
  desenharCursor(); // Desenha o cursor personalizado que indica o tamanho e cor do pincel
}

function drawBaseWood() { // Função que desenha a moldura de madeira no fundo
  push(); // Inicia novo estilo isolado
  rectMode(CORNER); // Define o modo de desenho de retângulos a partir do canto
  noStroke(); // Remove o contorno
  fill(190, 120, 60); // Cor base da madeira
  rect(0, height - 40, width, 40);// Desenha o retângulo da base

  push(); // Inicia sub-estilo para os veios da madeira
  // Cria um recorte para os veios da madeira não saírem da barra
  drawingContext.beginPath(); // Inicia um caminho de desenho nativo do Canvas API
  drawingContext.rect(0, height - 40, width, 40); // Define a área da máscara
  drawingContext.clip(); // Corta tudo o que for desenhado fora desta área
  noFill(); // Remove o preenchimento das linhas dos veios
  
  for (let i = 0; i < 15; i++) { // Desenha 15 linhas para simular a textura da madeira
    let yBase = (height - 38) + (i * 2.5); // Calcula a posição vertical de cada linha
    stroke(80, 40, 10, 120); // Define uma cor castanha escura e semitransparente
    strokeWeight(1.2);// Define a espessura fina para os veios
    beginShape(); // Inicia uma forma personalizada, linha curva
    curveVertex(-100, yBase); // Ponto de controlo inicial fora do ecrã
    for (let x = 0; x <= width + 200; x += 150) { // Cria pontos ao longo da largura
      let nVal = noise(x * 0.005, yBase * 0.2); // Gera ondulação natural
      let distorsao = (nVal * 24) - 12; // Calcula o desvio vertical da linha
      curveVertex(x, yBase + distorsao); // Adiciona um ponto curvo na forma
    }
    curveVertex(width + 100, yBase); // Ponto de controlo final fora do ecrã
    endShape(); // Finaliza o desenho da linha curva
  }
  pop(); // Remove a máscara de recorte

  stroke(255, 60); // Define uma cor branca muito suave
  strokeWeight(1); // Linha fina
  line(0, height - 40, width, height - 40); // Desenha um brilho na aresta superior da madeira

  if (painelAtivo) {
    drawShortcuts(); // Mostra as instruções de comandos na barra se  UI estiver aberta
  } else { // Se a UI estiver fechada
    push(); // Estilo para o título centralizado
    textAlign(CENTER, CENTER); // Alinhamento central
    textSize(14); textStyle(BOLD); // Tamanho pequeno e negrito
    let txt = "ATELIER DE VAN GOGH";
    fill(40, 20, 0, 150); text(txt, width/2, height - 21); // Desenha sombra
    fill(255, 255, 255, 80); text(txt, width/2, height - 18.8); // Desenha brilho inferior
    fill(80, 45, 10, 220); text(txt, width/2, height - 20); // Desenha o texto principal
    pop(); // Restaura estilo
  }
  pop(); // Restaura estilo original da função
}

function drawShortcuts() { // Função que desenha os atalhos de teclado na base
  push(); // Novo estilo isolado
  rectMode(CORNER); // Desenho por cantos
  noStroke(); // Sem contorno
  fill(30, 15, 5, 60); // Fundo escurecido para a legenda
  rect(0, height - 40, width, 40); // Desenha o fundo da legenda 
  textAlign(CENTER, CENTER); // Alinhamento central
  textSize(12); textStyle(BOLD); // Estilo de texto dos atalhos
  let icon = isEraser ? "⌫ " : "✎ "; // Escolhe o ícone conforme a ferramenta ativa
  let modoLabel = isEraser ? "BORRACHA" : "PINCEL"; // Escolhe o nome da ferramenta
  let comandos = "  •  [A]  •  [P] Paleta  •  [1-6] Cores  •  [+/-] Tam  •  [⇧ +/-] Opac  • [C] Limpar  •  [S] Salvar  •  [M] Tema  •  [H] UI";
  let fullText = icon + modoLabel + comandos; // Junta tudo numa única string
  fill(0, 100); text(fullText, width/2 + 1, height - 19); // Desenha sombra do texto
  fill(255, 245, 210); text(fullText, width/2, height - 20); // Desenha o texto principal em cor bege
  pop(); // Restaura estilo
}

function mostrarFeedback(txt) { // Função para ativar uma mensagem no centro do ecrã
  msgFeedback = txt; // Define o conteúdo da mensagem
  timerFeedback = 255; // Inicia o contador com opacidade máxima
}

function drawUI() { // Função que desenha o painel lateral de ferramentas
  push(); // Novo estilo
  rectMode(CORNER); // Modo de desenho de retângulo
  drawingContext.shadowBlur = 20; // Ativa o efeito de sombra nativo do navegador
  drawingContext.shadowColor = isDarkCanvas ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'; // Cor da sombra conforme o tema
  fill(isDarkCanvas ? color(20, 30, 48, 220) : color(255, 255, 255, 230)); // Cor de fundo do painel (vidro fosco)
  noStroke(); // Sem contorno no painel
  rect(30, 30, 220, 410, 30); // Desenha o corpo do painel com cantos arredondados
  drawingContext.shadowBlur = 0; // Desativa a sombra para os elementos internos
  fill(isDarkCanvas ? 255 : 40); // Cor do texto do título
  textSize(22); textStyle(BOLD); textAlign(LEFT, TOP); // Estilo de título
  text(paletteNames[currentPaletteIdx], 55, 60); // Escreve o nome da paleta atual
  let xCor = 55; // Posição X inicial das amostras de cor
  for (let i = 0; i < palettes[currentPaletteIdx].length; i++) { // Loop para desenhar as 6 cores da paleta
    let sel = (activeColorNum === i + 1 && !isEraser); // Verifica se esta cor é a selecionada
    push(); // Estilo para cada amostra
    if (sel) { stroke(255, 204, 0); strokeWeight(3); } // Se selecionada, coloca contorno dourado grosso
    else { stroke(isDarkCanvas ? 255 : 0, 40); strokeWeight(1); } // Se não, contorno fino
    fill(palettes[currentPaletteIdx][i]); // Cor da amostra
    rect(xCor + (i * 30), 105, 24, 24, 6); // Desenha o pequeno quadrado da cor
    pop(); // Restaura estilo da amostra
  }
  textStyle(NORMAL); textSize(15); // Estilo para a lista de nomes das cores
  let lines = paletteDescriptions[currentPaletteIdx]; // Obtém a lista de nomes da paleta ativa
  for (let i = 0; i < lines.length; i++) { // Loop para escrever os nomes
    let ativa = (activeColorNum === (i + 1) && !isEraser); // Verifica se é a cor atual
    fill(ativa ? (isDarkCanvas ? 255 : 0) : (isDarkCanvas ? 150 : 100)); // Muda cor do texto se ativa
    textStyle(ativa ? BOLD : NORMAL); // Muda para negrito se ativa
    text((ativa ? "> " : "  ") + lines[i], 55, 150 + (i * 26)); // Escreve o nome da cor com marcador
  }
  drawModernSlider("TAMANHO", 315, brushSize, 1, 60); // Desenha o slider de tamanho
  drawModernSlider("OPACIDADE", 355, brushOpacity, 10, 255); // Desenha o slider de opacidade
  drawActionButton(75, 405, "z", undoStack.length > 1); // Desenha o botão visual de Desfazer
  drawActionButton(120, 405, "x", redoStack.length > 0); // Desenha o botão visual de Refazer
  pop(); // Restaura estilo total da UI
}

function drawModernSlider(label, y, valor, min, max) { // Função para desenhar um slider personalizado
  fill(isDarkCanvas ? 180 : 80); // Cor da legenda do slider
  textStyle(BOLD); textSize(11); textAlign(LEFT, CENTER); // Estilo pequeno
  text(label, 55, y); // Escreve o nome do parâmetro (ex: TAMANHO)
  fill(isDarkCanvas ? 40 : 210); // Cor do fundo da barra do slider
  rect(130, y - 3, 100, 6, 3); // Desenha a calha do slider
  fill(255, 204, 0); // Cor amarela para o preenchimento ativo
  let largura = map(valor, min, max, 0, 100); // Converte o valor real para a largura visual (0-100px)
  rect(130, y - 3, largura, 6, 3); // Desenha a parte preenchida do slider
}

function drawActionButton(x, y, txt, ativo) { // Função para desenhar botões de ação (Undo/Redo)
  push(); // Estilo isolado
  rectMode(CENTER); // Desenha retângulos a partir do centro
  fill(ativo ? (isDarkCanvas ? 60 : 230) : (isDarkCanvas ? 35 : 210)); // Cor muda conforme está disponível ou não
  stroke(ativo ? 255 : 100, 40); // Contorno do botão
  rect(x, y, 36, 28, 8); // Desenha o retângulo do botão
  textAlign(CENTER, CENTER); // Texto centrado no botão
  fill(ativo ? (isDarkCanvas ? 255 : 50) : 120); // Cor da letra
  textSize(13); textStyle(BOLD); // Estilo de texto
  text(txt, x, y); // Escreve a letra da tecla (Z ou X)
  pop(); // Restaura estilo
}

function keyPressed() { // Função do p5.js chamada quando uma tecla é premida
  if (key === 'z' || key === 'Z') undo(); // Tecla Z: Desfazer
  if (key === 'x' || key === 'X') redo(); // Tecla X: Refazer
  if (key == 's' || key == 'S') { saveCanvas("atelier_vangogh", "png"); mostrarFeedback("Guardado"); } // Tecla S: Salvar imagem
  if (key == 'a' || key == 'A') { isEraser = !isEraser; mostrarFeedback(isEraser ? "Borracha" : "Pincel"); } // Tecla A: Alternar Borracha
  if (key == 'm' || key == 'M') { isDarkCanvas = !isDarkCanvas; mostrarFeedback(isDarkCanvas ? "Tema Escuro" : "Tema Claro"); } // Tecla M: Alternar Tema
  if (key == 'h' || key == 'H') painelAtivo = !painelAtivo; // Tecla H: Esconder/Mostrar Painel
  if (key == 'p' || key == 'P') { // Tecla P: Mudar de Paleta
    currentPaletteIdx = (currentPaletteIdx + 1) % palettes.length; // Passa para a próxima paleta (ciclo)
    updateSelection(activeColorNum); // Atualiza a cor selecionada na nova paleta
    mostrarFeedback(paletteNames[currentPaletteIdx]); // Mostra o nome da nova obra
  }
  if (key >= '1' && key <= '6') { // Teclas 1-6: Seleção rápida de cores
    let num = int(key); // Converte o caractere para número inteiro
    if (num <= palettes[currentPaletteIdx].length) { // Se o número existe na paleta
      activeColorNum = num; // Atualiza o índice visual
      selectedColor = palettes[currentPaletteIdx][num - 1]; // Define a nova cor de pintura
      isEraser = false; // Desativa a borracha automaticamente
      mostrarFeedback(paletteDescriptions[currentPaletteIdx][num-1]); // Mostra o nome da cor
    }
  }
  if (key === '+' || key === '*') { // Tecla + ou *: Aumentar valores
    if (keyIsDown(SHIFT)) { // Se o SHIFT estiver premido: aumenta opacidade
      brushOpacity = constrain(brushOpacity + 15, 10, 255); // Limita entre 10 e 255
      let p = round(map(brushOpacity, 10, 255, 0, 100)); // Calcula percentagem para o feedback
      mostrarFeedback("Opacidade: " + p + "%"); // Mostra feedback
    } else { // Se SHIFT não estiver premido: aumenta tamanho
      brushSize = constrain(brushSize + 2, 1, 60); // Aumenta de 2 em 2 até 60
      mostrarFeedback("Tamanho: " + brushSize); // Mostra feedback
    }
  }
  
  if (key === '-' || key === '_') { // Tecla - ou _: Diminuir valores
    if (keyIsDown(SHIFT)) { // Se SHIFT premido: diminui opacidade
      brushOpacity = constrain(brushOpacity - 15, 10, 255); // Reduz
      let p = round(map(brushOpacity, 10, 255, 0, 100)); // Calcula percentagem
      mostrarFeedback("Opacidade: " + p + "%"); // Mostra feedback
    } else { // Sem SHIFT: diminui tamanho
      brushSize = constrain(brushSize - 2, 1, 60); // Reduz
      mostrarFeedback("Tamanho: " + brushSize); // Mostra feedback
    }
  }
  if (key == 'c' || key == 'C') { // Tecla C: Limpar tudo
    if(confirm("Limpar toda a tela?")) { // Mostra caixa de diálogo de confirmação
      undoStack.push(camadaDesenho.get()); // Guarda o estado atual antes de apagar para poder desfazer
      camadaDesenho.clear(); // Limpa a camada de desenho
      redoStack = []; // Reinicia o refazer
      localStorage.removeItem('atelier_canvas'); // Apaga o cache do navegador
      localStorage.removeItem('atelier_dim'); // Apaga as dimensões guardadas
      mostrarFeedback("Tela Limpa"); // Mostra feedback
    }
  }
}

function mousePressed() { // Chamada quando o botão do rato é premido
  if (painelAtivo && mouseX < 260 && mouseY < 450) mexendoNoPainel = true; // Deteta se o clique foi dentro da área da UI
  else mexendoNoPainel = false; // Se fora da UI, permite pintar
}

function mouseClicked() { // Chamada quando o rato é clicado e solto rapidamente
  if (painelAtivo) { // Se o painel estiver aberto, gere as interações de clique
    let yCores = 105; // Posição Y da linha de amostras
    for (let i = 0; i < palettes[currentPaletteIdx].length; i++) { // Verifica cada amostra de cor
      let xCor = 55 + (i * 30); // Calcula posição X da amostra
      if (mouseX > xCor && mouseX < xCor + 24 && mouseY > yCores && mouseY < yCores + 24) { // Se clicou na cor
        activeColorNum = i + 1; // Atualiza índice visual
        updateSelection(activeColorNum); // Seleciona a nova cor
        isEraser = false; // Desativa borracha
        mostrarFeedback(paletteDescriptions[currentPaletteIdx][i]); // Feedback
        return; // Sai da função
      }
    }
    if (mouseX > 55 && mouseX < 230 && mouseY > 50 && mouseY < 85) { // Se clicou no título da obra
      currentPaletteIdx = (currentPaletteIdx + 1) % palettes.length; // Muda para a próxima paleta
      updateSelection(activeColorNum); // Atualiza cor
      mostrarFeedback(paletteNames[currentPaletteIdx]); // Feedback
      return; // Sai da função
    }
    if (dist(mouseX, mouseY, 75, 405) < 20) undo(); // Deteta clique no botão "Z" visual
    if (dist(mouseX, mouseY, 120, 405) < 20) redo(); // Deteta clique no botão "X" visual
  }
}

function mouseDragged() { // Chamada enquanto o rato é movido com o botão premido
  if (painelAtivo && mexendoNoPainel) { // Se estivermos a interagir com os sliders do painel
    let mX = constrain(mouseX, 130, 230); // Limita o valor X do rato à largura visual do slider
    
    // Slider de Tamanho: verifica se o rato está na linha do tamanho
    if (mouseY > 300 && mouseY < 330) {
      if (mX > 228) brushSize = 60; // Se arrastar até ao fim, define o máximo 60
      else brushSize = floor(map(mX, 130, 230, 1, 60.9)); // Converte posição X para valor entre 1 e 60
      mostrarFeedback("Tamanho: " + brushSize); // Feedback
    }
    
    // Slider de Opacidade: verifica se o rato está na linha da opacidade
    if (mouseY > 340 && mouseY < 370) {
      if (mX > 228) brushOpacity = 255; // Se arrastar até ao fim, opacidade total
      else brushOpacity = floor(map(mX, 130, 230, 10, 255.9)); // Converte para valor entre 10 e 255
      
      let p = round(map(brushOpacity, 10, 255, 0, 100)); // Converte para percentagem 0-100%
      mostrarFeedback("Opacidade: " + p + "%"); // Feedback
    }
  }
}

function mouseReleased() { // Chamada quando o botão do rato é solto
  mexendoNoPainel = false; // Garante que a flag do painel é resetada
  let naUI = (mouseX < 260 && mouseY < 450); // Verifica se largou o rato sobre a UI
  if (!naUI && mouseY < height - 40) { // Se largou fora da UI e fora da moldura (ou seja, estava a pintar)
    if (undoStack.length >= maxStates) undoStack.shift(); // Remove o estado mais antigo se a lista estiver cheia
    undoStack.push(camadaDesenho.get()); // Tira uma "foto" do canvas e guarda na pilha de desfazer
    redoStack = []; // Sempre que há um novo traço, a pilha de refazer é limpa
    salvarDesenho(); // Guarda o progresso no armazenamento local do navegador
  }
}

function undo() { // Função para desfazer a última ação
  if (undoStack.length > 1) { // Só desfaz se houver pelo menos um estado anterior guardado
    redoStack.push(undoStack.pop()); // Move o estado atual para a lista de refazer
    camadaDesenho.clear(); // Limpa a camada para desenhar o estado anterior por cima
    camadaDesenho.image(undoStack[undoStack.length - 1], 0, 0); // Desenha a "foto" anterior no canvas
    salvarDesenho(); // Atualiza o cache
    mostrarFeedback("Desfazer"); // Feedback visual
  }
}

function redo() { // Função para refazer uma ação que foi desfeita
  if (redoStack.length > 0) { // Verifica se há algo para refazer
    let nextState = redoStack.pop(); // Tira o estado da pilha de refazer
    undoStack.push(nextState); // Coloca de volta na pilha de desfazer
    camadaDesenho.clear(); // Limpa o canvas
    camadaDesenho.image(nextState, 0, 0); // Desenha o estado recuperado
    salvarDesenho(); // Atualiza cache
    mostrarFeedback("Refazer"); // Feedback visual
  }
}

function paintVanGoghFluid() { // Função principal que cria o efeito de pinceladas de Van Gogh
  let d = dist(mouseX, mouseY, pmouseX, pmouseY); // Calcula a distância entre a posição atual e a anterior do rato (velocidade)
  let passos = d > 2 ? floor(d / 2) : 1; // Define quantos pontos intermédios desenhar para não haver falhas no traço
  for (let p = 0; p <= passos; p++) { // Loop para preencher o caminho entre o frame anterior e o atual
    let interX = lerp(pmouseX, mouseX, p / passos); // Interpola a posição X proporcionalmente
    let interY = lerp(pmouseY, mouseY, p / passos); // Interpola a posição Y proporcionalmente
    let angulo = atan2(mouseY - pmouseY, mouseX - pmouseX); // Calcula o ângulo do movimento do rato
    camadaDesenho.push(); // Inicia transformação isolada na camada de desenho
    camadaDesenho.translate(interX, interY); // Move o sistema de coordenadas para o ponto atual
    camadaDesenho.rotate(angulo); // Roda o pincel para seguir a direção do movimento
    if (isEraser) camadaDesenho.erase(); // Se estiver em modo borracha, ativa a função de apagar
    let qtdCerdas = floor(map(brushSize, 1, 50, 4, 15)); // Calcula quantas "linhas" o pincel tem baseado no tamanho
    for (let i = 0; i < qtdCerdas; i++) { // Desenha cada cerda/fibra do pincel
      if (!isEraser) { // Se for pintura normal
        let r = red(selectedColor) + random(-20, 20); // Aplica uma pequena variação aleatória no tom Vermelho
        let g = green(selectedColor) + random(-20, 20); // Aplica variação no Verde
        let b = blue(selectedColor) + random(-20, 20); // Aplica variação no Azul
        camadaDesenho.fill(r, g, b, brushOpacity + random(-20, 20)); // Define a cor final com jitter de opacidade
      } else { camadaDesenho.fill(255, brushOpacity); } // Se for borracha, usa branco (embora erase() seja o que importa)
      camadaDesenho.noStroke(); // Cerda não tem contorno
      // Desenha o retângulo da pincelada: o comprimento aumenta com a velocidade (d) do rato
      camadaDesenho.rect(random(-brushSize, brushSize), random(-brushSize, brushSize), 
                         map(d, 0, 50, brushSize * 1.5, brushSize * 7), 
                         random(1, brushSize / 3 + 1), 2); 
    }
    if (isEraser) camadaDesenho.noErase(); // Desativa o modo borracha após desenhar o ponto
    camadaDesenho.pop(); // Restaura as coordenadas da camada
  }
}

function updateSelection(num) { // Função auxiliar para mudar a cor baseada no índice
  selectedColor = palettes[currentPaletteIdx][num - 1]; // Busca a cor na paleta correta
}

function salvarDesenho() { // Função que guarda o estado do canvas na memória persistente do browser
  localStorage.setItem('atelier_canvas', camadaDesenho.elt.toDataURL()); // Converte o desenho para uma imagem Base64 string
  localStorage.setItem('atelier_dim', JSON.stringify({w: windowWidth, h: windowHeight})); // Guarda as dimensões do ecrã
}

function carregarDesenho() { // Função que tenta restaurar o desenho ao abrir a página
  let savedData = localStorage.getItem('atelier_canvas'); // Lê os dados do LocalStorage
  let savedDim = JSON.parse(localStorage.getItem('atelier_dim')); // Lê as dimensões guardadas
  undoStack = [camadaDesenho.get()]; // Inicializa a pilha de desfazer com o canvas vazio atual
  if (savedData) { // Se existirem dados guardados
    setTimeout(() => { // Espera um pouco para garantir que a página carregou
      let querRecuperar = confirm("Encontrámos um trabalho da tua última sessão.\nQueres recuperá-lo?"); // Pergunta ao user
      if (querRecuperar) { // Se o utilizador aceitar
        loadImage(savedData, img => { // Carrega a imagem Base64
          camadaDesenho.clear(); // Limpa o canvas vazio
          if (savedDim) camadaDesenho.image(img, 0, 0, savedDim.w, savedDim.h); // Desenha a imagem guardada
          else camadaDesenho.image(img, 0, 0); // Caso não haja dimensões, desenha normal
          undoStack = [camadaDesenho.get()]; // Define este novo estado como o ponto inicial do Undo
          mostrarFeedback("Desenho Recuperado"); // Avisa o utilizador
        });
      }
    }, 100);
  }
}

function desenharCursor() { // Função que desenha o circulo indicador no lugar do ponteiro do rato
  // Verifica se o rato está na zona de pintura (acima da madeira) E fora do painel lateral
  let naZonaPintura = mouseY < height - 40;
  let noPainelLateral = painelAtivo && mouseX < 260 && mouseY < 450;

  if (naZonaPintura && !noPainelLateral) { // Se o rato estiver na zona de pintura (acima da madeira)
    noCursor(); // Esconde o ponteiro padrão do sistema operativo
    push(); // Inicia estilo do cursor
    stroke(isDarkCanvas ? 255 : 0, 150); strokeWeight(1); // Define contorno visível conforme o tema
    if (isEraser) fill(255, 50); // Se borracha, cursor fica branco semitransparente
    else fill(red(selectedColor), green(selectedColor), blue(selectedColor), 100); // Se pincel, assume a cor atual
    ellipse(mouseX, mouseY, brushSize * 2); // Desenha o círculo que representa o diâmetro do pincel
    fill(isDarkCanvas ? 255 : 0); noStroke(); ellipse(mouseX, mouseY, 2); // Desenha um ponto central de precisão
    pop(); // Restaura estilo
  } else { cursor(ARROW); } // Se o rato estiver na zona dos menus ou madeira, mostra o ponteiro normal
}

function windowResized() { // Função do p5.js chamada quando o utilizador redimensiona a janela
  let imgTemp = camadaDesenho.get(); // Guarda uma cópia temporária do desenho atual
  resizeCanvas(windowWidth, windowHeight); // Ajusta o tamanho do canvas principal
  let novaCamada = createGraphics(windowWidth, windowHeight); // Cria uma nova camada com o novo tamanho
  novaCamada.clear(); // Limpa a nova camada
  novaCamada.image(imgTemp, 0, 0); // Desenha a imagem antiga na nova camada para não perder o progresso
  camadaDesenho = novaCamada; // Substitui a camada antiga pela nova
  if (undoStack.length > 0) undoStack[undoStack.length - 1] = camadaDesenho.get(); // Atualiza o último estado no histórico
  salvarDesenho(); // Guarda as novas dimensões e dados
}