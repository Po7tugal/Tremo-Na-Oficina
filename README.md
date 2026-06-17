Tremo na Oficina

Um jogo de palavras inspirado no Wordle, mas jogado com as mãos: em vez de teclares as letras, fazes os gestos do Alfabeto Manual da Língua Gestual Portuguesa (LGP) em frente à webcam, e o jogo reconhece-os em tempo real.

O nome do projeto é também uma homenagem à comunidade surda e à ideia de "soletrar com as mãos".

Como funciona

A webcam capta a tua mão e o MediaPipe Hand Landmarker deteta 21 pontos-chave (nós dos dedos, pulso, palma). Esses pontos são analisados por um conjunto de regras geométricas próprias (ângulos entre falanges, distâncias normalizadas pelo tamanho da palma) que tentam reconhecer qual letra do alfabeto manual LGP estás a fazer.

Quando o gesto é mantido de forma consistente durante algum tempo, a letra é aceite e adicionada à palavra atual — tal como primir uma tecla. Há também gestos dedicados para confirmar a palavra (ENTER) e apagar a última letra (BACKSPACE).

O resto joga-se como um Wordle normal: tens um número limitado de tentativas para adivinhar uma palavra de 5 letras em português, com feedback de letra correta, letra na palavra mas posição errada, e letra ausente.

Funcionalidades


Reconhecimento de gestos em tempo real via webcam, sem servidor (tudo corre no browser).
Painel de referência com o alfabeto manual completo (A–Z, mais ENTER e BACKSPACE), que destaca a letra detetada no momento.
Banco de palavras em português de Portugal, organizado por temas (natureza, animais, corpo, casa e objetos, ações, entre outros).
Modo de alto contraste para acessibilidade visual.
Feedback sonoro (texto-para-fala) a anunciar letras detetadas, resultados de tentativas, vitória e derrota — pensado para quem não consegue confirmar visualmente o ecrã enquanto faz o gesto.
Suporte a leitores de ecrã (aria-live, role="status", skip link para o conteúdo principal).


Stack técnica

CamadaTecnologiaUIReact 18Build / dev serverVite 5Deteção de mãos@mediapipe/tasks-vision (HandLandmarker)EstiloCSS puro, com tokens em variáveis CSS (src/styles/global.css)VozWeb Speech API (texto-para-fala do browser)

Não há backend: o jogo corre inteiramente no browser, incluindo o modelo de deteção de gestos.

Estrutura do projeto

src/
├── App.jsx                  # Composição principal da página e estado de alto nível
├── main.jsx                 # Ponto de entrada — monta o React e importa o CSS global
├── components/
│   ├── Header.jsx            # Cabeçalho com título, alto contraste e "novo jogo"
│   ├── WebcamView.jsx         # Vídeo da câmara + overlay de deteção
│   ├── GameBoard.jsx          # Tabuleiro do Wordle (linhas e letras)
│   └── SignReference.jsx      # Painel A–Z com a descrição de cada gesto
├── hooks/
│   ├── useWebcam.js           # Acesso à câmara e ciclo de deteção
│   └── useGameLogic.js        # Estado do jogo: tentativas, validação, mensagens
├── utils/
│   ├── gestureRecognition.js  # Geometria da mão → letra reconhecida
│   ├── gameLogic.js           # Regras do Wordle (avaliação de tentativas, etc.)
│   └── tts.js                 # Anúncios de voz (texto-para-fala)
├── data/
│   └── words.js               # Banco de palavras em português
└── styles/                    # CSS por área (tiles, webcam, header, referência...)

Pré-requisitos


Node.js 18 ou superior (recomenda-se a versão LTS mais recente).
Um browser com suporte a getUserMedia (Chrome, Edge ou Firefox recentes funcionam bem).
Uma webcam.


Como correr o projeto


Instala as dependências:


bash   npm install


Arranca o servidor de desenvolvimento:


bash   npm run dev


Abre o browser em http://localhost:3000 (o Vite tenta abrir automaticamente).
Quando o jogo pedir, autoriza o acesso à webcam — sem essa permissão a deteção de gestos não funciona.


Outros comandos disponíveis

bashnpm run build     # Gera a versão de produção em dist/
npm run preview   # Pré-visualiza a versão de produção localmente

Notas e limitações

A precisão do reconhecimento depende de boa iluminação e de a mão estar bem visível e centrada no enquadramento da câmara. Como o reconhecimento é feito por regras geométricas (e não por um modelo treinado especificamente para LGP), algumas letras com gestos visualmente próximos podem ocasionalmente ser confundidas — experimenta ajustar a distância à câmara e a orientação da mão se uma letra não estiver a ser reconhecida.

O jogo guarda todo o estado em memória; recarregar a página inicia uma palavra nova.