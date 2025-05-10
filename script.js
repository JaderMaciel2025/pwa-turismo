const dadosMock = [
  {
    nome: "Parque dos Anjos",
    descricao: "Parque arborizado com trilhas e lazer.",
    localizacao: [-29.9344, -51.0204],
    whatsapp: "https://wa.me/555199999999"
  },
  {
    nome: "Café da Praça",
    descricao: "Café charmoso no centro da cidade.",
    localizacao: [-29.9390, -51.0272],
    whatsapp: "https://wa.me/555198888888"
  }
];

const map = L.map('map').setView([-29.935, -51.02], 13);

// Mapa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Geolocalização do usuário
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    function(pos) {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      L.circleMarker([lat, lon], {
        radius: 8,
        color: 'blue',
        fillColor: '#30f',
        fillOpacity: 0.8
      }).addTo(map).bindPopup("Você está aqui");

      map.setView([lat, lon], 14);
    },
    function(err) {
      console.warn("Erro na geolocalização: ", err.message);
    }
  );
}

function buscar() {
  const termo = document.getElementById("busca").value.toLowerCase();
  const container = document.getElementById("resultados");
  container.innerHTML = "";

  // Remove marcadores antigos (menos o ponto do usuário)
  map.eachLayer(layer => {
    if (layer instanceof L.Marker && !layer._popup?._content?.includes("Você está aqui")) {
      map.removeLayer(layer);
    }
  });

  const resultados = dadosMock.filter(item =>
    item.nome.toLowerCase().includes(termo) || item.descricao.toLowerCase().includes(termo)
  );

  if (resultados.length === 0) {
    container.innerHTML = "<p>Nenhum resultado encontrado.</p>";
    return;
  }

  resultados.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${item.nome}</h3>
      <p>${item.descricao}</p>
      <a href="${item.whatsapp}" target="_blank">📲 WhatsApp</a>
      <br>
      <a href="https://www.google.com/maps/dir/?api=1&destination=${item.localizacao[0]},${item.localizacao[1]}" target="_blank">🗺️ Como chegar</a>
      <br>
      <button onclick="favoritar('${item.nome}')">⭐ Favoritar</button>
    `;
    container.appendChild(card);

    L.marker(item.localizacao).addTo(map)
      .bindPopup(`<b>${item.nome}</b><br>${item.descricao}`);
  });
}

// Favoritar locais
function favoritar(nome) {
  let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
  if (!favoritos.includes(nome)) {
    favoritos.push(nome);
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    alert(`${nome} foi adicionado aos seus favoritos!`);
  } else {
    alert(`${nome} já está nos seus favoritos.`);
  }
}

// Busca por voz
function vozBuscar() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Busca por voz não suportada neste navegador.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.start();

  recognition.onresult = function(event) {
    const resultado = event.results[0][0].transcript;
    document.getElementById("busca").value = resultado;
    buscar();
  };

  recognition.onerror = function(event) {
    alert("Erro no reconhecimento de voz: " + event.error);
  };
}

// Exibir favoritos
function exibirFavoritos() {
  const favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
  if (favoritos.length === 0) {
    alert("Você ainda não tem favoritos.");
    return;
  }

  const container = document.getElementById("resultados");
  container.innerHTML = "<h2>Favoritos</h2>";

  favoritos.forEach(favorito => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>${favorito}</h3>`;
    container.appendChild(card);
  });
}

// Histórico de buscas
function salvarHistorico(busca) {
  let historico = JSON.parse(localStorage.getItem("historico")) || [];
  if (!historico.includes(busca)) {
    historico.push(busca);
    localStorage.setItem("historico", JSON.stringify(historico));
  }
}

function mostrarHistorico() {
  const historico = JSON.parse(localStorage.getItem("historico")) || [];
  const container = document.getElementById("resultados");
  container.innerHTML = "<h2>Histórico de Buscas</h2>";

  historico.forEach(busca => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>${busca}</h3>`;
    container.appendChild(card);
  });
}

// Exibir locais mais próximos (distância)
function exibirLocaisProximos(lat, lon) {
  const locais = dadosMock.map(item => {
    const distancia = calcularDistancia(lat, lon, item.localizacao[0], item.localizacao[1]);
    return { ...item, distancia };
  });

  locais.sort((a, b) => a.distancia - b.distancia);

  // Exibir resultados
  const container = document.getElementById("resultados");
  container.innerHTML = "";

  locais.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${item.nome}</h3>
      <p>${item.descricao}</p>
      <p>Distância: ${item.distancia.toFixed(2)} km</p>
      <a href="${item.whatsapp}" target="_blank">📲 WhatsApp</a>
      <br>
      <a href="https://www.google.com/maps/dir/?api=1&destination=${item.localizacao[0]},${item.localizacao[1]}" target="_blank">🗺️ Como chegar</a>
    `;
    container.appendChild(card);
  });
}

// Calcular distância entre dois pontos
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distancia = R * c;
  return distancia;
}
