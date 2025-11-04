// Función para generar y insertar el encabezado
function loadHeader() {
    // Detectar si estamos en foro.html o category.html
    const isForoPage = window.location.pathname.includes('foro.html');
    const isCategoryPage = window.location.pathname.includes('category.html');
    const isSubFolder = isForoPage || isCategoryPage;
    
    // Detectar si estamos en index.html
    const isIndexPage = window.location.pathname === '/' || 
                       window.location.pathname.endsWith('../index.html') || 
                       window.location.pathname.endsWith('/index.html');
    
    const inicioHref = isSubFolder ? '../index.html' : 'index.html';
    const inicioActive = !isSubFolder && isIndexPage ? 'active' : '';
    
    // Rutas para las categorías según la ubicación
    const categoryPath = isSubFolder ? 'category.html' : 'public/category.html';
    
    // Solo mostrar el buscador si estamos en index.html
    const searchHTML = isIndexPage ? `
                <div class="search-wrapper">
                    <button class="btn-icon" id="search-button" title="Buscar"><i class="fas fa-search"></i> Buscar</button>
                    <div class="search-box" id="search-box">
                        <div class="search-content">
                            <input type="text" id="search-input" class="search-input" placeholder="Buscar videos...">
                            <button class="search-submit-btn" id="search-submit">
                                <i class="fas fa-search"></i>
                                <span>Buscar</span>
                            </button>
                        </div>
                    </div>
                </div>
    ` : '';
    
    const searchBarHTML = isIndexPage ? `
        <!-- Cuadro de Búsqueda -->
        <div class="search-bar" id="search-bar">
            <div class="container">
                <div class="search-bar-content">
                    <input type="text" id="search-input-bar" class="search-input-bar" placeholder="Buscar videos...">
                    <button class="search-submit-btn-bar" id="search-submit-bar">
                        <i class="fas fa-search"></i>
                        <span>Buscar</span>
                    </button>
                </div>
            </div>
        </div>
    ` : '';
    
    const headerHTML = `
        <!-- Barra Superior -->
        <header class="top-bar">
            <div class="container">
                <img src="https://files.catbox.moe/09rldz.png" alt="LatamSX" class="logo">
            </div>
        </header>

        <!-- Barra de Botones Principal -->
        <nav class="button-nav" style="order: 1;">
            <div class="container">
                <a href="${inicioHref}" class="nav-button ${inicioActive}">INICIO</a>
                <a href="${categoryPath}?category=latinas" class="nav-button">LATINAS</a>
                <a href="${categoryPath}?category=jovencitas" class="nav-button">JOVENCITAS</a>
                <a href="${categoryPath}?category=anal" class="nav-button">ANAL</a>
                ${searchHTML}
            </div>
        </nav>

        ${searchBarHTML}

        <!-- Barra de Advertencia -->
        <div class="warning-bar" id="warning-bar" style="order: 3;">
            <div class="container">
                <p>Este sitio es solo para mayores de 18 años</p>
            </div>
        </div>
    `;
    
    // Insertar el encabezado al inicio del body
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
}

// Cargar el encabezado cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
} else {
    loadHeader();
}

