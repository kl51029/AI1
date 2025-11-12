const IMAGE_URL = 'map-image.png'; 
const GRID_SIZE = 4; 
const TOTAL_PIECES = GRID_SIZE * GRID_SIZE;
const CONTAINER_SIZE = 600;

let map;
let marker;
let draggedPiece = null;
let puzzleGenerated = false; 

function initMap() {
    map = L.map('map').setView([52.2297, 21.0122], 13); 

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    document.getElementById('request-location').addEventListener('click', getMyLocation); 
    document.getElementById('request-notification-permission').addEventListener('click', requestNotificationPermission); 
    document.getElementById('download-map').addEventListener('click', startPuzzleProcess);
    
    createDropTargets('puzzle-container');
    createDropTargets('puzzle-pieces-pool');
}

function getMyLocation() {
    if (!navigator.geolocation) {
        return alert("Geolocation API nie jest wspierane.");
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            const latlng = [lat, lng];
            console.log(`Współrzędne: ${lat}, ${lng}`); 
            map.setView(latlng, 15); 
            if (marker) map.removeLayer(marker);
            marker = L.marker(latlng).addTo(map)
                .bindPopup(`Twoja lokalizacja: ${lat}, ${lng}`)
                .openPopup();
        },
        (error) => {
            alert("Błąd pobierania lokalizacji: " + error.message);
        }
    );
}

function requestNotificationPermission() {
    if (!('Notification' in window)) {
        return alert("Powiadomienia systemowe nie są wspierane.");
    }
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            alert("Zgoda na powiadomienia udzielona.");
        }
    });
}

function showGameCompleteNotification() {
    if (Notification.permission === "granted") {
        new Notification("WYGRANA!", {
            body: "Puzzle mapy ułożone poprawnie. Koniec LAB C.",
        });
    } else {
        alert("PUZZLE UŁOŻONE POPRAWNIE! KONIEC GRY.");
    }
    console.log("Wszystkie elementy na swoim miejscu!"); 
}

function setReferenceImage(imageUrl) {
    const refDiv = document.getElementById('map-reference');
    refDiv.innerHTML = '';
    
    refDiv.style.backgroundImage = `url(${imageUrl})`;
    refDiv.style.backgroundSize = `300px 300px`; 
}

function createDropTargets(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    for (let i = 0; i < TOTAL_PIECES; i++) {
        const target = document.createElement('div');
        target.classList.add('drop-target');
        if (containerId === 'puzzle-container') {
            target.dataset.targetIndex = i.toString(); 
        }
        
        target.addEventListener('dragover', (e) => { e.preventDefault(); }); 
        target.addEventListener('drop', handleDrop);
        
        container.appendChild(target);
    }
}

function startPuzzleProcess() {
    if (puzzleGenerated) {
        setReferenceImage(IMAGE_URL); 
        return initializePuzzleMechanics(IMAGE_URL);
    }
    
    const mapContainer = document.getElementById('map'); 
    
    mapContainer.style.width = `${CONTAINER_SIZE}px`;
    mapContainer.style.height = `${CONTAINER_SIZE}px`;
    map.invalidateSize(); 

    if (typeof leafletImage === 'undefined') {
        puzzleGenerated = true;
        alert("Błąd ładowania biblioteki mapy rastrowej. Wymagam ręcznego umieszczenia pliku 'map-image.png' (600x600px) w folderze projektu. Uruchamiam grę (KROK 2).");
        return initializePuzzleMechanics(IMAGE_URL);
    }

    alert("KROK 1: Generuję obraz rastrowy mapy (600x600px) i inicjuję jego pobranie. Następnie przenieś pobrany plik do folderu projektu i kliknij ponownie 'Pobierz mapę & Start Gry'.");

    leafletImage(map, function(err, canvas) {
        if (err) {
            console.error("Błąd eksportu mapy do rastra (Canvas).", err);
            puzzleGenerated = true;
            return initializePuzzleMechanics(IMAGE_URL);
        }
        
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = IMAGE_URL; 
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        puzzleGenerated = true;
        alert("Pobieranie zakończone! Przenieś 'map-image.png' (600x600px) do folderu projektu, a następnie kliknij ponownie 'Pobierz mapę & Start Gry'!");
    });
}

function initializePuzzleMechanics(imageUrl) {
    
    const pool = document.getElementById('puzzle-pieces-pool');
    let pieces = [];
    const pieceSize = CONTAINER_SIZE / GRID_SIZE;

    setReferenceImage(imageUrl);

    for (let i = 0; i < TOTAL_PIECES; i++) {
        const piece = document.createElement('div');
        
        piece.classList.add('puzzle-piece');
        piece.draggable = true;
        piece.dataset.correctIndex = i.toString();

        const row = Math.floor(i / GRID_SIZE);
        const col = i % GRID_SIZE;
        const bgPosX = -(col * pieceSize);
        const bgPosY = -(row * pieceSize);

        piece.style.backgroundImage = `url(${imageUrl})`;
        piece.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
        piece.style.backgroundSize = `${CONTAINER_SIZE}px ${CONTAINER_SIZE}px`;
        
        piece.addEventListener('dragstart', handleDragStart);
        pieces.push(piece);

        const tempImg = new Image();
        tempImg.onerror = () => {
            piece.style.backgroundColor = '#d9534f'; 
            piece.style.backgroundImage = 'none';
            piece.innerHTML = `<p style="color: white; padding: 5px; text-align: center; font-size: 11px; font-weight: bold;">BRAK PLIKU MAPY: ${imageUrl}</p>`;
            piece.style.border = '3px solid red';
            
            document.getElementById('map-reference').style.backgroundImage = 'none';
        };
        tempImg.src = imageUrl;
    }

    pieces.sort(() => Math.random() - 0.5); 
    const sourceTargets = pool.children;
    for (let i = 0; i < TOTAL_PIECES; i++) {
        if (sourceTargets[i]) {
            sourceTargets[i].appendChild(pieces[i]);
        }
    }

    alert("KROK 2: Rozpoczęcie gry. Ułóż puzzle!");
}

function handleDragStart(e) {
    if (e.target.classList.contains('puzzle-piece')) {
        draggedPiece = e.target;
        e.dataTransfer.setData('text/plain', e.target.dataset.correctIndex); 
        setTimeout(() => e.target.style.opacity = '0.5', 0);
    } else {
        e.preventDefault();
    }
}

function handleDrop(e) {
    e.preventDefault();
    if (!draggedPiece) return;

    const target = e.currentTarget;

    if (target.children.length > 0) {
        const existingPiece = target.children[0];
        const sourceContainer = draggedPiece.parentElement;
        sourceContainer.appendChild(existingPiece);
        target.appendChild(draggedPiece);
        
    } else {
        target.appendChild(draggedPiece);
    }

    draggedPiece.style.opacity = '1'; 
    draggedPiece = null;

    checkWinCondition();
}

function checkWinCondition() {
    let piecesInCorrectPlace = 0;
    const targets = document.getElementById('puzzle-container').children;
    
    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        target.classList.remove('correct-place');
        
        if (target.children.length === 1) {
            const piece = target.children[0];
            const pieceIndex = piece.dataset.correctIndex;
            const targetIndex = target.dataset.targetIndex;
            
            if (pieceIndex === targetIndex) {
                piecesInCorrectPlace++;
                target.classList.add('correct-place');
            }
        }
    }
    
    if (piecesInCorrectPlace === TOTAL_PIECES) {
        showGameCompleteNotification();
    }
}

document.addEventListener('DOMContentLoaded', initMap);