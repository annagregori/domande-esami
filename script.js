let elencoDomande = [];
let paginaCorrente = "";
let elencoPagine = []; // Salviamo le pagine per poterle raggruppare in Home
let domandaAttivaKey = "";

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

// Funzione di supporto per estrarre l'anno da una data ("GG/MM/AAAA" o "AAAA-MM-DD")
function estraiAnno(strData) {
    if (!strData) return null;
    const dataPulita = String(strData).trim();
    
    // Formato GG/MM/AAAA
    if (dataPulita.includes('/')) {
        const parti = dataPulita.split('/');
        return parti[parti.length - 1];
    }
    
    // Formato AAAA-MM-DD
    if (dataPulita.includes('-')) {
        const parti = dataPulita.split('-');
        return parti[0].length === 4 ? parti[0] : parti[parti.length - 1];
    }

    return null;
}

// Funzione di supporto per leggere il parametro 'materia' dall'URL e cambiare pagina
function caricaMateriaDaURL(pagine) {
    const params = new URLSearchParams(window.location.search);
    const materiaUrl = params.get('materia');
    
    const paginaTrovata = pagine.find(p => p.id === materiaUrl);

    if (paginaTrovata) {
        cambiaPagina(paginaTrovata.id, paginaTrovata.titolo, false);
    } else if (pagine.length > 0) {
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
        
        link.onclick = () => {
            tornaAllaMateria(); // Chiude eventuale scheda risposta aperta
            cambiaPagina(pag.id, pag.titolo, true);
        };
        
        menuContainer.appendChild(link);
    });
}

// 3. CAMBIA PAGINA (Gestione alternata tra Home e Tabella Materia)
async function cambiaPagina(idPagina, titoloPagina, aggiornaURL = true) {
    paginaCorrente = idPagina;
    document.getElementById('page-title').innerHTML = titoloPagina;

    if (aggiornaURL) {
        const nuovoUrl = `${window.location.pathname}?materia=${encodeURIComponent(idPagina)}`;
        window.history.pushState({ id: idPagina, titolo: titoloPagina }, '', nuovoUrl);
    }

    document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
    const itemAttivo = document.getElementById(`menu-item-${idPagina}`);
    if(itemAttivo) itemAttivo.classList.add('active');

    const homeView = document.getElementById('home-view');
    const materiaView = document.getElementById('materia-view');
    const domandaView = document.getElementById('domanda-view');

    if (domandaView) domandaView.classList.add('hidden');

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

    // Mostra il filtro parte solo per Diritto Commerciale
    const boxFiltroParte = document.getElementById('box-filtro-parte');
    if (boxFiltroParte) {
        if (idPagina === 'diritto-commerciale') {
            boxFiltroParte.classList.remove('hidden');
        } else {
            boxFiltroParte.classList.add('hidden');
        }
    }

    try {
        const responseDati = await fetch(`./${idPagina}.json`);
        elencoDomande = await responseDati.json();
        
        // Aggiorna e resetta i filtri
        aggiornaOpzioniFiltri(elencoDomande);
        document.getElementById('filter-prof').value = 'all';
        document.getElementById('filter-corso').value = 'all';
        if (document.getElementById('filter-anno')) document.getElementById('filter-anno').value = 'all';
        if (document.getElementById('filter-parte')) document.getElementById('filter-parte').value = 'all';
        
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

    const materie = pagine.filter(p => p.id !== 'home');

    const perAnno = materie.reduce((acc, materia) => {
        const anno = materia.anno || 'CLEA';
        if (!acc[anno]) acc[anno] = [];
        acc[anno].push(materia);
        return acc;
    }, {});

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

// Funzione di supporto per generare i filtri dinamici (Prof, Corso, Anno)
function aggiornaOpzioniFiltri(datiMateria) {
    const selectProf = document.getElementById('filter-prof');
    const selectCorso = document.getElementById('filter-corso');
    const selectAnno = document.getElementById('filter-anno');

    selectProf.innerHTML = '<option value="all">Tutti</option>';
    selectCorso.innerHTML = '<option value="all">Tutti</option>';
    if (selectAnno) selectAnno.innerHTML = '<option value="all">Tutti</option>';

    const professoriUnici = [...new Set(datiMateria.map(item => item.prof))].filter(Boolean).sort();
    const corsiUnici = [...new Set(datiMateria.map(item => item.corso))].filter(Boolean).sort();
    
    // Deduzione automatica degli anni dalle date
    const anniUnici = [...new Set(datiMateria.map(item => estraiAnno(item.data)))]
                        .filter(Boolean)
                        .sort((a, b) => b - a);

    professoriUnici.forEach(prof => {
        const option = document.createElement('option');
        option.value = prof;
        option.textContent = prof;
        selectProf.appendChild(option);
    });

    corsiUnici.forEach(corso => {
        const option = document.createElement('option');
        option.value = corso;
        option.textContent = corso;
        selectCorso.appendChild(option);
    });

    if (selectAnno) {
        anniUnici.forEach(anno => {
            const option = document.createElement('option');
            option.value = anno;
            option.textContent = anno;
            selectAnno.appendChild(option);
        });
    }
}

// 4. Mostra i dati effettivi
function renderTabella(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">Nessun risultato trovato</td></tr>`;
        return;
    }

    let righeHTML = '';

    data.forEach(item => {
        let profClass = 'bg-[#2F2F2F] text-gray-300'; 
        if (item.prof === 'Imbert') profClass = 'bg-[#1C3D27] text-[#52BA6F]';  
        if (item.prof === 'Morone') profClass = 'bg-[#1F3B4D] text-[#5CA3E6]';  
        if (item.prof === 'Bonelli') profClass = 'bg-[#3F2D54] text-[#B388EB]';
        if (item.prof === 'Masi') profClass = 'bg-[#4C3A23] text-[#E1A95F]';
        if (item.prof === 'Martucci') profClass = 'bg-[#1F3A44] text-[#4EBABA]';
        if (item.prof === 'Non specificato') profClass = 'bg-[#4A2424] text-[#ECA2A2]'; 

        let corsoClass = 'bg-[#252525] text-gray-400 border border-[#3F3F3F]';
        if (item.corso === 'CLEA C') corsoClass = 'bg-[#1F3B4D] text-[#5CA3E6]';
        if (item.corso === 'CLEA A') corsoClass = 'bg-[#1C3D27] text-[#52BA6F]';
        if (item.corso === 'CLEA B') corsoClass = 'bg-[#3F2D54] text-[#B388EB]';
        if (item.corso === 'SCAMS' || item.corso === 'SCAMS C') corsoClass = 'bg-[#5C4033] text-[#E1A95F]';

        const parteEsame = item.parte || 'Intero';
        const domandaSanitizzata = (item.domanda || '').replace(/'/g, "\\'");

        righeHTML += `
            <tr class="hover:bg-[#202020] transition-colors border-b border-[#2A2A2A]">
                <td class="p-3 text-gray-200">
                    <button onclick="apriDomanda('${paginaCorrente}', '${domandaSanitizzata}', '${item.prof || ''}', '${parteEsame}')" 
                            class="text-left hover:text-indigo-400 underline decoration-gray-600 hover:decoration-indigo-400 transition-colors flex items-center gap-2 cursor-pointer">
                        📄 ${item.domanda}
                    </button>
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

    tbody.innerHTML = righeHTML;
}

// 5. Gestione filtri (Prof, Corso, Anno, Parte)
function applicaFiltri() {
    const profScelto = document.getElementById('filter-prof').value;
    const corsoScelto = document.getElementById('filter-corso').value;
    const annoScelto = document.getElementById('filter-anno') ? document.getElementById('filter-anno').value : 'all';
    const parteScelta = document.getElementById('filter-parte') ? document.getElementById('filter-parte').value : 'all';

    const datiFiltrati = elencoDomande.filter(item => {
        const matchProf = profScelto === 'all' || item.prof === profScelto;
        const matchCorso = corsoScelto === 'all' || item.corso === corsoScelto;
        
        const annoItem = estraiAnno(item.data);
        const matchAnno = annoScelto === 'all' || annoItem === annoScelto;

        const parteItem = item.parte || 'Intero';
        const matchParte = parteScelta === 'all' || parteItem === parteScelta;
        
        return matchProf && matchCorso && matchAnno && matchParte;
    });

    renderTabella(datiFiltrati);
}

// Listener filtri
document.getElementById('filter-prof').addEventListener('change', applicaFiltri);
document.getElementById('filter-corso').addEventListener('change', applicaFiltri);
if (document.getElementById('filter-anno')) {
    document.getElementById('filter-anno').addEventListener('change', applicaFiltri);
}
if (document.getElementById('filter-parte')) {
    document.getElementById('filter-parte').addEventListener('change', applicaFiltri);
}

// --- GESTIONE VISTA RISPOSTA UTENTE ---
function apriDomanda(materia, domandaText, prof, parte) {
    const homeView = document.getElementById('home-view');
    const materiaView = document.getElementById('materia-view');
    const domandaView = document.getElementById('domanda-view');

    if (homeView) homeView.classList.add('hidden');
    if (materiaView) materiaView.classList.add('hidden');
    if (domandaView) domandaView.classList.remove('hidden');

    if (document.getElementById('dettaglio-materia')) {
        document.getElementById('dettaglio-materia').innerText = materia.replace('-', ' ');
    }
    if (document.getElementById('dettaglio-titolo')) {
        document.getElementById('dettaglio-titolo').innerText = domandaText;
    }
    if (document.getElementById('dettaglio-prof')) {
        document.getElementById('dettaglio-prof').innerText = prof;
    }
    if (document.getElementById('dettaglio-parte')) {
        document.getElementById('dettaglio-parte').innerText = parte;
    }

    domandaAttivaKey = `risposta_${materia}_${domandaText}`;
    const rispostaSalvata = localStorage.getItem(domandaAttivaKey) || '';
    if (document.getElementById('risposta-utente')) {
        document.getElementById('risposta-utente').value = rispostaSalvata;
    }
}

function salvaRisposta() {
    if (!domandaAttivaKey) return;
    const testo = document.getElementById('risposta-utente').value;
    localStorage.setItem(domandaAttivaKey, testo);

    const status = document.getElementById('salvataggio-status');
    if (status) {
        status.classList.remove('opacity-0');
        setTimeout(() => {
            status.classList.add('opacity-0');
        }, 2000);
    }
}

function tornaAllaMateria() {
    const domandaView = document.getElementById('domanda-view');
    const materiaView = document.getElementById('materia-view');
    
    if (domandaView) domandaView.classList.add('hidden');
    if (materiaView) materiaView.classList.remove('hidden');
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
