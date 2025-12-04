// ====================
// INICIALIZACIÓN
// ====================
// NOTA: emailjs.init() ya se llamó en el HTML

document.addEventListener('DOMContentLoaded', function() {
    // Cargar carrito desde localStorage
    loadCart();
    
    // Configurar eventos
    setupEventListeners();
    
    // Inicializar carrusel
    initCarousel();
    
    // Configurar scroll del header
    setupHeaderScroll();
});

// ====================
// SISTEMA DE CARRITO
// ====================
let cart = [];

// Cargar carrito desde localStorage
function loadCart() {
    const savedCart = localStorage.getItem('kitchCrafterCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
}

// Guardar carrito en localStorage
function saveCart() {
    localStorage.setItem('kitchCrafterCart', JSON.stringify(cart));
    updateCartUI();
}

// Agregar producto al carrito
function addToCart(productId, productName, productPrice) {
    // Buscar si el producto ya está en el carrito
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            quantity: 1
        });
    }
    
    saveCart();
    showNotification('success', '✅ Producto agregado', `${productName} se agregó al carrito`);
}

// Remover producto del carrito
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    showNotification('info', '🗑️ Producto removido', 'El producto se eliminó del carrito');
}

// Actualizar cantidad de producto
function updateQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity < 1) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            saveCart();
        }
    }
}

// Calcular subtotal
function calculateSubtotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Calcular envío
function calculateShipping() {
    // Lógica básica: Q30 si no es Guatemala/Sacatepéquez
    return 0; // Gratis por defecto para Guatemala/Sacatepéquez
}

// Calcular total
function calculateTotal() {
    return calculateSubtotal() + calculateShipping();
}

// Vaciar carrito
function clearCart() {
    cart = [];
    saveCart();
    closeCartModal();
    showNotification('success', '🛒 Carrito vaciado', 'Todos los productos fueron removidos');
}

// ====================
// INTERFAZ DE CARRITO
// ====================
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartTotal = document.getElementById('cartTotal');
    const cartActions = document.getElementById('cartActions');
    const subtotalElem = document.getElementById('subtotal');
    const shippingElem = document.getElementById('shipping');
    const totalElem = document.getElementById('total');
    
    // ⭐⭐ VERIFICAR QUE LOS ELEMENTOS EXISTAN ⭐⭐
    if (!cartCount || !cartItems || !emptyCart || !cartTotal || !cartActions || !subtotalElem || !shippingElem || !totalElem) {
        console.error('❌ Error: No se encontraron elementos del carrito');
        return;
    }
    
    // Actualizar contador
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Mostrar/ocultar elementos según si hay productos
    if (cart.length === 0) {
        emptyCart.style.display = 'block';
        cartTotal.style.display = 'none';
        cartActions.style.display = 'none';
        cartItems.innerHTML = '';
        cartItems.appendChild(emptyCart);
    } else {
        emptyCart.style.display = 'none';
        cartTotal.style.display = 'block';
        cartActions.style.display = 'block';
        
        // Generar lista de productos
        cartItems.innerHTML = '';
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>Q${item.price.toFixed(2)} c/u</p>
                </div>
                <div class="cart-item-controls">
                    <button class="decrease-qty" data-id="${item.id}">-</button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button class="increase-qty" data-id="${item.id}">+</button>
                </div>
                <div class="cart-item-price">
                    Q${(item.price * item.quantity).toFixed(2)}
                </div>
            `;
            cartItems.appendChild(itemElement);
        });
        
        // Actualizar totales
        const subtotal = calculateSubtotal();
        const shipping = calculateShipping();
        const total = calculateTotal();
        
        subtotalElem.textContent = `Q${subtotal.toFixed(2)}`;
        shippingElem.textContent = shipping === 0 ? 'GRATIS' : `Q${shipping.toFixed(2)}`;
        totalElem.textContent = `Q${total.toFixed(2)}`;
    }
}


// ====================
// MODAL DE CARRITO
// ====================
function openCartModal() {
    document.getElementById('cartModal').classList.add('active');
    document.getElementById('cartOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCartModal() {
    document.getElementById('cartModal').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ====================
// NOTIFICACIONES
// ====================
function showNotification(type, title, message) {
    const notification = document.getElementById('notification');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    
    // Configurar tipo
    notification.className = 'notification';
    notification.classList.add(type);
    notification.classList.add('active');
    
    // Configurar icono según tipo
    const icon = notification.querySelector('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    
    // Configurar contenido
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    
    // Mostrar y ocultar automáticamente
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}

// ====================
// CHECKOUT Y EMAIL
// ====================
function generateOrderItemsHTML() {
    if (cart.length === 0) return '<p>No hay productos</p>';
    
    let html = '<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">';
    html += '<tr style="background: #f1f1f1; font-weight: bold;">';
    html += '<th style="padding: 10px; text-align: left;">Producto</th>';
    html += '<th style="padding: 10px; text-align: center;">Cantidad</th>';
    html += '<th style="padding: 10px; text-align: right;">Total</th>';
    html += '</tr>';
    
    cart.forEach(item => {
        html += '<tr>';
        html += `<td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>`;
        html += `<td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>`;
        html += `<td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">Q${(item.price * item.quantity).toFixed(2)}</td>`;
        html += '</tr>';
    });
    
    html += '</table>';
    return html;
}

function showCheckoutModal() {
    // Crear modal de checkout
    const modalHTML = `
        <div class="checkout-overlay" id="checkoutOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 3000; display: flex; align-items: center; justify-content: center;">
            <div class="checkout-modal" style="background: white; border-radius: 15px; padding: 30px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0;">💳 Finalizar Compra</h3>
                    <button id="closeCheckout" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
                </div>
                
                <form id="checkoutForm">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nombre completo *</label>
                        <input type="text" id="customerName" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Email *</label>
                        <input type="email" id="customerEmail" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Teléfono *</label>
                        <input type="tel" id="customerPhone" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Dirección completa *</label>
                        <textarea id="customerAddress" required rows="3" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"></textarea>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Ciudad/Departamento *</label>
                        <select id="customerCity" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            <option value="">Selecciona...</option>
                            <option value="guatemala">Guatemala</option>
                            <option value="sacatepequez">Sacatepéquez</option>
                            <option value="interior">Interior del país</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 10px; font-weight: bold;">Método de pago *</label>
                        <div>
                            <label style="display: block; margin-bottom: 8px;">
                                <input type="radio" name="paymentMethod" value="transferencia" required> Transferencia bancaria
                            </label>
                            <label style="display: block; margin-bottom: 8px;">
                                <input type="radio" name="paymentMethod" value="efectivo"> Efectivo al recibir
                            </label>
                            <label style="display: block;">
                                <input type="radio" name="paymentMethod" value="tarjeta"> Tarjeta de crédito (cuotas)
                            </label>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Notas adicionales (opcional)</label>
                        <textarea id="customerNotes" rows="3" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" placeholder="Instrucciones especiales, horarios preferidos, etc."></textarea>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin-top: 0;">🛒 Resumen del pedido</h4>
                        <div id="orderSummary"></div>
                    </div>
                    
                    <button type="submit" style="background: linear-gradient(45deg, #f09433, #dc2743); color: white; border: none; padding: 15px; width: 100%; border-radius: 30px; font-weight: bold; cursor: pointer; font-size: 16px;">
                        🚀 Enviar Orden
                    </button>
                </form>
            </div>
        </div>
    `;
    
    // Agregar al documento
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Actualizar resumen
    updateOrderSummary();
    
    // Configurar eventos
    document.getElementById('closeCheckout').addEventListener('click', closeCheckoutModal);
    document.getElementById('checkoutOverlay').addEventListener('click', function(e) {
        if (e.target === this) closeCheckoutModal();
    });
    document.getElementById('checkoutForm').addEventListener('submit', processCheckout);
    
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
}

function updateOrderSummary() {
    const summary = document.getElementById('orderSummary');
    let html = '';
    
    cart.forEach(item => {
        html += `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>${item.name} x${item.quantity}</span>
            <span>Q${(item.price * item.quantity).toFixed(2)}</span>
        </div>`;
    });
    
    html += `<hr style="margin: 15px 0;">
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>Total:</span>
            <span>Q${calculateTotal().toFixed(2)}</span>
        </div>`;
    
    summary.innerHTML = html;
}

function closeCheckoutModal() {
    const overlay = document.getElementById('checkoutOverlay');
    if (overlay) {
        overlay.remove();
        document.body.style.overflow = 'auto';
    }
}

async function processCheckout(e) {
    e.preventDefault();
    
    console.log('🔄 Iniciando proceso de checkout...');
    
    // Validar que haya productos
    if (cart.length === 0) {
        showNotification('error', 'Carrito vacío', 'Agrega productos antes de finalizar la compra');
        return;
    }
    
    // Recoger datos del formulario
    const customerName = document.getElementById('customerName');
    const customerEmail = document.getElementById('customerEmail');
    const customerPhone = document.getElementById('customerPhone');
    const customerAddress = document.getElementById('customerAddress');
    const customerCity = document.getElementById('customerCity');
    const customerNotes = document.getElementById('customerNotes');
    
    // Verificar que los elementos existan
    if (!customerName || !customerEmail || !customerPhone || !customerAddress || !customerCity) {
        showNotification('error', 'Error de formulario', 'No se pudo cargar el formulario. Recarga la página.');
        return;
    }
    
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    if (!paymentMethod) {
        showNotification('error', 'Método de pago', 'Selecciona un método de pago');
        return;
    }
    
    const formData = {
        name: customerName.value.trim(),
        email: customerEmail.value.trim(),
        phone: customerPhone.value.trim(),
        address: customerAddress.value.trim(),
        city: customerCity.value,
        paymentMethod: paymentMethod.value,
        notes: customerNotes ? customerNotes.value.trim() : '',
        orderId: 'KC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
        date: new Date().toLocaleDateString('es-GT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        subtotal: calculateSubtotal().toFixed(2),
        shipping: calculateShipping().toFixed(2),
        total: calculateTotal().toFixed(2),
        items: generateOrderItemsHTML()
    };
    
    // Validación básica
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.city) {
        showNotification('error', 'Datos incompletos', 'Por favor completa todos los campos requeridos (*)');
        return;
    }
    
    // Mostrar carga
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Enviando...';
    submitBtn.disabled = true;
    
    try {
        console.log('📧 Preparando email con datos:', formData);
        
        // ╔══════════════════════════════════════════════════════════════╗
        // ║                 PARÁMETROS CORREGIDOS                        ║
        // ╚══════════════════════════════════════════════════════════════╝
        const templateParams = {
            // Datos de la orden
            order_id: formData.orderId,
            date: formData.date,
            subtotal: formData.subtotal,
            shipping: formData.shipping,
            order_total: formData.total,
            order_items: formData.items,
            
            // Datos del cliente
            customer_name: formData.name,
            customer_email: formData.email,
            customer_phone: formData.phone,
            customer_address: formData.address,
            customer_city: formData.city,
            payment_method: formData.paymentMethod,
            customer_notes: formData.notes || 'Sin notas adicionales',
            year: new Date().getFullYear(),
            
            // ⭐⭐ DESTINATARIO FIJO OBLIGATORIO ⭐⭐
            // EmailJS necesita SABER a quién enviar
            // ESTOS CAMPOS DEBEN COINCIDIR CON TU PLANTILLA EN EMAILJS
            to_email: 'TU_EMAIL_AQUI@gmail.com',  // ⬅️⬅️⬅️ REEMPLAZA CON TU EMAIL
            to_name: 'KITCH-CRAFTER Ventas',
            
            // Para poder responder al cliente
            reply_to: formData.email,
            from_name: 'Sistema de Órdenes KITCH-CRAFTER'
        };
        
        console.log('📤 Enviando email con parámetros:', templateParams);
        
        // ╔══════════════════════════════════════════════════════════════╗
        // ║                 CONFIGURACIÓN EMAILJS                        ║
        // ╚══════════════════════════════════════════════════════════════╝
        const response = await emailjs.send(
            'service_ikudrk5',      // ⬅️⬅️⬅️ Service ID de EmailJS
            'template_fmbvd15',     // ⬅️⬅️⬅️ Template ID de EmailJS
            templateParams
        );
        
        console.log('✅ Email enviado exitosamente:', response);
        
        // ⭐⭐ IMPORTANTE: NO limpiar el carrito hasta confirmar éxito ⭐⭐
        showNotification('success', '✅ Orden enviada', `Recibimos tu orden #${formData.orderId}`);
        
        // Cerrar modales primero
        closeCheckoutModal();
        closeCartModal();
        
        // Luego limpiar el carrito (después de cerrar modales)
        setTimeout(() => {
            clearCart();
        }, 500);
        
        // Mostrar confirmación final
        setTimeout(() => {
            alert(`¡Gracias por tu compra, ${formData.name}!\n\n📧 Te contactaremos pronto al:\nEmail: ${formData.email}\nTeléfono: ${formData.phone}\n\nID de orden: ${formData.orderId}\nTotal: Q${formData.total}`);
        }, 1000);
        
    } catch (error) {
        console.error('❌ ERROR COMPLETO:', {
            status: error.status,
            text: error.text,
            message: error.message
        });
        
        let errorMessage = 'Hubo un problema al enviar tu orden. ';
        
        // Mensajes específicos según el error
        if (error.text) {
            if (error.text.includes('recipients address')) {
                errorMessage = 'Error de configuración: Por favor configura el destinatario en EmailJS Dashboard.';
            } else if (error.text.includes('Invalid template')) {
                errorMessage = 'Error: Template ID incorrecto. Verifica en EmailJS.';
            } else if (error.text.includes('Service not found')) {
                errorMessage = 'Error: Service ID incorrecto. Verifica en EmailJS.';
            } else {
                errorMessage += `Error: ${error.text}`;
            }
        }
        
        showNotification('error', '❌ Error', errorMessage);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ====================
// CARRUSEL
// ====================
let currentSlide = 0;
const totalSlides = 3;

function initCarousel() {
    updateCarousel();
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateCarousel();
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateCarousel();
}

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
}

function updateCarousel() {
    const track = document.getElementById('carouselTrack');
    const dots = document.querySelectorAll('.carousel-dot');
    
    // Mover carrusel
    track.style.transform = `translateX(-${currentSlide * 33.3333}%)`;
    
    // Actualizar dots
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

// ====================
// WHATSAPP
// ====================
function openWhatsApp() {
    const phoneNumber = '50212345678'; // ⚠️ REEMPLAZA CON TU NÚMERO REAL
    const defaultMessage = 'Hola KITCH-CRAFTER, vi su página web y me interesa información sobre Press&Maiz';
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;
    window.open(url, '_blank');
}

// ====================
// SCROLL HEADER
// ====================
function setupHeaderScroll() {
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// ====================
// CONFIGURAR EVENTOS
// ====================
function setupEventListeners() {
    // Botón del carrito
    document.getElementById('cartButton').addEventListener('click', openCartModal);
    document.getElementById('closeCart').addEventListener('click', closeCartModal);
    document.getElementById('cartOverlay').addEventListener('click', closeCartModal);
    document.getElementById('clearCart').addEventListener('click', clearCart);
    
    // Botón de checkout
    document.getElementById('checkoutBtn').addEventListener('click', showCheckoutModal);
    
    // WhatsApp
    document.getElementById('whatsappButton').addEventListener('click', openWhatsApp);
    
    // Botones "Agregar al carrito" - TODOS LOS PRODUCTOS NUEVOS
    document.addEventListener('click', function(e) {
        // Productos principales
        if (e.target.closest('.add-to-cart')) {
            const button = e.target.closest('.add-to-cart');
            const id = button.getAttribute('data-id');
            const name = button.getAttribute('data-name');
            const price = parseFloat(button.getAttribute('data-price'));
            
            addToCart(id, name, price);
        }
        
        // Botones de cantidad en el carrito
        if (e.target.closest('.increase-qty')) {
            const button = e.target.closest('.increase-qty');
            const id = button.getAttribute('data-id');
            const item = cart.find(item => item.id === id);
            if (item) updateQuantity(id, item.quantity + 1);
        }
        
        if (e.target.closest('.decrease-qty')) {
            const button = e.target.closest('.decrease-qty');
            const id = button.getAttribute('data-id');
            const item = cart.find(item => item.id === id);
            if (item) updateQuantity(id, item.quantity - 1);
        }
    });
    
    // Carrusel
    document.getElementById('nextBtn').addEventListener('click', nextSlide);
    document.getElementById('prevBtn').addEventListener('click', prevSlide);
    
    document.querySelectorAll('.carousel-dot').forEach(dot => {
        dot.addEventListener('click', function() {
            const slideIndex = parseInt(this.getAttribute('data-slide'));
            goToSlide(slideIndex);
        });
    });
    
    // Navegación suave
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}
