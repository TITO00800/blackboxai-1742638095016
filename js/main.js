// Funciones de manejo de archivos y subidas
function handleFileUpload(input, type) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Guardar en localStorage para demo
            const uploads = JSON.parse(localStorage.getItem('uploads') || '{}');
            if (!uploads[type]) uploads[type] = [];
            uploads[type].push({
                id: Date.now(),
                url: e.target.result,
                name: file.name,
                type: file.type,
                date: new Date().toISOString()
            });
            localStorage.setItem('uploads', JSON.stringify(uploads));
            
            // Actualizar UI
            updateUI(type);
        };
        reader.readAsDataURL(file);
    }
}

// Funciones de interacción social
function likePost(postId) {
    const posts = JSON.parse(localStorage.getItem('posts') || '{}');
    if (posts[postId]) {
        posts[postId].likes = (posts[postId].likes || 0) + 1;
        localStorage.setItem('posts', JSON.stringify(posts));
        updatePostUI(postId);
    }
}

function addComment(postId, comment) {
    const posts = JSON.parse(localStorage.getItem('posts') || '{}');
    if (posts[postId]) {
        if (!posts[postId].comments) posts[postId].comments = [];
        posts[postId].comments.push({
            id: Date.now(),
            text: comment,
            user: JSON.parse(localStorage.getItem('user')).username,
            date: new Date().toISOString()
        });
        localStorage.setItem('posts', JSON.stringify(posts));
        updatePostUI(postId);
    }
}

// Funciones de marketplace
function createProduct(data) {
    const products = JSON.parse(localStorage.getItem('products') || '{}');
    const productId = Date.now();
    const formData = new FormData(data);
    const images = [];

    // Manejar las imágenes subidas
    const imageFiles = formData.getAll('images');
    for (const file of imageFiles) {
        const reader = new FileReader();
        reader.onload = function(e) {
            images.push(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    // Crear el producto
    products[productId] = {
        id: productId,
        name: formData.get('name'),
        price: parseFloat(formData.get('price')),
        description: formData.get('description'),
        images: images,
        seller: JSON.parse(localStorage.getItem('user')).username,
        date: new Date().toISOString(),
        status: 'active',
        location: 'Madrid', // Demo location
        category: 'general'
    };

    localStorage.setItem('products', JSON.stringify(products));
    updateMarketplaceUI();
    return productId;
}

function buyProduct(productId) {
    const products = JSON.parse(localStorage.getItem('products') || '{}');
    const wallet = JSON.parse(localStorage.getItem('wallet') || '{}');
    const user = JSON.parse(localStorage.getItem('user'));

    if (products[productId] && wallet[user.username]) {
        const price = products[productId].price;
        if (wallet[user.username].balance >= price) {
            // Actualizar balance
            wallet[user.username].balance -= price;
            localStorage.setItem('wallet', JSON.stringify(wallet));

            // Actualizar estado del producto
            products[productId].status = 'sold';
            products[productId].buyer = user.username;
            localStorage.setItem('products', JSON.stringify(products));

            // Actualizar UI
            updateMarketplaceUI();
            updateWalletUI();
            return true;
        }
    }
    return false;
}

function filterProducts(filters) {
    const products = JSON.parse(localStorage.getItem('products') || '{}');
    return Object.values(products).filter(product => {
        let matches = true;
        if (filters.category && filters.category !== 'all') {
            matches = matches && product.category === filters.category;
        }
        if (filters.minPrice) {
            matches = matches && product.price >= filters.minPrice;
        }
        if (filters.maxPrice) {
            matches = matches && product.price <= filters.maxPrice;
        }
        if (filters.location && filters.location !== 'all') {
            matches = matches && product.location === filters.location;
        }
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            matches = matches && (
                product.name.toLowerCase().includes(searchLower) ||
                product.description.toLowerCase().includes(searchLower)
            );
        }
        return matches;
    });
}

function updateMarketplaceUI() {
    const productsGrid = document.getElementById('products-grid');
    const products = JSON.parse(localStorage.getItem('products') || '{}');
    
    if (productsGrid) {
        productsGrid.innerHTML = Object.values(products)
            .filter(product => product.status === 'active')
            .map(product => `
                <div class="bg-darker rounded-xl overflow-hidden hover-scale">
                    <div class="relative">
                        <img src="${product.images[0] || 'https://placehold.co/400x300'}" 
                            alt="${product.name}" 
                            class="w-full h-48 object-cover">
                        <span class="absolute top-2 right-2 bg-gold px-2 py-1 rounded text-dark text-xs">
                            <i class="fas fa-shield-alt mr-1"></i>Escrow
                        </span>
                    </div>
                    <div class="p-4">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="text-lg font-semibold">${product.name}</h3>
                            <span class="text-gold font-bold">${product.price} USDT</span>
                        </div>
                        <p class="text-gray-400 text-sm mb-4 line-clamp-2">${product.description}</p>
                        <div class="flex justify-between items-center">
                            <div class="flex items-center space-x-2">
                                <img src="https://placehold.co/32x32/1a1a1a/FFD700" 
                                    alt="${product.seller}" 
                                    class="w-8 h-8 rounded-full">
                                <span class="text-sm text-gray-300">${product.seller}</span>
                            </div>
                            <span class="text-sm text-gray-400">
                                <i class="fas fa-map-marker-alt mr-1"></i>${product.location}
                            </span>
                        </div>
                        <div class="flex space-x-2 mt-4">
                            <button onclick="buyProduct(${product.id})" 
                                class="flex-1 py-2 bg-gold text-dark rounded-lg hover:bg-gold-light font-medium">
                                <i class="fas fa-shopping-cart mr-1"></i>Comprar
                            </button>
                            <button class="px-4 py-2 border border-gold text-gold rounded-lg hover:bg-gold hover:text-dark">
                                <i class="fas fa-comment"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
    }

    // Actualizar contador de productos
    const productCount = document.querySelector('.product-count');
    if (productCount) {
        const activeProducts = Object.values(products).filter(p => p.status === 'active').length;
        productCount.textContent = `${activeProducts} productos`;
    }
}

// Funciones de P2P
function createP2POffer(data) {
    const offers = JSON.parse(localStorage.getItem('p2pOffers') || '{}');
    const offerId = Date.now();
    offers[offerId] = {
        ...data,
        id: offerId,
        creator: JSON.parse(localStorage.getItem('user')).username,
        date: new Date().toISOString(),
        status: 'active'
    };
    localStorage.setItem('p2pOffers', JSON.stringify(offers));
    updateP2PUI();
}

// Funciones de wallet
function updateWalletBalance(amount, type) {
    const user = JSON.parse(localStorage.getItem('user'));
    const wallet = JSON.parse(localStorage.getItem('wallet') || '{}');
    
    if (!wallet[user.username]) {
        wallet[user.username] = { balance: 1234.56 }; // Balance inicial demo
    }
    
    if (type === 'deposit') {
        wallet[user.username].balance += amount;
    } else if (type === 'withdraw') {
        wallet[user.username].balance -= amount;
    }
    
    localStorage.setItem('wallet', JSON.stringify(wallet));
    updateWalletUI();
}

// Funciones de actualización de UI
function updateUI(type) {
    switch(type) {
        case 'post':
            updateFeedUI();
            break;
        case 'product':
            updateMarketplaceUI();
            break;
        case 'story':
            updateStoriesUI();
            break;
    }
}

function updateFeedUI() {
    const posts = JSON.parse(localStorage.getItem('posts') || '{}');
    const feedContainer = document.querySelector('.posts');
    if (feedContainer) {
        // Implementar actualización del feed
    }
}

function updateMarketplaceUI() {
    const products = JSON.parse(localStorage.getItem('products') || '{}');
    const marketplaceContainer = document.querySelector('.products-grid');
    if (marketplaceContainer) {
        // Implementar actualización del marketplace
    }
}

function updateStoriesUI() {
    const stories = JSON.parse(localStorage.getItem('stories') || '{}');
    const storiesContainer = document.querySelector('.stories-container');
    if (storiesContainer) {
        // Implementar actualización de stories
    }
}

function updateWalletUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const wallet = JSON.parse(localStorage.getItem('wallet') || '{}');
    const balanceElement = document.querySelector('.wallet-balance');
    
    if (balanceElement && wallet[user.username]) {
        balanceElement.textContent = wallet[user.username].balance.toFixed(2) + ' USDT';
    }
}

// Emoji picker functionality
const emojis = ['😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤔', '😴', '😭', '😱', '🥳', '🎉', '💰', '🚀', '💎', '👍', '👏', '🙌', '🤝'];

function initEmojiPicker() {
    const emojiPicker = document.getElementById('emoji-picker');
    if (emojiPicker) {
        emojiPicker.innerHTML = emojis.map(emoji => 
            `<button type="button" class="emoji-btn p-1 hover:bg-dark rounded" onclick="insertEmoji('${emoji}')">${emoji}</button>`
        ).join('');
    }
}

function insertEmoji(emoji) {
    const textarea = document.querySelector('#create-post-form textarea');
    if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        textarea.value = text.substring(0, start) + emoji + text.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
    }
    document.getElementById('emoji-picker').classList.add('hidden');
}

// Image preview functionality
function handleImagePreview(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewContainer = document.getElementById('preview-container');
            const imagePreview = document.getElementById('image-preview');
            imagePreview.src = e.target.result;
            previewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function removePreview() {
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const fileInput = document.querySelector('input[type="file"][name="image"]');
    previewContainer.classList.add('hidden');
    imagePreview.src = '';
    fileInput.value = '';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.isLoggedIn) {
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('register.html')) {
            window.location.href = 'login.html';
        }
        return;
    }

    // Inicializar UI
    updateUI('post');
    updateUI('product');
    updateUI('story');
    updateWalletUI();

    // Initialize emoji picker
    initEmojiPicker();

    // Setup emoji picker toggle
    const emojiButton = document.getElementById('emoji-button');
    if (emojiButton) {
        emojiButton.addEventListener('click', function() {
            const picker = document.getElementById('emoji-picker');
            picker.classList.toggle('hidden');
        });
    }

    // Close emoji picker when clicking outside
    document.addEventListener('click', function(e) {
        const picker = document.getElementById('emoji-picker');
        const emojiButton = document.getElementById('emoji-button');
        if (picker && !picker.contains(e.target) && !emojiButton.contains(e.target)) {
            picker.classList.add('hidden');
        }
    });

    // Setup file upload listeners
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.name === 'image') {
                handleImagePreview(this);
            }
            handleFileUpload(this, this.dataset.type);
        });
    });

    // Setup post creation
    const postForm = document.querySelector('#create-post-form');
    if (postForm) {
        postForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const content = this.querySelector('textarea').value;
            const imageInput = this.querySelector('input[type="file"]');
            
            if (content || imageInput.files.length > 0) {
                handlePostCreation(content, imageInput.files[0]);
            }
        });
    }

    // Setup marketplace product creation
    const productForm = document.querySelector('#create-product-form');
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            createProduct(Object.fromEntries(formData));
        });
    }

    // Setup P2P offer creation
    const p2pForm = document.querySelector('#create-p2p-offer-form');
    if (p2pForm) {
        p2pForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            createP2POffer(Object.fromEntries(formData));
        });
    }
});

// Función para manejar la creación de posts
function handlePostCreation(content, image) {
    const posts = JSON.parse(localStorage.getItem('posts') || '{}');
    const postId = Date.now();
    
    const newPost = {
        id: postId,
        content: content,
        author: JSON.parse(localStorage.getItem('user')).username,
        date: new Date().toISOString(),
        likes: 0,
        comments: []
    };

    if (image) {
        const reader = new FileReader();
        reader.onload = function(e) {
            newPost.image = e.target.result;
            posts[postId] = newPost;
            localStorage.setItem('posts', JSON.stringify(posts));
            updateFeedUI();
        };
        reader.readAsDataURL(image);
    } else {
        posts[postId] = newPost;
        localStorage.setItem('posts', JSON.stringify(posts));
        updateFeedUI();
    }
}