let elencoDomande = [];
let paginaCorrente = "";
let elencoPagine = []; // Salviamo le pagine per poterle raggruppare in Home

// 1. Inizializzazione del sito
async function inizializzaSito() {
    try {
        // Carica l'indice delle pagine per il menu laterale
        const responseMenu = await fetch('./menu.json');
        elencoPagine = await responseMenu.json();
        
        renderMenu(elencoPagine);
        
        // Carica la materia corrispondente all'URL corrente (o la prima di default)
        caricaMateriaDaURL(elencoPagine);

    } catch (error) {
        console.error("Errore nell'inizializzazione:", error);
    }
}

// Funzione di supporto per leggere il parametro 'materia' dall'URL e cambiare pagina
function caricaMateriaDaURL(pagine) {
    const params = new URLSearchParams(window.location.search);
    const materiaUrl = params.get('materia');
    
    const paginaTrovata = pagine.find(p => p.id === materiaUrl);

    if (paginaTrovata) {
        // Se l'URL richiede una materia specifica, carica quella (senza pushState extra)
        cambiaPagina(paginaTrovata.id, paginaTrovata.titolo, false);
    } else if (pagine.length > 0) {
        // Altrimenti carica la prima pagina dell'elenco come predefinita
        cambiaPagina(pagine[0].id, pagine[0].titolo, false);
    }
}

// 2. Genera graficamente il menu laterale
function renderMenu(pagine) {
    const menuContainer = document.getElementById('sidebar-menu');
    menuContainer.innerHTML = '';

    pagine.forEach(pag => {
        const link = document.createElement('button');
        link.className = `sidebar-item w-full text-left px-2 py-1.5 rounded hover:bg-[#252525] hover:text-white transition-colors flex items-center gap-2 cursor-pointer mb-0.5 text-gray-300`;
        link.innerHTML = pag.titolo;
        link.id = `menu-item-${pag.id}`;
        
        // Al click cambia il database visualizzato e aggiorna l'URL
        link.onclick = () => cambiaPagina(pag.id, pag.titolo, true);
        
        menuContainer.appendChild(link);
    });
}

// 3. CAMBIA PAGINA (Gestione alternata tra Home e Tabella Materia)
async function cambiaPagina(idPagina, titoloPagina, aggiornaURL = true) {
    paginaCorrente = idPagina;
    document.getElementById('page-title').innerHTML = titoloPagina;

    // --- AGGIORNAMENTO URL DINAMICO ---
    if (aggiornaURL) {
        const nuovoUrl = `${window.location.pathname}?materia=${encodeURIComponent(idPagina)}`;
        window.history.pushState({ id: idPagina, titolo: titoloPagina }, '', nuovoUrl);
    }

    // Gestione della classe .active estetica nel menu
    document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
    const itemAttivo = document.getElementById(`menu-item-${idPagina}`);
    if(itemAttivo) itemAttivo.classList.add('active');

    const homeView = document.getElementById('home-view');
    const materiaView = document.getElementById('materia-view');

    // --- CASO 1: SE SELEZIONATA LA HOME ---
    if (idPagina === 'home') {
        if (materiaView) materiaView.classList.add('hidden');
        if (homeView) {
            homeView.classList.remove('hidden');
            renderHome(elencoPagine);
        }
        return;
    }

    // --- CASO 2: SE SELEZIONATA UNA MATERIA SINGOLA ---
    if (homeView) homeView.classList.add('hidden');
    if (materiaView) materiaView.classList.remove('hidden');

    // Mostra il filtro parte solo per la pagina specificata
    const boxFiltroParte = document.getElementById('box-filtro-parte');
    if (boxFiltroParte) {
        if (idPagina === 'politica-economica' || idPagina === 'domande-esami') {
            boxFiltroParte.classList.remove('hidden');
        } else {
            boxFiltroParte.classList.add('hidden');
        }
    }

    try {
        // Carica il file JSON della materia
        const responseDati = await fetch(`./${idPagina}.json`);
        elencoDomande = await responseDati.json();
        
        // Aggiorna e resetta i filtri
        aggiornaOpzioniFiltri(elencoDomande);
        document.getElementById('filter-prof').value = 'all';
        document.getElementById('filter-corso').value = 'all';
        if (document.getElementById('filter-parte')) {
            document.getElementById('filter-parte').value = 'all';
        }
        
        // Genera la tabella
        renderTabella(elencoDomande);
    } catch (error) {
        console.error(`Errore nel caricare i dati della pagina ${idPagina}:`, error);
        document.getElementById('table-body').innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-400">Impossibile trovare il file ${idPagina}.json</td></tr>`;
    }
}

// Funzione ausiliaria per generare la Home organizzata per Anno Accademico
function renderHome(pagine) {
    const homeView = document.getElementById('home-view');
    if (!homeView) return;

    // Filtra per escludere la pagina "Home" stessa
    const materie = pagine.filter(p => p.id !== 'home');

    // Raggruppa le materie per la chiave "anno"
    const perAnno = materie.reduce((acc, materia) => {
        const anno = materia.anno || 'CLEA';
        if (!acc[anno]) acc[anno] = [];
        acc[anno].push(materia);
        return acc;
    }, {});

    // Genera l'HTML dinamico a griglia
    let html = `<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6 pt-6 border-t border-[#2A2A2A]">`;

    for (const [anno, listaMaterie] of Object.entries(perAnno)) {
        html += `
            <div>
                <h2 class="text-xl font-semibold mb-4 text-white">${anno}</h2>
                <ul class="space-y-3">
                    ${listaMaterie.map(m => `
                        <li>
                            <button onclick="cambiaPagina('${m.id}', '${m.titolo}')" class="text-gray-400 hover:text-white underline underline-offset-4 decoration-gray-600 hover:decoration-white transition-colors text-left cursor-pointer">
                                ${m.titolo}
                            </button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    html += `</div>`;
    homeView.innerHTML = html;
}

// Funzione di supporto per generare i filtri dinamici senza duplicati
function aggiornaOpzioniFiltri(datiMateria) {
    const selectProf = document.getElementById('filter-prof');
    const selectCorso = document.getElementById('filter-corso');

    // Svuota le vecchie opzioni mantenendo solo "Tutti"
    selectProf.innerHTML = '<option value="all">Tutti</option>';
    selectCorso.innerHTML = '<option value="all">Tutti</option>';

    // Set estrae solo i valori unici (elimina i duplicati)
    const professoriUnici = [...new Set(datiMateria.map(item => item.prof))].sort();
    const corsiUnici = [...new Set(datiMateria.map(item => item.corso))].sort();

    // Inserisce i nuovi professori nel menù a tendina
    professoriUnici.forEach(prof => {
        if(prof) { 
            const option = document.createElement('option');
            option.value = prof;
            option.textContent = prof;
            selectProf.appendChild(option);
        }
    });

    // Inserisce i nuovi corsi nel menù a tendina
    corsiUnici.forEach(corso => {
        if(corso) { 
            const option = document.createElement('option');
            option.value = corso;
            option.textContent = corso;
            selectCorso.appendChild(option);
        }
    });
}

// 4. Mostra i dati effettivi
function renderTabella(data) {
    const tbody = document.getElementById('table-body');
    
    // Svuota la tabella prima di inserire i nuovi dati
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">Nessun risultato trovato</td></tr>`;
        return;
    }

    // Accumula tutte le righe in una stringa di testo
    let righeHTML = '';

    data.forEach(item => {
        // Colore dinamico per i professori
        let profClass = 'bg-[#2F2F2F] text-gray-300'; 
        if (item.prof === 'Imbert') profClass = 'bg-[#1C3D27] text-[#52BA6F]';  
        if (item.prof === 'Morone') profClass = 'bg-[#1F3B4D] text-[#5CA3E6]';  
        if (item.prof === 'Bonelli') profClass = 'bg-[#3F2D54] text-[#B388EB]';
        if (item.prof === 'Masi') profClass = 'bg-[#4C3A23] text-[#E1A95F]';
        if (item.prof === 'Martucci') profClass = 'bg-[#1F3A44] text-[#4EBABA]';
        if (item.prof === 'Non specificato') profClass = 'bg-[#4A2424] text-[#ECA2A2]'; 

        // Colore dinamico per il corso
        let corsoClass = 'bg-[#252525] text-gray-400 border border-[#3F3F3F]';
        if (item.corso === 'CLEA C') corsoClass = 'bg-[#1F3B4D] text-[#5CA3E6]';
        if (item.corso === 'CLEA A') corsoClass = 'bg-[#1C3D27] text-[#52BA6F]';
        if (item.corso === 'CLEA B') corsoClass = 'bg-[#3F2D54] text-[#B388EB]';
        if (item.corso === 'SCAMS' || item.corso === 'SCAMS C') corsoClass = 'bg-[#5C4033] text-[#E1A95F]';

        // Valore predefinito se la proprietà "parte" manca nel file JSON
        const parteEsame = item.parte || 'Intero';

        // Genera il blocco HTML della riga corrente
        righeHTML += `
            <tr class="hover:bg-[#202020] transition-colors border-b border-[#2A2A2A]">
                <td class="p-3 flex items-center gap-2 text-gray-200">
                    📄 ${item.domanda}
                </td>
                <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-xs font-medium ${profClass}">
                        ${item.prof}
                    </span>
                </td>
                <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-xs font-medium ${corsoClass}">
                        ${item.corso}
                    </span>
                </td>
                <td class="p-3 text-gray-400 text-sm">
                    ${parteEsame}
                </td>
                <td class="p-3 text-gray-400">${item.data}</td>
            </tr>
        `;
    });

    // Inserisce tutte le righe insieme all'interno del corpo della tabella
    tbody.innerHTML = righeHTML;
}

// 5. Gestione filtri
function applicaFiltri() {
    const profScelto = document.getElementById('filter-prof').value;
    const corsoScelto = document.getElementById('filter-corso').value;
    const parteScelta = document.getElementById('filter-parte') ? document.getElementById('filter-parte').value : 'all';

    const datiFiltrati = elencoDomande.filter(item => {
        const matchProf = profScelto === 'all' || item.prof === profScelto;
        const matchCorso = corsoScelto === 'all' || item.corso === corsoScelto;
        
        // Controllo della parte d'esame
        const parteItem = item.parte || 'Intero';
        const matchParte = parteScelta === 'all' || parteItem === parteScelta;
        
        return matchProf && matchCorso && matchParte;
    });

    renderTabella(datiFiltrati);
}

document.getElementById('filter-prof').addEventListener('change', applicaFiltri);
document.getElementById('filter-corso').addEventListener('change', applicaFiltri);
if (document.getElementById('filter-parte')) {
    document.getElementById('filter-parte').addEventListener('change', applicaFiltri);
}

// Gestione dei tasti Avanti / Indietro del browser
window.addEventListener('popstate', async () => {
    try {
        const responseMenu = await fetch('./menu.json');
        const pagine = await responseMenu.json();
        caricaMateriaDaURL(pagine);
    } catch(e) {
        console.error("Errore nel ripristino dell'URL:", e);
    }
});

// Inizializza il sito al caricamento della pagina
window.addEventListener('DOMContentLoaded', inizializzaSito);

// Inizializza il sito al caricamento della pagina
window.addEventListener('DOMContentLoaded', inizializzaSito);
