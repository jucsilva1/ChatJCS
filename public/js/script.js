// Conexão com o servidor via Socket.IO
var socket = io.connect();

// Envia a mensagem do chat
$("form#chat").submit(function (e) {
  e.preventDefault();

  var mensagem = $(this).find("#texto_mensagem").val();
  var usuarioSelecionado = $("#lista_usuarios").val();
  var usuario = Array.isArray(usuarioSelecionado)
    ? usuarioSelecionado[0] || ""
    : usuarioSelecionado;

  socket.emit("enviar mensagem", { msg: mensagem, usu: usuario }, function () {
    $("#texto_mensagem").val(""); // Limpa campo após envio
  });
});

// Recebe e exibe mensagens (públicas, privadas, sistema)
socket.on("atualizar mensagens", function (dados) {
  var tipo = dados.tipo || "publica";
  var mensagem_formatada = $("<p />").text(dados.msg).addClass(tipo);
  $("#historico_mensagens").append(mensagem_formatada);

  // 🔊 Som especial para mensagens privadas
  if (tipo === "privada") {
    const somPrivado = document.getElementById("som_mensagem_privada");
    if (somPrivado) somPrivado.play().catch(() => {});
  } else {
    // 🔊 Som geral para públicas e sistema
    const somPublico = document.getElementById("som_mensagem");
    if (somPublico) somPublico.play().catch(() => {});
  }

  // 📜 Scroll para o final
  $("#historico_mensagens").scrollTop(
    $("#historico_mensagens")[0].scrollHeight
  );
});

// Envia apelido no login
$("form#login").submit(function (e) {
  e.preventDefault();

  var apelido = $("#apelido").val();
  var avatar = $("#avatar").val();

  socket.emit(
    "entrar",
    { apelido: apelido, avatar: avatar },
    function (valido) {
      if (valido) {
        // Esconde a tela de login
        $("#acesso_usuario").hide();

        // Exibe a interface do chat
        $("#sala_chat").show();

        // ✅ Libera rolagem da página para permitir ver histórico e campo de envio
        $("body").css("overflow", "auto");

        // ✅ Atualiza o título da aba com o nome do usuário
        document.title = "ChatJCS - Adaptado " + apelido;

        // ✅ Exibe a identidade visual do usuário logado
        $("#identidade_usuario").text("Você está logado como: " + apelido);
      } else {
        // Limpa o campo de apelido e alerta usuário
        $("#apelido").val("");
        alert("Nome já utilizado nesta sala");
      }
    }
  );
});

// Atualiza a lista de usuários conectados
socket.on("atualizar usuarios", function (usuarios) {
  $("#lista_usuarios").empty();
  $("#lista_usuarios").append($("<option />").val("").text("TODOS")); // Corrige aspas quebradas

  $.each(usuarios, function (indice) {
    var apelido = usuarios[indice];
    var opcao_usuario = $("<option />").val(apelido).text(apelido);
    $("#lista_usuarios").append(opcao_usuario);
  });
});
