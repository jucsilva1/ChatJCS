const http = require("http");
const fs = require("fs");
const path = require("path");
const app = http.createServer(resposta);
const io = require("socket.io")(app);

const usuarios = {};
const ultimas_mensagens = [];

app.listen(3000);
console.log("Aplicação está em execução em http://localhost:3000");

// 🌐 Servidor HTTP para entregar index.html e arquivos da pasta /public
function resposta(req, res) {
  let arquivo = "";
  let urlRequisitada = req.url === "/" ? "/index.html" : req.url;
  let caminhoFinal = path.join(__dirname, "public", urlRequisitada);

  fs.readFile(caminhoFinal, function (err, data) {
    if (err) {
      res.writeHead(404);
      return res.end("Página ou arquivo não encontrados");
    }

    const ext = path.extname(caminhoFinal).toLowerCase();
    const mime = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".mp3": "audio/mpeg",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
    };

    const contentType = mime[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

// ⚡ Conexão com o Socket.IO
io.on("connection", function (socket) {
  socket.on("entrar", function (dados, callback) {
    const apelido = dados.apelido;
    const avatar = dados.avatar || "👤";

    if (!(apelido in usuarios)) {
      socket.apelido = apelido;
      socket.avatar = avatar;
      usuarios[apelido] = socket;

      // Histórico para novo usuário
      ultimas_mensagens.forEach((msg) => {
        socket.emit("atualizar mensagens", msg);
      });

      const mensagem = `[ ${pegarDataAtual()} ] ${avatar} ${apelido} entrou na sala`;
      const obj_mensagem = { msg: mensagem, tipo: "sistema" };

      io.sockets.emit("atualizar usuarios", Object.keys(usuarios));
      io.sockets.emit("atualizar mensagens", obj_mensagem);
      armazenaMensagem(obj_mensagem);

      callback(true);
    } else {
      callback(false);
    }
  });

  socket.on("enviar mensagem", function (dados, callback) {
    const destinatario = dados.usu || "";
    const texto = dados.msg;
    //const mensagem_formatada = `[ ${pegarDataAtual()} ] ${
    //socket.apelido
    //} diz: ${texto}`;
    const destino = destinatario === "" ? "para TODOS" : `para ${destinatario}`;
    const avatar = socket.avatar || "👤";
    const mensagem_formatada = `[ ${pegarDataAtual()} ] ${avatar} ${
      socket.apelido
    } diz ${destino}: ${texto}`;
    const obj_mensagem = {
      msg: mensagem_formatada,
      tipo: destinatario === "" ? "publica" : "privada",
    };

    if (destinatario === "") {
      io.sockets.emit("atualizar mensagens", obj_mensagem);
      armazenaMensagem(obj_mensagem);
    } else {
      socket.emit("atualizar mensagens", obj_mensagem);
      if (usuarios[destinatario]) {
        usuarios[destinatario].emit("atualizar mensagens", obj_mensagem);
      }
    }

    callback();
  });

  socket.on("disconnect", function () {
    if (socket.apelido) {
      delete usuarios[socket.apelido];

      const mensagem = `[ ${pegarDataAtual()} ] ${socket.apelido} saiu da sala`;
      const obj_mensagem = { msg: mensagem, tipo: "sistema" };

      io.sockets.emit("atualizar usuarios", Object.keys(usuarios));
      io.sockets.emit("atualizar mensagens", obj_mensagem);
      armazenaMensagem(obj_mensagem);
    }
  });
});

// 🕓 Data/hora formatada
function pegarDataAtual() {
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, "0");
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const ano = agora.getFullYear();
  const hora = String(agora.getHours()).padStart(2, "0");
  const minuto = String(agora.getMinutes()).padStart(2, "0");
  const segundo = String(agora.getSeconds()).padStart(2, "0");

  return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
}

// 💬 Histórico limitado a 5 mensagens
function armazenaMensagem(mensagem) {
  if (ultimas_mensagens.length >= 5) {
    ultimas_mensagens.shift();
  }
  ultimas_mensagens.push(mensagem);
}
