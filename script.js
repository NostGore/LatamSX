// Estado de la aplicación
let databaseVideos = [];
let bestTopicsIds = []; // IDs de temas en "Lo mejor de lo mejor"

// Cargar base de datos desde mediaDB.js
if (typeof window !== 'undefined' && window.mediaDB) {
    databaseVideos = window.mediaDB;
    console.log(`✅ Base de datos cargada: ${databaseVideos.length} videos`);
} else {
    console.warn('⚠️ No se pudo cargar la base de datos. Asegúrate de que mediaDB.js esté cargado antes de script.js');
}

// Elementos del DOM (se obtendrán después de que el header se cargue)
let topicsList, latestTopicsList, recentVideosContainer, statsContent;
let searchButton, searchBox, searchInput, searchSubmit, searchBar, searchInputBar, searchSubmitBar;
let warningBar, searchModal, searchModalOverlay, searchModalClose, searchResults;
let categoriesButton, categoriesDropdownMain, dropdownContentMain;

// Función para obtener los elementos del DOM
function getDOMElements() {
    topicsList = document.getElementById('topics-list');
    latestTopicsList = document.getElementById('latest-topics-list');
    recentVideosContainer = document.getElementById('recent-videos');
    statsContent = document.getElementById('stats-content');
    searchButton = document.getElementById('search-button');
    searchBox = document.getElementById('search-box');
    searchInput = document.getElementById('search-input');
    searchSubmit = document.getElementById('search-submit');
    searchBar = document.getElementById('search-bar');
    searchInputBar = document.getElementById('search-input-bar');
    searchSubmitBar = document.getElementById('search-submit-bar');
    warningBar = document.getElementById('warning-bar');
    searchModal = document.getElementById('search-modal');
    searchModalOverlay = document.getElementById('search-modal-overlay');
    searchModalClose = document.getElementById('search-modal-close');
    searchResults = document.getElementById('search-results');
    categoriesButton = document.getElementById('categories-button');
    categoriesDropdownMain = document.getElementById('categories-dropdown-main');
    dropdownContentMain = document.getElementById('dropdown-content-main');
}

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    // Esperar a que el header se cargue
    let attempts = 0;
    const maxAttempts = 50;
    
    const waitForHeader = setInterval(() => {
        getDOMElements();
        
        // Verificar si los elementos críticos del header están disponibles
        if ((searchButton && searchBar) || attempts >= maxAttempts) {
            clearInterval(waitForHeader);
            
            // Continuar con la inicialización
            (async () => {
                renderTopics();
                renderLatestTopics();
                renderStats();
                renderRecentVideos();
                setupCategoriesDropdownMain();
                setupCategoriesToggle();
                setupSearchBox();
                setupSearchModal();
            })();
        }
        
        attempts++;
    }, 100);
});


// Convertir fecha del formato "Nov  3, 2025" a Date
function parseDate(dateString) {
    // Formato: "Nov  3, 2025" o "Mar 25, 2016"
    const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    const parts = dateString.trim().split(/\s+/);
    if (parts.length !== 3) return new Date(0);
    
    const month = months[parts[0]] || 0;
    const day = parseInt(parts[1].replace(',', '')) || 1;
    const year = parseInt(parts[2]) || 2000;
    
    return new Date(year, month, day);
}

// Formatear fecha para mostrar (devolver tal cual como está en la base de datos)
function formatDateForDisplay(dateString) {
    // Devolver la fecha tal cual como está en la base de datos
    return dateString.trim();
}

// Obtener temas aleatorios
function getRandomTopics(count) {
    if (!databaseVideos || databaseVideos.length === 0) {
        return [];
    }
    const validVideos = databaseVideos;
    const shuffled = [...validVideos].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Obtener temas más recientes
function getLatestTopics(count) {
    if (!databaseVideos || databaseVideos.length === 0) {
        return [];
    }
    const validVideos = databaseVideos;
    const sorted = [...validVideos].sort((a, b) => {
        try {
            const dateA = parseDate(a.fecha);
            const dateB = parseDate(b.fecha);
            return dateB - dateA; // Más reciente primero
        } catch (error) {
            console.warn('Error al parsear fecha:', a.fecha, b.fecha);
            return 0;
        }
    });
    return sorted.slice(0, Math.min(count, sorted.length));
}

// Convertir video de la base de datos al formato de tema
function convertVideoToTopic(video) {
    if (!video || !video.videoId || !video.titlePostSingle) {
        console.warn('Video inválido:', video);
        return null;
    }
    
    const categories = (video.categorias && Array.isArray(video.categorias)) 
        ? video.categorias.map(c => c && c.categoria ? c.categoria : '').filter(c => c).slice(0, 3)
        : [];
    const views = parseInt(video.vistas) || 0;
    const fecha = video.fecha ? formatDateForDisplay(video.fecha) : 'Fecha no disponible';
    
    return {
        id: video.videoId,
        title: video.titlePostSingle,
        categories: categories,
        author: 'LatamSX',
        date: fecha,
        views: views,
        fechaOriginal: video.fecha
    };
}

// Renderizar temas (Lo mejor de lo mejor - 8 temas aleatorios)
function renderTopics() {
    if (!topicsList) return;
    
    if (databaseVideos.length === 0) {
        topicsList.innerHTML = `
            <div style="padding: 3rem; text-align: center; color: #b0b0b0;">
                <p>No hay temas en la base de datos</p>
            </div>
        `;
        return;
    }
    
    const randomTopics = getRandomTopics(8);
    bestTopicsIds = randomTopics.map(v => v.videoId); // Guardar IDs para evitar duplicados
    const topics = randomTopics.map(convertVideoToTopic).filter(t => t !== null);
    
    if (topics.length === 0) {
        topicsList.innerHTML = `
            <div style="padding: 3rem; text-align: center; color: #b0b0b0;">
                <p>No hay temas válidos para mostrar</p>
            </div>
        `;
        return;
    }
    
    topicsList.innerHTML = topics.map(topic => {
        // Mostrar solo las primeras 3 categorías
        const displayCategories = topic.categories.slice(0, 3);
        const categoriesHTML = displayCategories.map((cat, index) => 
            `<span class="category-tag">${escapeHtml(cat)}</span>${index < displayCategories.length - 1 ? '<span class="category-separator">|</span>' : ''}`
        ).join('');
        
        return `
        <div class="topic-item">
            <div class="topic-left">
                <div class="topic-info">
                    <div class="categories-container">
                        ${categoriesHTML}
                    </div>
                    <h3 class="topic-title">
                        <i class="fas fa-arrow-right topic-arrow"></i>
                        <a href="public/foro.html?id=${escapeHtml(topic.id)}">${escapeHtml(topic.title)}</a>
                    </h3>
                    <div class="topic-meta">
                        <span class="author">${escapeHtml(topic.author)}</span>
                        <img src="https://cdn-icons-png.flaticon.com/512/7641/7641727.png" alt="Icon" class="author-icon">
                        <span>•</span>
                        <span class="date-info">
                            <i class="fas fa-calendar"></i>
                            ${escapeHtml(topic.date)}
                        </span>
                        <span class="views-separator">•</span>
                        <span class="views-count">
                            <i class="fas fa-eye"></i>
                            ${topic.views}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Renderizar últimos agregados (5 temas más recientes)
function renderLatestTopics() {
    if (!latestTopicsList) return;
    
    if (databaseVideos.length === 0) {
        latestTopicsList.innerHTML = `
            <div style="padding: 3rem; text-align: center; color: #b0b0b0;">
                <p>No hay temas en la base de datos</p>
            </div>
        `;
        return;
    }
    
    const latestVideos = getLatestTopics(5);
    const topics = latestVideos.map(video => {
        const topic = convertVideoToTopic(video);
        if (topic && video.jpgUrl) {
            topic.jpgUrl = video.jpgUrl;
        }
        return topic;
    }).filter(t => t !== null);
    
    if (topics.length === 0) {
        latestTopicsList.innerHTML = `
            <div style="padding: 3rem; text-align: center; color: #b0b0b0;">
                <p>No hay temas válidos para mostrar</p>
            </div>
        `;
        return;
    }
    
    latestTopicsList.innerHTML = topics.map(topic => {
        // Mostrar solo las primeras 3 categorías
        const displayCategories = topic.categories.slice(0, 3);
        const categoriesHTML = displayCategories.map((cat, index) => 
            `<span class="category-tag">${escapeHtml(cat)}</span>${index < displayCategories.length - 1 ? '<span class="category-separator">|</span>' : ''}`
        ).join('');
        
        return `
        <div class="topic-item">
            <div class="topic-left">
                <div class="topic-info">
                    <div class="categories-container">
                        ${categoriesHTML}
                    </div>
                    <h3 class="topic-title">
                        <a href="public/foro.html?id=${escapeHtml(topic.id)}">${escapeHtml(topic.title)}</a>
                    </h3>
                    <div class="topic-meta">
                        <span class="author">${escapeHtml(topic.author)}</span>
                        <img src="https://cdn-icons-png.flaticon.com/512/7641/7641727.png" alt="Icon" class="author-icon">
                        <span>•</span>
                        <span class="date-info">
                            <i class="fas fa-calendar"></i>
                            ${escapeHtml(topic.date)}
                        </span>
                        <span class="views-separator">•</span>
                        <span class="views-count">
                            <i class="fas fa-eye"></i>
                            ${topic.views}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Renderizar estadísticas
function renderStats() {
    // Calcular número de temas
    const totalTopics = databaseVideos.length;
    
    // Calcular número de categorías únicas
    const categories = getAllCategories();
    const totalCategories = categories.length;
    
    // HTML de las estadísticas
    const statsHTML = `
        <div style="padding: 1rem 1.5rem; background: var(--dark-gray);">
            <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                <div style="display: flex; align-items: center; gap: 0.7rem;">
                    <i class="fas fa-file-alt" style="color: var(--orange); font-size: 1rem;"></i>
                    <div>
                        <span style="color: var(--text-gray); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">Temas:</span>
                        <span style="color: var(--yellow); font-size: 1rem; font-weight: 700; margin-left: 0.5rem;">${totalTopics.toLocaleString()}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.7rem;">
                    <i class="fas fa-tags" style="color: var(--orange); font-size: 1rem;"></i>
                    <div>
                        <span style="color: var(--text-gray); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">Categorías:</span>
                        <span style="color: var(--yellow); font-size: 1rem; font-weight: 700; margin-left: 0.5rem;">${totalCategories.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Renderizar en desktop
    if (statsContent) {
        statsContent.innerHTML = statsHTML;
    }
    
    // Renderizar en móvil (sidebar)
    const statsContentMobile = document.getElementById('stats-content-mobile');
    if (statsContentMobile) {
        statsContentMobile.innerHTML = statsHTML;
    }
}

// Renderizar otros temas (temas aleatorios para el sidebar)
function renderRecentVideos() {
    if (!recentVideosContainer) return;
    
    if (databaseVideos.length === 0) {
        recentVideosContainer.innerHTML = `
            <p style="color: #666; font-size: 0.9rem;">No hay temas en la base de datos</p>
        `;
        return;
    }
    
    // Obtener temas aleatorios, excluyendo los que ya están en "Lo mejor de lo mejor"
    const availableVideos = databaseVideos.filter(v => v && v.videoId && !bestTopicsIds.includes(v.videoId));
    const shuffled = [...availableVideos].sort(() => 0.5 - Math.random());
    const randomTopics = shuffled.slice(0, 14);
    const topics = randomTopics.map(convertVideoToTopic).filter(t => t !== null);
    
    if (topics.length === 0) {
        recentVideosContainer.innerHTML = `
            <p style="color: #666; font-size: 0.9rem;">No hay temas recientes</p>
        `;
        return;
    }
    
    const displayTopics = topics;
    
    recentVideosContainer.innerHTML = displayTopics.map(topic => {
        return `
            <div class="recent-topic-item">
                <h4 class="recent-topic-title">
                    <a href="public/foro.html?id=${escapeHtml(topic.id)}">${escapeHtml(topic.title)}</a>
                </h4>
                <div class="recent-topic-meta">
                    <span class="recent-author">${escapeHtml(topic.author)}</span>
                    <span class="recent-separator">•</span>
                    <span class="recent-date">${escapeHtml(topic.date)}</span>
                    <span class="recent-separator">•</span>
                    <span class="recent-views">
                        <i class="fas fa-eye"></i>
                        ${topic.views}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Obtener todas las categorías únicas de la base de datos
function getAllCategories() {
    const categoriesMap = new Map();
    
    databaseVideos.forEach(video => {
        if (video.categorias && Array.isArray(video.categorias)) {
            video.categorias.forEach(categoria => {
                if (categoria && categoria.categoria) {
                    // Usar "categoria" (el identificador) como clave única
                    if (!categoriesMap.has(categoria.categoria)) {
                        categoriesMap.set(categoria.categoria, {
                            nombre: categoria.categoria, // Usar categoria como nombre también
                            categoria: categoria.categoria
                        });
                    }
                }
            });
        }
    });
    
    // Convertir a array y ordenar alfabéticamente por nombre (para mostrar)
    return Array.from(categoriesMap.values()).sort((a, b) => 
        a.nombre.localeCompare(b.nombre)
    );
}

// Configurar el dropdown principal de categorías
function setupCategoriesDropdownMain() {
    if (!categoriesDropdownMain || !dropdownContentMain) return;
    
    const categories = getAllCategories();
    
    if (categories.length === 0) {
        dropdownContentMain.innerHTML = `
            <div class="dropdown-category-item-main" style="color: #999; cursor: default;">
                No hay categorías disponibles
            </div>
        `;
        return;
    }
    
    dropdownContentMain.innerHTML = categories.map(cat => {
        return `
            <div class="dropdown-category-item-main" data-category="${escapeHtml(cat.categoria)}">
                ${escapeHtml(cat.nombre)}
            </div>
        `;
    }).join('');
    
    // Agregar evento click a cada categoría
    dropdownContentMain.querySelectorAll('.dropdown-category-item-main').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const category = item.getAttribute('data-category');
            // Redirigir a la página de categoría con la URL dinámica
            window.location.href = `public/category.html?category=${encodeURIComponent(category)}`;
        });
    });
}

// Función para resetear el scroll del dropdown
function resetDropdownScrollMain() {
    if (categoriesDropdownMain) {
        categoriesDropdownMain.scrollTop = 0;
    }
}

// Configurar el toggle del dropdown principal
function setupCategoriesToggle() {
    if (!categoriesButton || !categoriesDropdownMain) return;
    
    // Toggle al hacer click en el botón de categorías
    categoriesButton.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = categoriesDropdownMain.classList.contains('show');
        categoriesDropdownMain.classList.toggle('show');
        categoriesButton.classList.toggle('active');
        
        // Resetear scroll siempre (al abrir o cerrar)
        resetDropdownScrollMain();
    });
    
    // Cerrar el dropdown al hacer click fuera
    document.addEventListener('click', (e) => {
        const isClickInside = categoriesDropdownMain.contains(e.target) || categoriesButton.contains(e.target);
        if (!isClickInside && categoriesDropdownMain.classList.contains('show')) {
            categoriesDropdownMain.classList.remove('show');
            categoriesButton.classList.remove('active');
            resetDropdownScrollMain();
        }
    });
    
    // Cerrar el dropdown al hacer scroll
    window.addEventListener('scroll', () => {
        if (categoriesDropdownMain.classList.contains('show')) {
            categoriesDropdownMain.classList.remove('show');
            categoriesButton.classList.remove('active');
            resetDropdownScrollMain();
        }
    });
}

// Configurar el cuadro de búsqueda
function setupSearchBox() {
    if (!searchButton || !searchBar) return;
    
    // Toggle al hacer click en el botón de búsqueda
    searchButton.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = searchBar.classList.contains('show');
        
        // Toggle de la barra de búsqueda
        searchBar.classList.toggle('show');
        
        // Agregar/quitar clase al body para controlar la posición de la warning-bar
        if (!isOpen) {
            document.body.classList.add('search-active');
        } else {
            document.body.classList.remove('search-active');
        }
        
        // Si se abre, enfocar el input
        if (!isOpen) {
            setTimeout(() => {
                if (searchInputBar) {
                    searchInputBar.focus();
                }
            }, 100);
        }
    });
    
    // Funcionalidad de búsqueda en la nueva barra
    if (searchSubmitBar && searchInputBar) {
        searchSubmitBar.addEventListener('click', (e) => {
            e.preventDefault();
            performSearchBar();
        });
        
        searchInputBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearchBar();
            }
        });
    }
    
    // También mantener la funcionalidad del dropdown anterior si existe
    if (searchBox && searchSubmit && searchInput) {
        searchSubmit.addEventListener('click', (e) => {
            e.preventDefault();
            performSearch();
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }
}

// Extraer palabras clave del término de búsqueda
function extractKeywords(searchTerm) {
    // Convertir a mayúsculas y dividir por espacios
    const words = searchTerm.toUpperCase().split(/\s+/);
    
    // Filtrar palabras muy cortas (menos de 3 caracteres) y palabras comunes
    const commonWords = ['DE', 'LA', 'EL', 'Y', 'A', 'EN', 'UN', 'UNA', 'LOS', 'LAS', 'QUE', 'DEL', 'CON', 'POR'];
    
    const keywords = words.filter(word => 
        word.length >= 3 && !commonWords.includes(word)
    );
    
    // Si no hay palabras clave después del filtro, usar todas las palabras de 2+ caracteres
    if (keywords.length === 0) {
        return words.filter(word => word.length >= 2);
    }
    
    return keywords;
}

// Buscar videos en la base de datos
function searchVideos(searchTerm) {
    const keywords = extractKeywords(searchTerm);
    const results = [];
    
    databaseVideos.forEach(video => {
        if (!video || !video.titlePostSingle) return;
        
        const title = video.titlePostSingle.toUpperCase();
        const categories = video.categorias ? video.categorias.map(c => (c.categoria || c.nombre || '').toUpperCase()).join(' ') : '';
        const searchText = `${title} ${categories}`;
        
        // Contar cuántas palabras clave coinciden
        let matchCount = 0;
        keywords.forEach(keyword => {
            if (searchText.includes(keyword)) {
                matchCount++;
            }
        });
        
        // Si al menos una palabra clave coincide, agregar a resultados
        if (matchCount > 0) {
            results.push({
                video: video,
                matchCount: matchCount,
                keywords: keywords
            });
        }
    });
    
    // Ordenar por número de coincidencias (más coincidencias primero)
    results.sort((a, b) => b.matchCount - a.matchCount);
    
    return {
        results: results.map(r => r.video),
        keywords: keywords
    };
}

// Mostrar resultados en el modal
function displaySearchResults(searchTerm, searchData) {
    if (!searchResults) return;
    
    const { results, keywords } = searchData;
    
    if (results.length === 0) {
        searchResults.innerHTML = `
            <div class="search-result-empty">
                <i class="fas fa-search"></i>
                <p>No se encontraron resultados para: "${escapeHtml(searchTerm)}"</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Intenta con otras palabras clave</p>
            </div>
        `;
        return;
    }
    
    // Mostrar resultados (sin palabras clave)
    const resultsHTML = results.map(video => {
        return `
            <div class="search-result-item" onclick="window.location.href='public/foro.html?id=${escapeHtml(video.videoId)}'" style="cursor: pointer;">
                <h3 class="search-result-title">${escapeHtml(video.titlePostSingle)}</h3>
                <div class="search-result-meta">
                    <span class="search-result-author"><i class="fas fa-user"></i> ${escapeHtml('LatamSX')}</span>
                    <span><i class="fas fa-calendar"></i> ${escapeHtml(video.fecha)}</span>
                    <span><i class="fas fa-eye"></i> ${video.vistas || 0} vistas</span>
                </div>
            </div>
        `;
    }).join('');
    
    searchResults.innerHTML = resultsHTML;
}

// Realizar búsqueda desde la barra
function performSearchBar() {
    if (!searchInputBar) return;
    
    const searchTerm = searchInputBar.value.trim();
    
    if (searchTerm.length === 0) {
        alert('Por favor ingresa un término de búsqueda');
        return;
    }
    
    // Realizar búsqueda
    const searchData = searchVideos(searchTerm);
    
    // Mostrar resultados en el modal
    displaySearchResults(searchTerm, searchData);
    
    // Mostrar el modal
    if (searchModal) {
        searchModal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }
    
    // Cerrar la barra de búsqueda
    if (searchBar) {
        searchBar.classList.remove('show');
    }
}

// Configurar el modal de búsqueda
function setupSearchModal() {
    if (!searchModal || !searchModalClose || !searchModalOverlay) return;
    
    // Cerrar al hacer click en el overlay
    searchModalOverlay.addEventListener('click', () => {
        closeSearchModal();
    });
    
    // Cerrar al hacer click en el botón de cerrar
    searchModalClose.addEventListener('click', () => {
        closeSearchModal();
    });
    
    // Cerrar con la tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchModal.classList.contains('show')) {
            closeSearchModal();
        }
    });
}

// Cerrar el modal de búsqueda
function closeSearchModal() {
    if (searchModal) {
        searchModal.classList.remove('show');
        document.body.style.overflow = ''; // Restaurar scroll del body
    }
    
    // Limpiar el input
    if (searchInputBar) {
        searchInputBar.value = '';
    }
}

// Realizar búsqueda desde el dropdown (mantener compatibilidad)
function performSearch() {
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm.length === 0) {
        alert('Por favor ingresa un término de búsqueda');
        return;
    }
    
    // Aquí puedes agregar la lógica de búsqueda
    console.log('Buscando:', searchTerm);
    
    // Por ahora solo mostramos un mensaje
    alert(`Buscando: "${searchTerm}"\n\n(La funcionalidad de búsqueda se implementará próximamente)`);
    
    // Cerrar el cuadro de búsqueda después de buscar
    if (searchBox) {
        searchBox.classList.remove('show');
    }
}
