let elencoDomande = [];
let paginaCorrente = "";

// 1. Inizializzazione del sito
async function inizializzaSito() {
    try {
        // Carica l'indice delle pagine per il menu laterale
        const responseMenu = await fetch('./menu.json');
        const pagine = await responseMenu.json();
        
        renderMenu(pagine);
        
        // Carica la prima pagina dell'elenco come predefinita
        if(pagine.length > 0) {
            cambiaPagina(pagine[0].id, pagine[0].titolo);
        }
    } catch (error) {
        console.error("Errore nell'inizializzazione:", error);
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
        
        // Al click cambia il database visualizzato
        link.onclick = () => cambiaPagina(pag.id, pag.titolo);
        
        menuContainer.appendChild(link);
    });
}

// 3. Cambia i dati visibili nella tabella in base alla pagina scelta
async function cambiaPagina(idPagina, titoloPagina) {
    paginaCorrente = idPagina;
    document.getElementById('page-title').innerHTML = titoloPagina;

    // Gestione della classe .active estetica nel menu
    document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
    const itemAttivo = document.getElementById(`menu-item-${idPagina}`);
    if(itemAttivo) itemAttivo.classList.add('active');

    // Resetta i filtri select a "Tutti" quando cambi materia
    document.getElementById('filter-prof').value = 'all';
    document.getElementById('filter-corso').value = 'all';

    try {
        // Carica il file JSON specifico (es: politica-economica.json)
        const responseDati = await fetch(`./${idPagina}.json`);
        elencoDomande = await responseDati.json();
        renderTabella(elencoDomande);
    } catch (error) {
        console.error(`Errore nel caricare i dati della pagina ${idPagina}:`, error);
        document.getElementById('table-body').innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-400">Impossibile trovare il file ${idPagina}.json</td></tr>`;
    }
}

// 4. Mostra i dati effettivi (Identica a prima)
function renderTabella(data) {
    const tbody = document.getElementById('table-body');
    
    // 1. Svuota la tabella prima di inserire i nuovi dati
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-500">Nessun risultato trovato</td></tr>`;
        return;
    }

    // 2. Accumula tutte le righe in una stringa di testo
    let righeHTML = '';

    data.forEach(item => {
        // Colore dinamico per i professori
        const profClass = item.prof === 'Imbert' 
            ? 'bg-[#1C3D27] text-[#52BA6F]' 
            : 'bg-[#4A2424] text-[#ECA2A2]';

        // Colore dinamico per il corso
        const corsoClass = item.corso === 'CLEA C' 
            ? 'bg-[#1F3B4D] text-[#5CA3E6]' 
            : 'bg-[#3F2D54] text-[#B388EB]';

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
                <td class="p-3 text-gray-400">${item.data}</td>
            </tr>
        `;
    });

    // 3. Inserisce tutte le righe insieme all'interno del corpo della tabella
    tbody.innerHTML = righeHTML;
}

// 5. Gestione filtri (Identica a prima)
function applicaFiltri() {
    const profScelto = document.getElementById('filter-prof').value;
    const corsoScelto = document.getElementById('filter-corso').value;

    const datiFiltrati = elencoDomande.filter(item => {
        const matchProf = profScelto === 'all' || item.prof === profScelto;
        const matchCorso = corsoScelto === 'all' || item.corso === corsoScelto;
        return matchProf && matchCorso;
    });

    renderTabella(datiFiltrati);
}

document.getElementById('filter-prof').addEventListener('change', applicaFiltri);
document.getElementById('filter-corso').addEventListener('change', applicaFiltri);

// Avvia il sito
inizializzaSito();
