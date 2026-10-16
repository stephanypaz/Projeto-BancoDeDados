const clientForm = document.querySelector('#client-form');
const cardForm = document.querySelector('#card-form');
const clientResult = document.querySelector('#client-result');
const cardResult = document.querySelector('#card-result');
const cardsList = document.querySelector('#cards-list');
const lookupButton = document.querySelector('#lookup-button');

async function request(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options && options.headers),
    },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.erro || 'Não foi possível concluir a operação.');
  return result;
}

function showMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle('error', isError);
  element.hidden = false;
}

function setBusy(button, busy, label) {
  if (busy) {
    button.dataset.label = button.innerHTML;
    button.disabled = true;
    button.textContent = label;
  } else {
    button.innerHTML = button.dataset.label;
    button.disabled = false;
    delete button.dataset.label;
  }
}

async function loadCards(clienteId) {
  const cards = await request(`/api/cartoes/${encodeURIComponent(clienteId)}`);
  cardsList.replaceChildren();

  if (cards.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'form-hint';
    empty.textContent = 'Nenhum cartão cadastrado para este cliente.';
    cardsList.append(empty);
    return cards.length;
  }

  for (const card of cards) {
    const row = document.createElement('div');
    row.className = 'card-row';
    const number = document.createElement('span');
    number.className = 'card-number';
    number.textContent = card.numero_mascarado;
    const tag = document.createElement('span');
    tag.className = 'card-tag';
    tag.textContent = `Cartão #${card.id}`;
    row.append(number, tag);
    cardsList.append(row);
  }
  return cards.length;
}

clientForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = clientForm.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(clientForm));
  setBusy(button, true, 'Salvando...');
  clientResult.hidden = true;

  try {
    const client = await request('/api/cadastro', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    clientResult.replaceChildren();
    const message = document.createElement('strong');
    message.textContent = 'Cliente cadastrado com sucesso.';
    const id = document.createElement('div');
    id.className = 'result-id';
    id.textContent = `ID: ${client.id}`;
    clientResult.append(message, id);
    clientResult.classList.remove('error');
    clientResult.hidden = false;
    cardForm.elements.cliente_id.value = client.id;
    clientForm.reset();
  } catch (error) {
    showMessage(clientResult, error.message, true);
  } finally {
    setBusy(button, false);
  }
});

lookupButton.addEventListener('click', async () => {
  const clienteId = cardForm.elements.cliente_id.value.trim();
  cardsList.replaceChildren();
  if (!clienteId) {
    showMessage(cardResult, 'Informe o ID do cliente para consultar os cartões.', true);
    return;
  }
  setBusy(lookupButton, true, 'Consultando...');
  cardResult.hidden = true;

  try {
    const count = await loadCards(clienteId);
    showMessage(cardResult, `${count} cartão(ões) encontrado(s).`);
  } catch (error) {
    showMessage(cardResult, error.message, true);
  } finally {
    setBusy(lookupButton, false);
  }
});

cardForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = cardForm.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(cardForm));
  data.cliente_id = data.cliente_id.trim();
  setBusy(button, true, 'Salvando...');
  cardResult.hidden = true;

  try {
    const result = await request('/api/cartoes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    cardForm.elements.numero_cartao.value = '';
    await loadCards(data.cliente_id);
    showMessage(cardResult, `${result.mensagem}: ${result.cartao}`);
  } catch (error) {
    showMessage(cardResult, error.message, true);
  } finally {
    setBusy(button, false);
  }
});
