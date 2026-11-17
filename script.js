// ===== 1. Корзина (localStorage) =====
let cart = JSON.parse(localStorage.getItem('coolcar_cart')) || [];

function saveCart() {
    localStorage.setItem('coolcar_cart', JSON.stringify(cart));
}

function addToCart(product) {
    cart.push(product);
    saveCart();
    updateCartUI();
}

function updateCartUI() {
    const counter = document.getElementById('cart-counter');
    if (counter) {
        counter.textContent = cart.length;
        counter.style.display = cart.length > 0 ? 'inline-block' : 'none';
    }

    const cartList = document.getElementById('cart-list') || document.querySelector('.cart-list');
    if (cartList) {
        cartList.innerHTML = '';
        let total = 0;
        
        if (cart.length === 0) {
            cartList.innerHTML = '<p style="text-align:center; padding: 20px;">Корзина пуста</p>';
        } else {
            cart.forEach((item, index) => {
                total += item.price;
                const article = document.createElement('article');
                article.className = 'cart-item';
                article.innerHTML = `
                    <img src="${item.img}" alt="${item.name}" class="cart-img">
                    <div style="flex:1;">
                        <h3>${item.name}</h3>
                        <p>${item.price} ₽</p>
                    </div>
                    <button class="btn-remove" data-index="${index}">Удалить</button>
                `;
                cartList.appendChild(article);
            });
        }

        const totalEl = document.getElementById('total-sum') || document.querySelector('.total-sum');
        if (totalEl) totalEl.textContent = `${total.toLocaleString('ru-RU')} ₽`;

        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                cart.splice(idx, 1);
                saveCart();
                updateCartUI();
            });
        });
    }
}

function initAddToCart() {
    const buttons = document.querySelectorAll('.btn-add[data-add]');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.card') || btn.closest('.product-page');
            if (!card) return;
            
            const nameEl = card.querySelector('h3, h1');
            const priceEl = card.querySelector('.price, .price-big');
            const imgEl = card.querySelector('img');
            
            if (!nameEl || !priceEl || !imgEl) return;

            const name = nameEl.textContent;
            const price = parseInt(priceEl.textContent.replace(/\D/g, ''));
            const img = imgEl.src;

            addToCart({ name, price, img });
            
            btn.textContent = '✓ Добавлено';
            btn.disabled = true;
            setTimeout(() => {
                btn.textContent = 'В корзину';
                btn.disabled = false;
            }, 1500);
        });
    });
}

// ===== 2. Оформление заказа (имитация) =====
function initCheckout() {
    const checkoutBtn = document.querySelector('.btn-order');
    if (!checkoutBtn) return;

    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Ваша корзина пуста. Добавьте товары перед оформлением заказа.');
            return;
        }

        const confirmOrder = confirm('Вы уверены, что хотите оформить заказ?');
        if (confirmOrder) {
            cart = [];
            saveCart();
            updateCartUI();
            alert('✓ Заказ успешно оформлен! Наш менеджер свяжется с вами.');
        }
    });
}

// ===== 3. Мобильное меню =====
function initMobileMenu() {
    const menuBtn = document.querySelector('.menu-btn');
    const nav = document.querySelector('.main-nav');
    
    if (!menuBtn || !nav) return;

    menuBtn.addEventListener('click', () => {
        nav.classList.toggle('nav-open');
    });
}

// ===== 4. Фильтры каталога (с сохранением) =====
function initCatalogFilter() {
    const filterBrand = document.getElementById('filter-brand');
    const filterModel = document.getElementById('filter-model');
    const filterYear  = document.getElementById('filter-year');
    const searchInput = document.getElementById('search-input');
    const cards       = document.querySelectorAll('.card[data-brand]');
    const resultCount = document.getElementById('result-count');

    if (!filterBrand) return;

    function applyFilters() {
        const brand  = filterBrand.value.toLowerCase();
        const model  = filterModel.value.toLowerCase();
        const year   = filterYear.value;
        const search = searchInput.value.toLowerCase().trim();
        let visible = 0;

        cards.forEach(card => {
            const cardBrand = (card.dataset.brand || '').toLowerCase();
            const cardModel = (card.dataset.model || '').toLowerCase();
            const cardYear  = card.dataset.year || '';
            const cardTitle = card.querySelector('h3').textContent.toLowerCase();

            const brandOk  = !brand || brand === 'любая' || cardBrand === brand;
            const modelOk  = !model || model === 'любая' || cardModel === model;
            const yearOk   = !year  || year  === 'любой' || cardYear === year;
            const searchOk = !search || cardTitle.includes(search);

            if (brandOk && modelOk && yearOk && searchOk) {
                card.style.display = '';
                visible++;
            } else {
                card.style.display = 'none';
            }
        });

        if (resultCount) {
            resultCount.textContent = `Найдено товаров: ${visible}`;
        }
        saveFilters();
    }

    filterBrand.addEventListener('change', applyFilters);
    filterModel.addEventListener('change', applyFilters);
    filterYear.addEventListener('change', applyFilters);
    searchInput.addEventListener('input', applyFilters);

    loadFilters();
    applyFilters();
}

function saveFilters() {
    const filters = {
        brand: document.getElementById('filter-brand')?.value || '',
        model: document.getElementById('filter-model')?.value || '',
        year: document.getElementById('filter-year')?.value || '',
        search: document.getElementById('search-input')?.value || ''
    };
    localStorage.setItem('coolcar_filters', JSON.stringify(filters));
}

function loadFilters() {
    const saved = localStorage.getItem('coolcar_filters');
    if (!saved) return;
    const filters = JSON.parse(saved);
    if (document.getElementById('filter-brand')) document.getElementById('filter-brand').value = filters.brand;
    if (document.getElementById('filter-model')) document.getElementById('filter-model').value = filters.model;
    if (document.getElementById('filter-year')) document.getElementById('filter-year').value = filters.year;
    if (document.getElementById('search-input')) document.getElementById('search-input').value = filters.search;
}

// ===== 5. Динамическая загрузка каталога =====
async function loadCatalogFromJSON() {
    const container = document.getElementById('catalog-cards');
    if (!container) return;

    container.innerHTML = '<p class="loading">Загрузка каталога…</p>';

    try {
        const response = await fetch('products.json');
        if (!response.ok) throw new Error('Не удалось загрузить products.json');
        const products = await response.json();

        container.innerHTML = '';

        products.forEach(product => {
            const article = document.createElement('article');
            article.className = 'card';
            article.dataset.brand = product.brand;
            article.dataset.model = product.model;
            article.dataset.year = product.year;

            article.innerHTML = `
                <img src="${product.img}" alt="${product.alt}" class="card-photo">
                <h3>${product.name}</h3>
                <p class="price">${product.price.toLocaleString('ru-RU')} ₽</p>
                <button class="btn-add" data-add>В корзину</button>
            `;

            container.appendChild(article);
        });

        initCatalogFilter();
        initAddToCart();
        updateCartUI();
    } catch (error) {
        container.innerHTML = `
            <p class="error">Не удалось загрузить каталог. Проверьте соединение.</p>
            <button class="btn-card" onclick="loadCatalogFromJSON()">Попробовать снова</button>
        `;
        console.error('Ошибка загрузки каталога:', error);
    }
}

// ===== 6. Форма обратной связи =====
function initFeedbackForm() {
    const form = document.getElementById('feedback-form');
    if (!form) return;

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        let isValid = true;

        const name = form.name.value.trim();
        const nameError = document.getElementById('name-error');
        if (name.length < 2) {
            nameError.textContent = 'Имя должно содержать не меньше 2 символов';
            isValid = false;
        } else {
            nameError.textContent = '';
        }

        const email = form.email.value.trim();
        const emailError = document.getElementById('email-error');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            emailError.textContent = 'Введите корректный email, например name@mail.ru';
            isValid = false;
        } else {
            emailError.textContent = '';
        }

        const message = form.message.value.trim();
        const messageError = document.getElementById('message-error');
        if (message.length < 10) {
            messageError.textContent = 'Сообщение должно содержать не меньше 10 символов';
            isValid = false;
        } else {
            messageError.textContent = '';
        }

        if (isValid) {
            form.reset();
            document.getElementById('form-success').textContent = '✓ Сообщение отправлено!';
            setTimeout(() => {
                document.getElementById('form-success').textContent = '';
            }, 3000);
        }
    });
}

function initLiveValidation() {
    const form = document.getElementById('feedback-form');
    if (!form) return;

    form.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => {
            const errorSpan = document.getElementById(input.name + '-error');
            if (errorSpan) errorSpan.textContent = '';
        });
    });
}

// ===== 7. API курсов валют =====
async function loadCurrencyRates() {
    const container = document.getElementById('currency-rates');
    if (!container) return;

    container.innerHTML = '<p class="loading">Загрузка курсов валют…</p>';

    try {
        const response = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
        if (!response.ok) {
            throw new Error(`Сервер ответил: ${response.status}`);
        }
        const data = await response.json();

        const usd = data.Valute.USD.Value.toFixed(2);
        const eur = data.Valute.EUR.Value.toFixed(2);
        const date = new Date(data.Date).toLocaleDateString('ru-RU');

        container.innerHTML = `
            <h2>Курсы валют ЦБ РФ</h2>
            <p>На дату: ${date}</p>
            <ul class="rates-list">
                <li><span>1 USD</span> <span>${usd} ₽</span></li>
                <li><span>1 EUR</span> <span>${eur} ₽</span></li>
            </ul>
        `;
    } catch (error) {
        container.innerHTML = `
            <p class="error">Не удалось загрузить курсы валют. Проверьте соединение с интернетом.</p>
            <button class="btn-card" onclick="loadCurrencyRates()">Попробовать снова</button>
        `;
        console.error('Ошибка загрузки курсов:', error);
    }
}

async function convertProductPrice() {
    const priceEl = document.getElementById('product-price');
    const resultEl = document.getElementById('price-converted');
    if (!priceEl || !resultEl) return;

    const priceInRub = parseInt(priceEl.dataset.rub, 10);
    if (!priceInRub) return;

    resultEl.textContent = 'Загрузка курса…';

    try {
        const response = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        const usdRate = data.Valute.USD.Value;
        const priceUsd = (priceInRub / usdRate).toFixed(2);
        resultEl.textContent = `≈ ${priceUsd} $ по курсу ЦБ РФ`;
    } catch (error) {
        resultEl.textContent = 'Не удалось получить курс валют';
        console.error(error);
    }
}

// ===== 8. Запуск =====
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('catalog-cards')) {
        loadCatalogFromJSON();
    } else {
        initCatalogFilter();
        initAddToCart();
    }

    updateCartUI();
    initCheckout();
    initMobileMenu(); // Инициализация мобильного меню
    initFeedbackForm();
    initLiveValidation();
    loadCurrencyRates();
    convertProductPrice();
});