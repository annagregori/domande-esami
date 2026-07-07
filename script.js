let elencoDomande = [];
let paginaCorrente = "";

// 1. Inizializzazione del sito
async function inizializzaSito() {
    try {
        // Carica l'indice delle pagine per il menu laterale
        const responseMenu = await fetch('./menu.json');
        const pagine = await responseMenu.json();
        
        renderMenu(pagine);
        
        // Controlla se nell'URL c'è un parametro specifico (es. ?materia=politica-economica)
        const params = new URLSearchParams(window.location.search);
        const materiaUrl = params.get('materia');
        
        const paginaTrovata = pagine.find(p => p.id === materiaUrl);

        if (paginaTrovata) {
            // Se l'URL richiede una materia specifica, carica quella
            cambiaPagina(paginaTrovata.id, paginaTrovata.titolo);
        } else if (pagine.length > 0) {
            // Altrimenti carica la prima pagina dell'elenco come predefinita
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

    // --- MOSTRA IL FILTRO PARTE SOLO SU POLITICA ECONOMICA ---
    const boxFiltroParte = document.getElementById('box-filtro-parte');
    if (boxFiltroParte) {
        if (idPagina === 'domande-esami') {
            boxFiltroParte.classList.remove('hidden');
        } else {
            boxFiltroParte.classList.add('hidden');
        }
    }
    // --------------------------------------------------------

    try {
        // Carica il file JSON specifico (es: politica-economica.json)
        const responseDati = await fetch(`./${idPagina}.json`);
        elencoDomande = await responseDati.json();
        
        // Aggiorna dinamicamente i filtri in base ai dati della materia appena caricata
        aggiornaOpzioniFiltri(elencoDomande);

        // Resetta i filtri select a "Tutti" dopo averli rigenerati
        document.getElementById('filter-prof').value = 'all';
        document.getElementById('filter-corso').value = 'all';
        document.getElementById('filter-parte').value = 'all'; // Reset automatico del filtro parte
        
        // Disegna la tabella
        renderTabella(elencoDomande);
    } catch (error) {
        console.error(`Errore nel caricare i dati della pagina ${idPagina}:`, error);
        document.getElementById('table-body').innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-400">Impossibile trovare il file ${idPagina}.json</td></tr>`;
    }
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
        if (item.prof === 'Masi') profClass = 'bg-[#4C3A23] text-[#E1A95F]'; // Colore Ambra/Bronzo
        if (item.prof === 'Martucci') profClass = 'bg-[#1F3A44] text-[#4EBABA]'; // Colore Cyan/Ottanio
        if (item.prof === 'Non specificato') profClass = 'bg-[#4A2424] text-[#ECA2A2]'; 

        // Colore dinamico per il corso
        let corsoClass = 'bg-[#252525] text-gray-400 border border-[#3F3F3F]';
        if (item.corso === 'CLEA C') corsoClass = 'bg-[#1F3B4D] text-[#5CA3E6]';
        if (item.corso === 'CLEA A') corsoClass = 'bg-[#1C3D27] text-[#52BA6F]';
        if (item.corso === 'CLEA B') corsoClass = 'bg-[#3F2D54] text-[#B388EB]';
        if (item.corso === 'SCAMS' || item.corso === 'SCAMS C') corsoClass = 'bg-[#5C4033] text-[#E1A95F]';

        // Valore predefinito se la proprietà "parte" manca nel file JSON
        const parteEsame = item.parte || 'Intero';

        // Genera il blocco HTML della riga corrente (aggiornato a 5 colonne)
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
    const parteScelta = document.getElementById('filter-parte').value;

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
document.getElementById('filter-parte').addEventListener('change', applicaFiltri);

// Inizializza il sito al caricamento della pagina
window.addEventListener('DOMContentLoaded', inizializzaSito);
