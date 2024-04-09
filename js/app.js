$(document).ready(() => {
    $(".btn-prev-none").on("click", (e) => {
        e.preventDefault();
    });
    cardapio.eventos.init();
});

var cardapio = {};
var MEU_CARRINHO = [];
var MEU_ENDERECO = null;
var VALOR_CARRINHO = 0;
var VALOR_ENTREGA = 5;
var CELULAR_EMPRESA = '5599000000000';

cardapio.eventos = {
    init: () => {
        cardapio.metodos.obterItensCardapio();
        cardapio.metodos.carregarBotãoReserva();
        cardapio.metodos.carregarBotaoLigar();
        cardapio.metodos.scrollToSection();
    },
}

cardapio.metodos = {
    // Obtem a lista de itens do cardápio
    obterItensCardapio: (categoria = 'burgers', vermais = false) => {
        var filtro = MENU[categoria];

        if (!vermais) {
            $("#itensCardapio").html('');
            $("#btnVerMais").removeClass('hidden');
        }

        $.each(filtro, (i, e) => {
            let temp = cardapio.templates.item
            .replace(/\${img}/g, e.img)
            .replace(/\${name}/g, e.name)
            .replace(/\${price}/g, e.price.toFixed(2).replace('.', ','))
            .replace(/\${id}/g, e.id);
            // Botão ver mais foi clicado (12 itens)
            if(vermais && i >= 8 && i < 12) {
                $("#itensCardapio").append(temp);
            }
            // Paginação inicial (8 itens)
            if (!vermais && i < 8) {
                $("#itensCardapio").append(temp);
            }
        });
        // Remove todos os estados ativos das listas
        $(".btn-prev-none").removeClass("active");
        // Adiciona, no menu clicado, o estado ativo referente
        $("#menu-" + categoria).addClass("active");
    },

    // Clique no botão de ver mais
    verMais: () => {
        var ativo = $(".container-menu a.active").attr('id').split('menu-')[1]; // split('menu-')[1] = [menu-][burgers] = [0][1] = [1](burgers)
        cardapio.metodos.obterItensCardapio(ativo, true);

        $("#btnVerMais").addClass('hidden');
    },
    
    // Diminuir a quantidade de item no cardápio
    diminuirQuantidade: (id) => {
        let qntdAtual = parseInt($("#qntd-" + id).text());
        if (qntdAtual > 0) {
            $("#qntd-" + id).text(qntdAtual - 1);
        }
    },

    // Aumentar a quantidade de item no cardápio
    aumentarQuantidade: (id) => {
        let qntdAtual = parseInt($("#qntd-" + id).text());
        $("#qntd-" + id).text(qntdAtual + 1);
    },

    // Adicionar ao carrinho o item do cardápio
    adicionarAoCarrinho: (id) => {
        let qntdAtual = parseInt($("#qntd-" + id).text());
        if(qntdAtual > 0) {
            // Obter a categoria ativa
            var categoria = $(".container-menu a.active").attr('id').split('menu-')[1]; // split('menu-')[1] = [menu-][burgers] = [0][1] = [1](burgers)
            // Obtem a lista de itens
            let filtro = MENU[categoria];
            // Obtem o item
            let item = $.grep(filtro, (e, i) => {
                return e.id == id
            });
            if(item.length > 0) {
                // Validar se já existe este item no carrinho
                let existe = $.grep(MEU_CARRINHO, (e, i) => {
                    return e.id == id;
                });
                // Caso já exista o item no carrinho, só altera a quantidade
                if(existe.length > 0) {
                    let objIndex = MEU_CARRINHO.findIndex((obj => obj.id == id));
                    MEU_CARRINHO[objIndex].qntd = MEU_CARRINHO[objIndex].qntd + qntdAtual;
                } 
                // Caso exista o item no carrinho, adiciona ele
                else {
                    item[0].qntd = qntdAtual;
                    MEU_CARRINHO.push(item[0]);
                }
                cardapio.metodos.mensagem('Item adicionado ao carrinho!', 'green');
                $("#qntd-" + id).text(0);
                cardapio.metodos.atualizarBadgeTotal();
            }
        }
    },

    // Diminuir a quantidade do item no carrinho
    diminuirQuantidadeCarrinho: (id) => {
        let qntdAtual = parseInt($("#qntd-carrinho-" + id).text());
        if (qntdAtual > 1) {
            $("#qntd-carrinho-" + id).text(qntdAtual - 1);
            cardapio.metodos.atualizarCarrinho(id, qntdAtual - 1);
        } else {
           cardapio.metodos.removerItemCarrinho(id);
        }
    },

    // Aumenta a quantidade do item no carrinho
    aumentarQuantidadeCarrinho: (id) => {
        let qntdAtual = parseInt($("#qntd-carrinho-" + id).text());
        $("#qntd-carrinho-" + id).text(qntdAtual + 1);
        cardapio.metodos.atualizarCarrinho(id, qntdAtual + 1);
    },

    // Remove o item do carrinho (CTA) 
    removerItemCarrinho: (id) => {
        MEU_CARRINHO= $.grep(MEU_CARRINHO, (e, i) => { return e.id != id });
        cardapio.metodos.carregarCarrinho();
        // Atualiza o botão carrinho com a quantidade atualizada
        cardapio.metodos.atualizarBadgeTotal();
    },

    // Atualiza o carrinho com a quantidade atual
    atualizarCarrinho: (id, qntd) => {
        let objIndex = MEU_CARRINHO.findIndex((obj => obj.id == id));
        MEU_CARRINHO[objIndex].qntd = qntd;
        // Atualiza o botão carrinho com a quantidade atualizada
        cardapio.metodos.atualizarBadgeTotal();
        // Atualiza os valores (R$) totais do carrinho
        cardapio.metodos.carregarValores();
    },

    // Carrega os valores de subtotal, entrega e total
    carregarValores: () => {
        VALOR_CARRINHO = 0;
        $("#lblSubtotal").text('R$ 0,00');
        $("#lblValorEntrega").text('+ R$ 0,00');
        $("#lblValorTotal").text('R$ 0,00');

        $.each(MEU_CARRINHO, (i, e) => {
            VALOR_CARRINHO += parseFloat(e.price * e.qntd);
            if((i + 1) == MEU_CARRINHO.length) {
                $("#lblSubtotal").text(`R$ ${VALOR_CARRINHO.toFixed(2).replace('.', ',')}`);
                $("#lblValorEntrega").text(`+ R$ ${VALOR_ENTREGA.toFixed(2).replace('.', ',')}`);
                $("#lblValorTotal").text(`R$ ${(VALOR_CARRINHO + VALOR_ENTREGA).toFixed(2).replace('.', ',')}`);
            }
        })
    },

    // Atualiza o badge de totais dos botões meu carrinho
    atualizarBadgeTotal: () => {
        var total = 0;
        $.each(MEU_CARRINHO, (i, e) => {
            total += e.qntd;
        });
        if(total > 0) {
            $(".js-quant-button").removeClass('hidden');
        } else {
            $(".js-quant-button").addClass('hidden');
        }
        $(".badge-total-carrinho").html(total);
    },

    mensagem: (texto, cor = 'red', tempo = 3500) => {
        let id = Math.floor(Date.now() * Math.random()).toString();
        let msg = `<div id="msg-${id}" class="animated fadeInDown toast ${cor}">${texto}</div>`;
        $("#js-container-mensagens").append(msg);
        setTimeout(() => {
            $("#msg-" + id).removeClass('fadeInDown');
            $("#msg-" + id).addClass('fadeOutUp');
            setTimeout(() => {
                $("#msg-" + id).remove();
            }, 1200);
        }, tempo);
    },

    // Abrir a modal de carrinho
    abrirCarrinho: (abrir) => {
        if(abrir) {
            $("#modalCarrinho").removeClass('hidden');
            $("body").css('overflow-y', 'hidden');
            cardapio.metodos.carregarCarrinho();
        }
        else {
            $("#modalCarrinho").addClass('hidden');
            $("body").css('overflow-y', 'auto');
        }
    },

    // Altera os textos e exibe os botões das etapas
    carregarEtapa: (etapa) => {
        if(etapa == 1) {
            $("#lblTituloEtapa").text('Seu carrinho:');
            $("#itensCarrinho").removeClass('hidden');
            $("#localEntrega").addClass('hidden');
            $("#resumoCarrinho").addClass('hidden');
            $(".etapa").removeClass('active');
            $(".etapa-1").addClass('active');
            $("#btnEtapaPedido").removeClass('hidden');
            $("#btnEtapaEndereco").addClass('hidden');
            $("#btnEtapaResumo").addClass('hidden');
            $("#btnVoltar").addClass('hidden');
        }
        if(etapa == 2) {
            $("#lblTituloEtapa").text('Endereço de entrega:');
            $("#itensCarrinho").addClass('hidden');
            $("#localEntrega").removeClass('hidden');
            $("#resumoCarrinho").addClass('hidden');
            $(".etapa").removeClass('active');
            $(".etapa-1").addClass('active');
            $(".etapa-2").addClass('active');
            $("#btnEtapaPedido").addClass('hidden');
            $("#btnEtapaEndereco").removeClass('hidden');
            $("#btnEtapaResumo").addClass('hidden');
            $("#btnVoltar").removeClass('hidden');
        }
        if(etapa == 3) {
            $("#lblTituloEtapa").text('Resemo do pedido:');
            $("#itensCarrinho").addClass('hidden');
            $("#localEntrega").addClass('hidden');
            $("#resumoCarrinho").removeClass('hidden');
            $(".etapa").removeClass('active');
            $(".etapa-1").addClass('active');
            $(".etapa-2").addClass('active');
            $(".etapa-3").addClass('active');
            $("#btnEtapaPedido").addClass('hidden');
            $("#btnEtapaEndereco").addClass('hidden');
            $("#btnEtapaResumo").removeClass('hidden');
            $("#btnVoltar").removeClass('hidden');
        }
    },

    // Botão de voltar etapa
    voltarEtapa: () => {
        let etapa = $(".etapa.active").length;
        cardapio.metodos.carregarEtapa(etapa - 1);
    },

    // Carrega a lista de itens do carrinho
    carregarCarrinho: () => {
        cardapio.metodos.carregarEtapa(1);
        if(MEU_CARRINHO.length > 0) {
            $("#itensCarrinho").html('');
            $.each(MEU_CARRINHO, (i, e) => {
                let temp = cardapio.templates.itemCarrinho.replace(/\${img}/g, e.img)
                .replace(/\${name}/g, e.name)
                .replace(/\${price}/g, e.price.toFixed(2).replace('.', ','))
                .replace(/\${id}/g, e.id)
                .replace(/\${qntd}/g, e.qntd);

                $("#itensCarrinho").append(temp);
                // Último item
                if((i + 1) == MEU_CARRINHO.length) {
                    cardapio.metodos.carregarValores();
                }
            })
        } else {
            $("#itensCarrinho").html('<p class="carrinho-vazio"><i class="fa fa-shopping-bag"></i>Seu carrinho está vazio.</p>');
            // Atualiza os valores (R$) totais do carrinho
            cardapio.metodos.carregarValores();
        }
    },

    // Carregar a etapa enderecos
    carregarEndereco: () => {
        if (MEU_CARRINHO.length <= 0) {
            cardapio.metodos.mensagem('Seu carrinho está vazio.', 'red');
            return;
        }
        cardapio.metodos.carregarEtapa(2);
    },

    // API viaCEP
    buscarCep: () => {
        // Cria a variavel com o valor do cep
        let cep = $("#textCEP").val().trim().replace(/\D/g, '');
        // Verifica se o CEP possui o valor informado
        if(cep != '') {
            // Expressão regular para validar o CEP
            var validaCep = /^[0-9]{8}/;
            if(validaCep.test(cep)) {
                $.getJSON("https://viacep.com.br/ws/" + cep + "/json/?callback=?", (dados) => {
                    if(!("erro" in dados)) {
                        // Atualizar os campos com os valores retornados
                        $("#textEndereco").val(dados.logradouro);
                        $("#textBairro").val(dados.bairro);
                        $("#textCidade").val(dados.localidade);
                        $("#ddlUf").val(dados.uf);
                        $("#textNumero").focus();
                    } else {
                        cardapio.metodos.mensagem('CEP não encontrado. Preencha as informações novamente!', 'red');
                        $("#textEndereco").focus();
                    }
                })
            } else {
                cardapio.metodos.mensagem('Formato do CEP inválido', 'red');
                $("#textCEP").focus();
            }
        } else {
            cardapio.metodos.mensagem('Informe o CEP porfavor!', 'red');
            $("#textCEP").focus();
        }
    },

    // Validação antes de prosseguir para a etapa 3
    resumoPedidos: () => {
        let cep = $("#textCEP").val().trim();
        let endereco = $("#textEndereco").val().trim();
        let bairro = $("#textBairro").val().trim();
        let cidade = $("#textCidade").val().trim();
        let uf = $("#ddlUf").val().trim();
        let numero = $("#textNumero").val().trim();
        let complemento = $("#textComplemento").val().trim();
        if(cep.length <= 0) {
            cardapio.metodos.mensagem('Informe o CEP, porfavor!', 'red');
            $("#textCEP").focus();
            return;
        }
        if(endereco.length <= 0) {
            cardapio.metodos.mensagem('Informe o Endereço, porfavor!', 'red');
            $("#textEndereco").focus();
            return;
        }
        if(bairro.length <= 0) {
            cardapio.metodos.mensagem('Informe o Bairro, porfavor!', 'red');
            $("#textBairro").focus();
            return;
        }
        if(cidade.length <= 0) {
            cardapio.metodos.mensagem('Informe a Cidade, porfavor!', 'red');
            $("#textCidade").focus();
            return;
        }
        if(uf == '-1') {
            cardapio.metodos.mensagem('Informe o UF do seu estado, porfavor!', 'red');
            $("#ddlUf").focus();
            return;
        }
        if(numero.length <= 0) {
            cardapio.metodos.mensagem('Informe o Numero, porfavor!', 'red');
            $("#textNumero").focus();
            return;
        }

        MEU_ENDERECO = {
            cep: cep,
            endereco: endereco,
            bairro: bairro,
            cidade: cidade,
            uf: uf,
            numero: numero,
            complemento: complemento
        }
        cardapio.metodos.carregarEtapa(3);
        cardapio.metodos.carregarResumo();
    },

    // Carrega a etapa de resumo do pedido
    carregarResumo: () => {
        $("#listaItensResumo").html('');

        $.each(MEU_CARRINHO, (i, e) => {
            let temp = cardapio.templates.itemResumo.replace(/\${img}/g, e.img)
            .replace(/\${name}/g, e.name)
            .replace(/\${price}/g, e.price.toFixed(2).replace('.', ','))
            .replace(/\${qntd}/g, e.qntd);

            $("#listaItensResumo").append(temp);
        });

        $("#resumoEndereco").html(`${MEU_ENDERECO.endereco}, ${MEU_ENDERECO.numero}, ${MEU_ENDERECO.bairro}`);
        $("#cidadeEndereco").html(`${MEU_ENDERECO.cidade}-${MEU_ENDERECO.uf} / ${MEU_ENDERECO.cep} ${MEU_ENDERECO.complemento}`);
        cardapio.metodos.finalizarPedido();
    },

    // https://wa.me/5561998934229?text=Ola
    // Atualiza o link do botão do whatsapp
    finalizarPedido: () => {
        if (MEU_CARRINHO.length > 0 && MEU_ENDERECO != null) {
            var texto = 'Olá, gostaria de fazer um pedido:';
            texto += `\n*Itens do pedido:*\n\n\${itens}`;
            texto += '\n*Endereço de entrega:*';
            texto += `\n${MEU_ENDERECO.endereco}, ${MEU_ENDERECO.numero}, ${MEU_ENDERECO.bairro}`;
            texto += `\n${MEU_ENDERECO.cidade}-${MEU_ENDERECO.uf} / ${MEU_ENDERECO.cep} ${MEU_ENDERECO.complemento}`;
            texto += `\n\n*Total (com entrega): R$ ${(VALOR_CARRINHO + VALOR_ENTREGA).toFixed(2).replace('.', ',')}*`;
            var itens = '';
            $.each(MEU_CARRINHO, (i, e) => {
                itens += `*${e.qntd}x* ${e.name} ....... R$ ${e.price.toFixed(2).replace('.', ',')} \n`;
                if(i + 1 == MEU_CARRINHO.length) {
                    texto = texto.replace(/\${itens}/g, itens);
                    // Converte a URL
                    let encode = encodeURI(texto);
                    let URL = `https://wa.me/${CELULAR_EMPRESA}?text=${encode}`;
                    $("#btnEtapaResumo").attr('href', URL);
                }
            })
        }
    },

    // Carrega o link do botão reserva
    carregarBotãoReserva: () => {
        var texto = 'Olá! gostaria de fazer uma *reserva*';
        let encode = encodeURI(texto);
        let URL = `https://wa.me/${CELULAR_EMPRESA}?text=${encode}`;
        $("#btnReserva").attr('href', URL);
    },

    // Carrega o botão de ligar
    carregarBotaoLigar: () => {
        if($(window).width() <= 800) {
            $("#btnLigar").attr('href', `tel:${CELULAR_EMPRESA}`);
        } else {
            var texto = 'Olá! gostaria de falar com um atendente.';
            let encode = encodeURI(texto);
            let URL = `https://wa.me/${CELULAR_EMPRESA}?text=${encode}`;
            $("#btnLigar").attr('href', URL);
        }
    },

    // Função de slide dos depoimentos
    abrirDepoimento: (depoimento) => {
        $(".depoimento").addClass('hidden');
        $(".btn-depoimento").removeClass('active');
        $("#depoimento-" + depoimento).removeClass('hidden');
        $("#btnDepoimento-" + depoimento).addClass('active');
    },

    scrollToSection: () => {
        // Efeito global de scrollDown
        $('a[href^="#"]').on('click', function (event) {
            let target = this.hash;
            console.log(target);
            let $target = $(target);
            // Velocidade da animação (em milissegundos)
            let animationSpeed = 1000;
            // Deslocamento vertical da animação (pode ajustar conforme necessário)
            let offset = 50;
            let calcPosition = $target.offset().top;
            $('html, body').animate({
                'scrollTop': calcPosition
            }, animationSpeed);
        });
    }
}

cardapio.templates = {
    item: `
    <div class="col-12 col-lg-3 col-md-6 col-sm-6 mb-4 wow fadeInUp">
        <div class="card card-item" id="\${id}">
            <div class="img-product">
                <img src="\${img}" alt="">
            </div>
            <div class="display-flex ml-4 ml-lg-0 ml-md-0 ml-sm-4 container-titles">
                <p class="title-product text-center mt-3"><b>\${name}</b></p>
                <p class="price-product text-center col-12"><b>R$ \${price}</b></p>
                <div class="add-cart">
                    <span class="btn-menos" onclick="cardapio.metodos.diminuirQuantidade('\${id}')">
                        <i class="fas fa-minus"></i>
                    </span>
                    <span class="add-number-itens" id="qntd-\${id}">0</span>
                    <span class="btn-mais" onclick="cardapio.metodos.aumentarQuantidade('\${id}')">
                        <i class="fas fa-plus"></i>
                    </span>
                    <span class="btn btn-add" onclick="cardapio.metodos.adicionarAoCarrinho('\${id}')">
                        <i class="fas fa-shopping-bag"></i>
                    </span>
                </div>
            </div>
        </div>
    </div>
    ` 
    ,

    itemCarrinho: `
    <div class="col-12 item-cart">
        <div class="img-product">
            <img src="\${img}" alt="">
        </div>
            <div class="container-mobile">
            <div class="dados-product">
                <p class="title-product"><b>\${name}</b></p>
                <p class="price-product"><b>R$ \${price}</b></p>
            </div>
            <div class="add-cart">
                <span class="btn-menos" onclick="cardapio.metodos.diminuirQuantidadeCarrinho('\${id}')">
                <i class="fas fa-minus"></i>
                </span>
                <span class="add-number-itens" id="qntd-carrinho-\${id}">\${qntd}</span>
                <span class="btn-mais" onclick="cardapio.metodos.aumentarQuantidadeCarrinho('\${id}')">
                    <i class="fas fa-plus"></i>
                </span>
                <span class="btn btn-remove" onclick="cardapio.metodos.removerItemCarrinho('\${id}')">
                    <i class="fas fa-times"></i>
                </span>
            </div>
        </div>
    </div>
    `
    ,

    itemResumo: `
    <div class="col-12 item-cart resumo">
        <div class="img-product-resumo">
            <img src="\${img}" alt="">
        </div>
        <div class="dados-product">
            <p class="title-product-resumo">
                <b>\${name}</b>
            </p>
            <p class="price-product-resumo">
                <b>R$ \${price}</b>
            </p>
        </div>
        <p class="quantidade-product-resumo">
            x<b>\${qntd}</b>
        </p>
    </div>
    `
}