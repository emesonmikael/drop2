// Configurações do Telegram
const telegramBotUsername = "@dropautentbot"; // Exemplo: @meubot



// Restante do código (conectar carteira, registrar usuário, etc.)...

// Configurações
const contractAddress = "0x0D47699aeeFA93Bf25daFd5eC8cC973Dd239C8a0"; // Substitua pelo endereço do seu contrato
const abi = [
    {
        "inputs": [
            {"internalType": "address", "name": "_tokenAddress", "type": "address"},
            {"internalType": "uint256", "name": "_referralReward", "type": "uint256"},
            {"internalType": "uint256", "name": "_referrerReward", "type": "uint256"}
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
            {"indexed": true, "internalType": "address", "name": "referrer", "type": "address"}
        ],
        "name": "Registered",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "referrerReward",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "contractBalance",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "_referrer", "type": "address"}],
        "name": "registerUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
        "name": "registerInitialUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_newReferralReward", "type": "uint256"}, {"internalType": "uint256", "name": "_newReferrerReward", "type": "uint256"}],
        "name": "setRewards",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "_referrer", "type": "address"}],
        "name": "getReferrals",
        "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
        "stateMutability": "view",
        "type": "function"
    }
];
const baseUrl = window.location.href; // URL base da plataforma
// Elementos da página
const connectWalletButton = document.getElementById("connectWallet");
const userInfo = document.getElementById("userInfo");
const userAddress = document.getElementById("userAddress");
const contractBalance = document.getElementById("contractBalance");
const referralLink = document.getElementById("referralLink");
const qrcodeElement = document.getElementById("qrcode");
const telegramVerification = document.getElementById("telegramVerification");
const verifyTelegramButton = document.getElementById("verifyTelegramButton");
const telegramStatus = document.getElementById("telegramStatus");
const loadingSpinner = document.getElementById("loadingSpinner");
const registerForm = document.getElementById("registerForm");
const referrerAddressInput = document.getElementById("referrerAddress");
const registerButton = document.getElementById("registerButton");
const totalReferralsElement = document.getElementById("totalReferrals");
const totalTokensEarnedElement = document.getElementById("totalTokensEarned");
const referralList = document.getElementById("referralList");
const exportButton = document.getElementById("exportButton");
const statusMessage = document.getElementById("statusMessage");

let web3;
let contract;
let userAccount;

// Função para verificar a associação no Telegram
async function verifyTelegramMembership(userId) {
    const url = `https://api.telegram.org/bot${telegramBotToken}/getChatMember?chat_id=${telegramGroupId}&user_id=${userId}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.ok && (data.result.status === "member" || data.result.status === "administrator" || data.result.status === "creator")) {
            telegramStatus.textContent = "Verificação bem-sucedida!";
            registerForm.classList.remove("hidden"); // Libera o formulário de registro
        } else {
            telegramStatus.textContent = "Você não é membro do grupo.";
        }
    } catch (error) {
        telegramStatus.textContent = "Erro ao verificar a associação.";
    }
}

// Redirecionar para o Telegram
verifyTelegramButton.addEventListener("click", () => {
    telegramStatus.textContent = "Redirecionando para o Telegram...";
    loadingSpinner.classList.remove("hidden");
    window.location.href = `https://t.me/${telegramBotUsername}?start=verify`;
});

// Capturar o ID do usuário e o token da URL
const urlParams = new URLSearchParams(window.location.search);
const telegramUserId = urlParams.get("telegram_user_id");
const token = urlParams.get("token");

if (telegramUserId && token) {
    loadingSpinner.classList.remove("hidden");
    telegramStatus.textContent = "Verificando token...";
    fetch(`https://drop2-theta.vercel.app/verify-token?userId=${telegramUserId}&token=${token}`)
        .then(response => response.json())
        .then(data => {
            loadingSpinner.classList.add("hidden");
            if (data.valid) {
                telegramStatus.textContent = "Token válido. Verificando associação...";
                verifyTelegramMembership(telegramUserId);
            } else {
                telegramStatus.textContent = "Token inválido.";
            }
        });
}

// Conectar à carteira
connectWalletButton.addEventListener("click", async () => {
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            web3 = new Web3(window.ethereum);
            const accounts = await web3.eth.getAccounts();
            userAccount = accounts[0];
            userAddress.textContent = userAccount;
            userInfo.classList.remove("hidden");

            // Mostrar a verificação do Telegram
            telegramVerification.classList.remove("hidden");

            // Inicializar contrato
            contract = new web3.eth.Contract(abi, contractAddress);

            // Atualizar saldo do contrato
            updateContractBalance();

            // Gerar link de referência e QR Code
            generateReferralLink(userAccount);

            // Carregar histórico de referências
            loadReferralHistory();

            // Carregar estatísticas de referências
            loadReferralStats();

            // Verificar se há um referenciador no link
            const referrerAddress = urlParams.get("ref");

            if (referrerAddress && web3.utils.isAddress(referrerAddress)) {
                referrerAddressInput.value = referrerAddress; // Preenche o campo automaticamente
                statusMessage.textContent = `Referenciador detectado: ${referrerAddress}`;
            }
        } catch (error) {
            statusMessage.textContent = "Erro ao conectar à carteira: " + error.message;
        }
    } else {
        statusMessage.textContent = "MetaMask não instalado!";
    }
});


// Atualizar saldo do contrato
async function updateContractBalance() {
    const balance = await contract.methods.contractBalance().call();
    contractBalance.textContent = web3.utils.fromWei(balance, "ether") + " tokens";
}

// Registrar usuário
registerButton.addEventListener("click", async () => {
    const referrerAddress = referrerAddressInput.value;
    if (!web3.utils.isAddress(referrerAddress)) {
        statusMessage.textContent = "Endereço do referenciador inválido!";
        return;
    }

    try {
        statusMessage.textContent = "Registrando...";
        await contract.methods.registerUser(referrerAddress).send({ from: userAccount });
        statusMessage.textContent = "Registrado com sucesso!";
        updateContractBalance();
        loadReferralHistory(); // Atualiza o histórico após o registro
        loadReferralStats(); // Atualiza as estatísticas após o registro
    } catch (error) {
        statusMessage.textContent = "Erro ao registrar: " + error.message;
    }
});

// Gerar link de referência
function generateReferralLink(userAddress) {
    const url = new URL(baseUrl);
    url.searchParams.set("ref", userAddress);
    referralLink.href = url.toString();
    referralLink.textContent = url.toString();
    generateQRCode(url.toString()); // Gera o QR Code
}

// Gerar QR Code
function generateQRCode(url) {
    qrcodeElement.innerHTML = ""; // Limpa o conteúdo anterior
    new QRCode(qrcodeElement, {
        text: url,
        width: 128,
        height: 128,
    });
}

// Função para buscar o valor de referrerReward do contrato
async function getReferrerReward() {
    return await contract.methods.referrerReward().call();
}

// Carregar histórico de referências
async function loadReferralHistory() {
    try {
        const referrals = await contract.methods.getReferrals(userAccount).call();
        referralList.innerHTML = ""; // Limpa a lista anterior

        if (referrals.length === 0) {
            referralList.innerHTML = "<li>Nenhum referenciado encontrado.</li>";
        } else {
            referrals.forEach((address) => {
                const listItem = document.createElement("li");
                listItem.textContent = address;
                referralList.appendChild(listItem);
            });
        }

        document.getElementById("referralHistory").classList.remove("hidden");
    } catch (error) {
        statusMessage.textContent = "Erro ao carregar histórico: " + error.message;
    }
}

// Carregar estatísticas de referências
async function loadReferralStats() {
    try {
        const referrals = await contract.methods.getReferrals(userAccount).call();
        const totalReferrals = referrals.length;

        // Busca o valor de referrerReward do contrato
        const referrerReward = await getReferrerReward();
        const totalTokensEarned = totalReferrals * referrerReward; // Calcula o total de tokens ganhos

        totalReferralsElement.textContent = totalReferrals;
        totalTokensEarnedElement.textContent = web3.utils.fromWei(totalTokensEarned.toString(), "ether") + " tokens";

        document.getElementById("referralStats").classList.remove("hidden");
    } catch (error) {
        statusMessage.textContent = "Erro ao carregar estatísticas: " + error.message;
    }
}

// Exportar histórico como CSV
function exportReferralHistory() {
    const referralListItems = referralList.children;
    if (referralListItems.length === 0) {
        statusMessage.textContent = "Nenhum dado para exportar.";
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Endereço\n"; // Cabeçalho do CSV
    Array.from(referralListItems).forEach((item) => {
        csvContent += item.textContent + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "historico_referencias.csv");
    document.body.appendChild(link);
    link.click(); // Dispara o download
}

// Adicionar evento ao botão de exportação
exportButton.addEventListener("click", exportReferralHistory);