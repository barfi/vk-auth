const APP_ID = 54424691;
const REDIRECT_URI = 'https://barfi.github.io/vk-auth/redirect.html';

const btnEl = document.getElementById('btn');
const preEl = document.getElementById('pre');

function wait(delayMs) {
    return new Promise(resolve => setTimeout(resolve, delayMs));
}

async function getPKCE() {
    const verifier = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
    const encoder = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', encoder.encode(verifier));
    const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return { verifier, challenge };
}

async function getAuthLink() {
    await wait(2000); // server request delay imitation

    const pkce = await getPKCE();
    const state = Math.random().toString(36).substring(2, 12);

    const url = new URL('https://id.vk.com/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', `${APP_ID}`);
    url.searchParams.set('redirect_uri', REDIRECT_URI);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', pkce.challenge);
    url.searchParams.set('code_challenge_method', 's256');

    // Добавляем vkid.personal_info для получения расширенных данных
    url.searchParams.set('scope', 'email vkid.personal_info');

    return url.toString();
}

btnEl.addEventListener('click', async (e) => {
    if (e.target.classList.contains('loading')) {
        return;
    }

    e.target.classList.add('loading');

    // 1. Делаем запрос на backend за ссылкой
    preEl.innerText = 'Get auth link from backend...';

    const link = await getAuthLink();

    preEl.innerText = link;

    // 2. Открываем дочернее окно с полученной ссылкой
    const width = 600, height = 500;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    await wait(2000);

    const popup = window.open(link, 'vk_auth', `width=${width},height=${height},top=${top},left=${left}`);

    // 3. Слушаем сообщение от дочернего окна
    window.addEventListener('message', function(event) {
        if (event.origin !== window.location.origin) {
            return; // if other domain
        }

        if (event.data.type === 'VK_AUTH_SUCCESS') {
            console.log('Код авторизации получен:', event.data.code);
            popup.close();
        }
    }, { once: true });
});